const { v4: uuidv4 } = require("uuid");
const PokerGame = require("./PokerGame");
module.exports = class Game {
    constructor({ socketIo, waitingRoom }) {
        this.id = uuidv4();
        this.socketIo = socketIo;
        this.waitingRoom = waitingRoom;
        this.bet = { bigBlind: 10, smallBlind: 5, biggestBet: 0 };
        this.pot = 0;

        this.allowedBetTime = 20;
        this.currentRoundState = 0;

        this.roundStates = {
            0: "Pre-Flop",
            1: "Flop",
            2: "Turn",
            3: "River",
        };

        this.players = {};
        this.positions = {
            0: null,
            1: null,
            2: null,
            3: null,
            4: null,
            5: null,
            6: null,
        };
        this.positionsDealt = [];
        this.sockets = {};
        this.dealer; //this is player position
        this.smallBlind; //= 1; //position,
        this.bigBlind; //= 2; //position
        this.state = 0; //means needs more people
        this.playerLimit = 7;
        this.socketIo
            .to(this.waitingRoom)
            .emit("gameRoomCreated", this.getState());
        this.timeToDeal = 2000;
        this.cardsDealt = false;
        this.bettersTurn = undefined;
        this.bettersTurnOutOfTime = undefined;
    }
    async waitFor(time) {
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                return resolve();
            }, time);
        });
    }

    getState() {
        return {
            id: this.id,
            //   createdBy: this.createdBy,
            players: this.players,
            positions: this.positions,
            dealer: this.dealer,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind,
            state: this.state,
            cardsDealt: this.cardsDealt,
            bettersTurn: this.bettersTurn,
            bettersTurnOutOfTime: this.bettersTurnOutOfTime,
        };
    }

    removePlayer(user, socket) {
        console.log(`Removing player ${user.id}`);
        let player = this.players[user.id];
        socket.join(this.waitingRoom);
        delete this.players[user.id];
        socket.leave(this.id);
        if (player) {
            delete this.positions[player.position];
            delete this.sockets[player.position];
        } else {
            console.log("whooo?");
            return;
        }
        this.emitGameStateUpdate();
        this.emitToRoom("removePlayer", player.position);
    }

    async addPlayer(user, socket) {
        //check game player limit
        let playerCount = Object.keys(this.players).length;
        if (playerCount >= this.playerLimit) {
            return socket.emit("error", {
                msg: "This game has reached its player limit",
            });
        } else {
            //just add the player already
            this.players[user.id] = user;
            //find the first open seat
            const openSeatPosition = this.findFirstAvailablePosition();
            this.players[user.id].position = parseInt(openSeatPosition);
            this.sockets[openSeatPosition] = socket;
            this.positions[openSeatPosition] = user;
            const game = this.getState();
            socket.emit("joiningGame", game);
            socket.leave(this.waitingRoom);
            socket.join(game.id);

            this.emitGameStateUpdate();
            this.emitToRoom("addPlayer", this.players[user.id]);

            let playerCount = Object.keys(this.players).length;

            if (playerCount == 2) {
                //this is the second person to join and the game can now start.
                //this person will be small blind
                await this.waitFor(1000);

                //and game may now start
                this.startGame();
            }
        }
    }

    settleBets() {
        if (this.dealer === 0) {
            this.dealer++;
        } else this.dealer = 0;
        //current bet size
        this.bet.biggestBet = 0;
        this.currentRoundState = 0;

        //each players currentBet
        this.resetEachPlayer("bet", 0);
        this.resetEachPlayer("hasBet", false);
        this.resetEachPlayer("hasFolded", false);
        // this.resetEachPlayer("bet", 0);
    }

    resetEachPlayer(key, value) {
        Object.keys(this.positions).forEach((position) => {
            const player = this.positions[position];
            if (!player) {
                return;
            }
            player[key] = value;
        });
    }

    //Starts a new game
    startGame() {
        this.state = 1; // game started
        this.emitGameStateUpdate();
        let playerPositions = this.findFirstAvailablePosition({
            collect: true,
            isEmpty: false,
        });
        this.pokerGame = new PokerGame({ playerPositions });
        this.dealHands();
    }
    async dealHands() {
        if (this.state < 1) {
            this.emitGameStateUpdate();

            return console.log("this game needs more players");
        }
        this.state = 2; //hands are dealt - new players must wait
        //start dealing
        this.settleBets();
        //determine big and small blind
        this.determineDealerBigSmall();
        //ensure we got'em all
        const { dealer, bigBlind, smallBlind } = this;
        if (
            dealer == undefined ||
            bigBlind == undefined ||
            smallBlind == undefined
        ) {
            throw new Error("SHEET");
        }

        //starting with.... player AFTER the dealer
        let positionsToDeal = this.findFirstAvailablePosition({
            startingPos: dealer + 1,
            collect: true,
            isEmpty: false,
        });
        this.positionsDealt = positionsToDeal;
        this.emitToRoom("cardsDealt", this.positions);
        this.dealCardsToPlayers(positionsToDeal);
        this.cardsDealt = true;
        this.emitGameStateUpdate();
        // await this.waitFor(3000);
        //for Each player, emit to them thier hand
        Object.keys(this.players).forEach((playerId) => {
            const player = this.players[playerId];
            const socket = this.sockets[player.position];
            socket.emit("yourHand", player.hand);
        });
        this.beginBetting({ startingBet: this.bigBlind });
    }

    async beginBetting({ startingBet }) {
        await this.waitFor(3000);
        this.positionsToBet = this.findFirstAvailablePosition({
            startingPos: startingBet + 1,
            collect: true,
            isEmpty: false,
        });

        this.bettersTurn = this.positionsToBet[0];
        this.emitGameStateUpdate();
        this.emitNextPlayerToBet();
    }

    emitNextPlayerToBet() {
        const currentBetSize = this.bet.biggestBet;
        const player = this.positions[this.bettersTurn];
        if (!player) {
            throw Error("This player left?!?");
        }
        const hasBetSize = player.bet;
        player.hasBet = true;
        //and has the player had a chance to bet?? ( applies to the big Blind pre-flop)
        this.emitToRoom("playersBettingTurn", {
            toCall: currentBetSize - hasBetSize,
            positionsTurn: this.bettersTurn,
        });

        this.betTime = setTimeout(() => {
            this.bettersTurnOutOfTime = this.bettersTurn;
            this.emitToRoom("playersBettingTurnOutOfTime", this.bettersTurn);

            this.emitGameStateUpdate();

            this.handlePlayerOutOfTime();
        }, 1000 * this.allowedBetTime);
    }

    dealCardsToPlayers(positionsToDeal) {
        // const timeToDeal = positionsToDeal.length * this.timeToDeal;
        this.dealCardToPlayers(positionsToDeal);
        // setTimeout(() => {
        this.dealCardToPlayers(positionsToDeal);
        // }, timeToDeal);
    }

    dealCardsToBoard(positionsToDeal) {
        positionsToDeal.forEach((position, i) => {
            const card = this.pokerGame?.dealBoard(position);
        });
        return this.pokerGame.board;
    }

    dealCardToPlayers(positionsToDeal) {
        positionsToDeal.forEach((position, i) => {
            //   setTimeout(() => {
            const player = this.positions[position];
            console.log(player);
            //sanity check
            if (player.position !== position) {
                throw new Error(
                    `Why positions not correct player.position- ${player.position} position- ${position}`
                );
            }
            const card = this.pokerGame?.dealPlayer(position);
            player.hand.push(card);
            //   }, i * this.timeToDeal);
        });
    }

    determineDealerBigSmall() {
        const { dealer, bigBlind, smallBlind } = this;

        //do we have a player at these positions?
        //make sure we have an active dealer
        if (dealer == undefined || !this.positions[dealer]) {
            this.dealer = this.findFirstAvailablePosition({ isEmpty: false });
        }
        if (smallBlind == undefined || !this.positions[smallBlind]) {
            this.handleSmallBlind();
        }
        if (bigBlind == undefined || !this.positions[bigBlind]) {
            this.handleBigBlind();
        }
    }

    handleBigBlind() {
        this.bigBlind = this.findFirstAvailablePosition({
            startingPos: this.smallBlind + 1,
            isEmpty: false,
        });
        this.updateBetAndPot(this.bigBlind, this.bet.bigBlind);
    }

    handleSmallBlind() {
        this.smallBlind = this.findFirstAvailablePosition({
            startingPos: this.dealer + 1,
            isEmpty: false,
        });
        this.updateBetAndPot(this.smallBlind, this.bet.smallBlind);
    }

    updateBetAndPot(position, betSize) {
        const player = this.positions[position];
        //TODO ensure the player really has the chips
        player.chips -= betSize;
        this.pot += betSize;

        if (!player) {
            throw new Error("updat bet for unknown player?");
        }
        if (!player.bet) {
            player.bet = 0;
        }
        player.bet += betSize;
        if (player.bet > this.bet.biggestBet) {
            this.bet.biggestBet = player.bet;
        }

        this.emitToRoom("chipBalance", {
            position,
            chips: player.chips,
            pot: this.pot,
            bet: this.bet.biggestBet,
        });
        this.emitGameStateUpdate();
    }

    handlePlayerBet(playerPosition, bet) {
        // const player = this.positions[playerPosition];
        // //bake sure they got the big blind//TODO in this actualy function
        // player.chips -= bet;
        const player = this.positions[playerPosition];
        player.hasBet = true;
        this.updateBetAndPot(playerPosition, bet);

        // const socket = this.sockets[playerPosition];
    }

    handlePlayerCheck(playerPosition) {
        const player = this.positions[playerPosition];
        player.hasBet = true;
        this.emitToRoom("playerCheck", {
            position: playerPosition,
        });
    }

    handlePlayerFold(playerPosition) {
        const player = this.positions[playerPosition];
        player.hasFolded = true;
        this.removePositionToBet(playerPosition);
        this.emitToRoom("playerFold", {
            position: playerPosition,
        });
    }

    async nextPositionToBet() {
        clearTimeout(this.betTime);
        const lastPositionBet = this.bettersTurn;

        this.emitToRoom("playerTurnEnd", {
            position: lastPositionBet,
        });

        const possibleNextBetter = this.findFirstAvailablePosition({
            startingPos: this.bettersTurn + 1,
            isEmpty: false,
        });

        if (this.positionsToBet.length === 1) {
            //only 1 player in the game, I think we have a winner
            this.emitToRoom("playerWins", {
                type: "No Show",
                position: possibleNextBetter,
                lastPosition: lastPositionBet,
            });
            return;
        }

        //check total players to bet
        const player = this.positions[possibleNextBetter];
        const playerCurrentBet = player.bet;
        const hasBet = player.hasBet;

        //has this player meet the needs to progress?
        //has this player folded?

        //check the bets
        if (!hasBet) {
            //yes this player needs to do something
            this.bettersTurn = possibleNextBetter;
            this.emitNextPlayerToBet();
        } else if (playerCurrentBet < this.bet.biggestBet) {
            this.bettersTurn = possibleNextBetter;
            this.emitNextPlayerToBet();
        } else {
            const totalRounds = Object.keys(this.roundStates).length;
            //deal the next round
            const currentRoundState = this.currentRoundState;

            const nextRoundState = currentRoundState + 1;
            if (nextRoundState > totalRounds - 1) {
                //SHOWDOWN TIME!!!
                const winner = this.pokerGame.determineWinner();
                this.emitToRoom("winningHand", {
                    winner,
                });
                await this.waitFor(3000);
                this.startGame();
                // throw new Error("TODO SHOWDOWN");
            } else {
                //check current roundState
                const nextRound = this.roundStates[nextRoundState];
                if (nextRound === "Flop") {
                    const board = this.dealCardsToBoard([0, 1, 2]);
                    //deal 3 more cards to the board
                    this.emitToRoom("theFlop", {
                        flop: board,
                    });
                    this.currentRoundState = nextRoundState;
                    this.beginBetting({ startingBet: this.dealer });

                    return;
                } else if (nextRound === "Turn") {
                    const board = this.dealCardsToBoard([3]);
                    //deal 1 more cards to the board
                    this.emitToRoom("theTurn", {
                        turn: board[3],
                    });
                    this.currentRoundState = nextRoundState;
                    this.beginBetting({ startingBet: this.dealer });
                    return;
                } else if (nextRound === "River") {
                    const board = this.dealCardsToBoard([4]);
                    //deal 1 more cards to the board
                    this.emitToRoom("theRiver", {
                        river: board[4],
                    });
                    this.currentRoundState = nextRoundState;
                    this.beginBetting({ startingBet: this.dealer });
                    return;
                }
            }
        }
    }

    handlePlayerOutOfTime() {
        //can this player check or fold?
        const player = this.positions[this.bettersTurn];
        if (!player) {
            console.log("This guy left");
        }
        const playerCurrentBet = player.bet;
        const biggestBet = this.bet.biggestBet;
        if (playerCurrentBet < biggestBet) {
            //you folded
            this.handlePlayerFold(this.bettersTurn);
            this.nextPositionToBet();
        } else {
            //you checked
            this.handlePlayerCheck(this.bettersTurn);
            this.nextPositionToBet();
        }
    }

    emitToRoom(event, data) {
        this.socketIo.to(this.id).emit(event, data);
    }

    //TODO: Sanitize this data
    emitGameStateUpdate() {
        const gameState = this.getState();

        this.emitToRoom("gameState", gameState);

        this.socketIo.to(this.waitingRoom).emit("updateGameList", gameState);
    }

    removePositionToBet(position) {
        const numbers = this.positionsToBet;
        const numberToRemove = position;

        const index = numbers.findIndex((number) => number === numberToRemove);
        if (index !== -1) {
            const removedNumber = numbers[index];
            const slicedArray = numbers
                .slice(0, index)
                .concat(numbers.slice(index + 1));

            this.positionsToBet = slicedArray;
        } else {
            console.log("Number not found in the array.");
            throw Error("Cant find this position in positionsToBet");
        }
    }

    findFirstAvailablePosition(opts = {}) {
        const {
            startingPos = 0,
            isEmpty = true,
            collect = false,
            ignorePositions = [],
        } = opts;
        let position = startingPos;
        const playersOrder = [];
        if (position == undefined) {
            position = 0;
        }
        let count = 0;
        while (count < this.playerLimit) {
            if (position > this.playerLimit - 1) {
                position = 0;
            }
            let _pos = this.positions[position];
            if (isEmpty && !_pos) {
                //this position is empty
                return position;
            } else if (!isEmpty && _pos) {
                //this position is not empty
                if (collect) {
                    playersOrder.push(position);
                    position++;
                    count++;
                } else {
                    return position;
                }
            } else {
                position++;
                count++;
            }
        }
        if (collect) {
            return playersOrder;
        } else {
            return false;
        }
    }
};

/**
 * Poker game states
 * 0 needs more players
 * 1 game in progress
 * 2 dealing blind
 *    --who is big blind and small blind
 * 3 betting blind
 * 4 dealing flop
 * 5 betting flop
 * 6 dealing turn
 * 7 betting turn
 * 8 dealing river
 * 9 betting river
 * 10 showdown
 *
 */
