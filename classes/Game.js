const { v4: uuidv4 } = require("uuid");
const PokerGame = require("./PokerGame");
const { waitFor } = require("../service/serverUtils");
module.exports = class Game {
    constructor({ socketIo, waitingRoom }) {
        this.id = uuidv4();
        this.socketIo = socketIo;
        this.waitingRoom = waitingRoom;
        this.bet = { bigBlind: 10, smallBlind: 5, biggestBet: 0 };
        this.pot = 0;
        this.waitFor = waitFor;

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
        //Starting state
        this.positionsToBet = [];
        this.positionsDealt = [];
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

        socket.leave(this.id);
        // var playerCount = this.getPlayerCount();
        // if (playerCount < 2) this.state = 1; //game is not active!!
        if (!player) {
            console.log("whooo?");
            console.log("whooo?");
            console.log("whooo?");
            console.log("whooo?");
            console.log("whooo?");
            throw Error("I dont like this");
        }

        //was this player betting?
        const playerIsBetting = this.bettersTurn?.position === player.position;
        if (playerIsBetting) {
            //fold them
            this.handlePlayerFold(player.position);
        }

        delete this.players[user.id];
        delete this.positions[player.position];
        delete this.sockets[player.position];
        var playerCount = this.getPlayerCount();
        if (playerCount < 2) this.state = 0; //game is not active!!

        this.emitToRoom("removePlayer", player.position);
        this.nextPositionToBet();
        this.emitGameStateUpdate();
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
            return true;
        }
    }

    playerHasJoined(user, socket) {
        //make sure we know who this person is?
        const gotPlayer = this.players[user.id];
        let playerCount = this.getPlayerCount();
        if (!gotPlayer) {
            //someone joined directly
            const didAdd = this.addPlayer(user, socket);
            if (!didAdd) {
                return;
            }
        }

        this.emitToRoom("addPlayer", this.players[user.id]);

        if (playerCount == 2) {
            //this is the second person to join and the game can now start.
            //and game may now start
            this.startGame(); //TESTING
        }
    }

    getPlayerCount() {
        return Object.keys(this.players).length;
    }

    settleBets() {
        if (this.dealer !== undefined) {
            let player = this.findFirstAvailablePosition({
                startingPos: this.dealer.position + 1,
                isEmpty: false,
            });
            this.dealer = player;
        } else this.dealer = undefined;
        //current bet size
        this.bet.biggestBet = 0;
        this.currentRoundState = 0;
        this.smallBlind = undefined;
        this.bigBlind = undefined;
        this.positionsToBet = [];
        this.positionsDealt = [];
        this.pot = 0;
        this.cardsDealt = false;

        //each players currentBet
        this.resetEachPlayer("bet", 0);
        this.resetEachPlayer("hasBet", false);
        this.resetEachPlayer("hasFolded", false);
        this.resetEachPlayer("hand", []);
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
        let playerCount = this.getPlayerCount();
        if (playerCount < 2) {
            this.state = 0; //game is not active!!
            this.emitGameStateUpdate();
            return console.log("this game is over?");
        }
        this.state = 1; // game started
        this.emitGameStateUpdate();
        let players = this.findFirstAvailablePosition({
            collect: true,
            isEmpty: false,
        });
        this.pokerGame = new PokerGame({ players });
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
        await this.determineDealerBigSmall();
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
            startingPos: dealer.position + 1,
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
        this.beginBetting({ startingBetPosition: this.bigBlind.position });
    }

    async beginBetting({ startingBetPosition }) {
        await this.waitFor(3000);
        this.positionsToBet = this.findFirstAvailablePosition({
            startingPos: startingBetPosition + 1,
            collect: true,
            update: (player) => {
                player.hasBet = false;
            },
            isEmpty: false,
        });

        this.bettersTurn = this.positionsToBet[0];
        this.emitGameStateUpdate();
        this.emitNextPlayerToBet(); //TESTING THE FOLD!!!
    }

    emitNextPlayerToBet() {
        const currentBetSize = this.bet.biggestBet;
        const player = this.bettersTurn; //this.positions[this.bettersTurn];
        if (!player) {
            //todo, fold and remove player from game
            // throw Error("This player left?!?");
            // this.removePlayer(user, socket);
            this.nextPositionToBet();
        }
        const hasBetSize = player.bet;
        player.hasBet = true;
        //and has the player had a chance to bet?? ( applies to the big Blind pre-flop)
        this.emitToRoom("playersBettingTurn", {
            toCall: currentBetSize - hasBetSize,
            positionsTurn: this.bettersTurn.position,
        });

        this.betTime = setTimeout(() => {
            this.bettersTurnOutOfTime = this.bettersTurn.position;
            this.emitToRoom(
                "playersBettingTurnOutOfTime",
                this.bettersTurn.position
            );

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
        positionsToDeal.forEach((player, i) => {
            //   setTimeout(() => {
            // const player = this.positions[position];
            // console.log(player);
            //sanity check
            // if (player.position !== position) {
            //     throw new Error(
            //         `Why positions not correct player.position- ${player.position} position- ${position}`
            //     );
            // }
            const card = this.pokerGame?.dealPlayer(player);
            // player.hand.push(card);
            //   }, i * this.timeToDeal);
        });
    }

    async determineDealerBigSmall() {
        const { dealer, bigBlind, smallBlind } = this;

        //do we have a player at these positions?
        //make sure we have an active dealer
        if (dealer == undefined) {
            this.dealer = this.findFirstAvailablePosition({ isEmpty: false });
            this.emitToRoom("setDealerChip", this.dealer);
        } else {
            this.emitToRoom("setDealerChip", this.dealer);
        }
        await this.waitFor(1000);
        if (smallBlind == undefined) {
            const smallBlind = this.handleSmallBlind();
            this.emitToRoom("setSmallBlindChip", smallBlind);
        }
        await this.waitFor(1000);
        // return;

        if (bigBlind == undefined) {
            const bigBlind = this.handleBigBlind();
            this.emitToRoom("setBigBlindChip", bigBlind);
        }
        await this.waitFor(1000);
    }

    handleBigBlind() {
        this.bigBlind = this.findFirstAvailablePosition({
            startingPos: this.smallBlind.position + 1,
            isEmpty: false,
        });
        this.updateBetAndPot(this.bigBlind, this.bet.bigBlind);
        return this.bigBlind;
    }

    handleSmallBlind() {
        this.smallBlind = this.findFirstAvailablePosition({
            startingPos: this.dealer.position + 1,
            isEmpty: false,
        });
        this.updateBetAndPot(this.smallBlind, this.bet.smallBlind);
        return this.smallBlind;
    }

    updateBetAndPot(player, betSize) {
        // const player = this.positions[position];

        player.chips -= betSize;
        this.pot += betSize;

        if (!player) {
            throw new Error("update bet for unknown player?");
        }
        if (player.bet === undefined) {
            player.bet = 0;
            throw new Error("why????");
        }
        player.bet += betSize;
        if (player.bet > this.bet.biggestBet) {
            this.bet.biggestBet = player.bet;
        }

        // this.emitToRoom("playerBet", { position: position, bet: betSize });
        this.emitToRoom("chipBalance", {
            position: player.position,
            chips: player.chips,
            pot: this.pot,
            bet: this.bet.biggestBet,
        });
        this.emitGameStateUpdate();
    }

    handlePlayerBet(player, bet) {
        // const player = this.positions[playerPosition];
        if (bet > player.chips) {
            return console.error("How are you betting more than you got");
        }
        player.hasBet = true;
        this.updateBetAndPot(player, bet);

        // this.nextPositionToBet();
    }

    handlePlayerCheck(playerPosition) {
        const player = this.positions[playerPosition];
        //make sure they can check
        const playerCurrentBet = player.bet;
        const biggestBet = this.bet.biggestBet;
        if (playerCurrentBet !== biggestBet) {
            console.log("You cant check this one");
            const socket = this.sockets[player.position];

            return socket.emit(
                "error",
                "You can't check your way out of this one"
            );
        }
        // player.bet = 0;//nooooo baaadddd
        player.hasBet = true;
        this.emitToRoom("playerCheck", {
            position: playerPosition,
        });
        // this.nextPositionToBet();
    }

    handlePlayerFold(playerPosition) {
        const player = this.positions[playerPosition];
        player.hasFolded = true;
        this.removePositionToBet(playerPosition);
        this.emitToRoom("playerFold", {
            position: playerPosition,
        });
        // this.nextPositionToBet();
    }

    async nextPositionToBet() {
        clearTimeout(this.betTime);
        const lastBetter = this.bettersTurn;
        if (!this.positionsToBet.length) {
            return this.endGame();
        }

        this.emitToRoom("playerTurnEnd", {
            position: lastBetter.position,
        });

        const nextPlayer = this.findFirstAvailablePosition({
            startingPos: this.bettersTurn.position + 1,
            isEmpty: false,
        });

        // const nextPlayer = this.positions[possibleNextBetter];
        //check total players to bet
        if (this.positionsToBet.length === 1) {
            //if( && nextPlayer?.hasBet){}
            //only 1 player in the game, I think we have a winner
            this.emitToRoom("playerWins", {
                type: "No Show",
                position: nextPlayer.position, //possibleNextBetter,
                lastPosition: lastBetter.position,
            });
            await this.waitFor(3000);
            this.startGame();
            return;
        }

        const player = nextPlayer; //this.positions[possibleNextBetter];
        if (!player) {
            return this.nextPositionToBet();
        }
        const playerCurrentBet = player.bet;
        const hasBet = player.hasBet;

        //has this player meet the needs to progress?
        //has this player folded?

        //check the bets
        if (!hasBet) {
            //yes this player needs to do something
            this.bettersTurn = player;
            this.emitNextPlayerToBet();
        } else if (playerCurrentBet < this.bet.biggestBet) {
            this.bettersTurn = player;
            this.emitNextPlayerToBet();
        } else {
            const totalRounds = Object.keys(this.roundStates).length;
            //deal the next round
            const currentRoundState = this.currentRoundState;

            const nextRoundState = currentRoundState + 1;
            if (nextRoundState > totalRounds - 1) {
                //SHOWDOWN TIME!!!
                const winner = this.pokerGame.determineWinner();
                this.emitToRoom("playerWins", {
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
                    this.beginBetting({
                        startingBetPosition: this.dealer.position,
                    });

                    return;
                } else if (nextRound === "Turn") {
                    const board = this.dealCardsToBoard([3]);
                    //deal 1 more cards to the board
                    this.emitToRoom("theTurn", {
                        turn: board[3],
                    });
                    this.currentRoundState = nextRoundState;
                    this.beginBetting({
                        startingBetPosition: this.dealer.position,
                    });
                    return;
                } else if (nextRound === "River") {
                    const board = this.dealCardsToBoard([4]);
                    //deal 1 more cards to the board
                    this.emitToRoom("theRiver", {
                        river: board[4],
                    });
                    this.currentRoundState = nextRoundState;
                    this.beginBetting({
                        startingBetPosition: this.dealer.position,
                    });
                    return;
                }
            }
        }
    }

    endGame() {
        this.state = 0; //game is not active!!

        return this.emitGameStateUpdate();
    }

    handlePlayerOutOfTime() {
        //can this player check or fold?
        const player = this.bettersTurn; // this.positions[this.bettersTurn];
        if (!player) {
            console.log("This guy left");
            // this.removePlayer(user, socket);
            return;
        }
        const playerCurrentBet = player.bet;
        const biggestBet = this.bet.biggestBet;
        if (playerCurrentBet < biggestBet) {
            //you folded
            this.handlePlayerFold(this.bettersTurn.position);
            this.nextPositionToBet();
        } else {
            //you checked
            this.handlePlayerCheck(this.bettersTurn.position);
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
        const numbers = this.positionsToBet.map((p) => p.position);
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
            update, //= ()=>{}
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
            let player = this.positions[position];
            if (isEmpty && !player) {
                //this position is empty
                if (update) {
                    update(player);
                }
                return position;
            } else if (!isEmpty && player) {
                //this position is not empty
                if (update) {
                    update(player);
                }
                if (collect) {
                    playersOrder.push(player);
                    position++;
                    count++;
                } else {
                    return player;
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
