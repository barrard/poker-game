const { v4: uuidv4 } = require("uuid");
const PokerGame = require("./PokerGame");
module.exports = class Game {
    constructor({ socketIo, waitingRoom }) {
        this.id = uuidv4();
        this.socketIo = socketIo;
        this.waitingRoom = waitingRoom;

        // this.createdBy = user.id;
        //  this.players= { [user.id]: { ...user, score: 0, position: 0 } },
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
        this.sockets = {};
        this.dealer = 0; //this is player position
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

    removePlayer(user, socket, game) {
        console.log(`Removing player ${user.id}`);
        let player = this.players[user.id];
        socket.join(this.waitingRoom);
        delete this.players[user.id];
        socket.leave(game.id);
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
        //start dealing
        //starting with.... player AFTER the dealer
        let positionsToDeal = this.findFirstAvailablePosition({
            startingPos: dealer + 1,
            collect: true,
            isEmpty: false,
        });
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
        await this.waitFor(1000);
        this.positionsToBet = this.findFirstAvailablePosition({
            startingPos: dealer + 1,
            collect: true,
            isEmpty: false,
        });

        this.bettersTurn = this.positionsToBet.shift();
        this.emitGameStateUpdate();
        this.emitToRoom("playersBettingTurn", this.bettersTurn);

        this.betTime = setTimeout(() => {
            this.bettersTurnOutOfTime = this.bettersTurn;
            this.emitToRoom("playersBettingTurnOutOfTime", this.bettersTurn);
            this.bettersTurn = null;
            this.emitGameStateUpdate();
        }, 1000 * 20);
    }

    dealCardsToPlayers(positionsToDeal) {
        const timeToDeal = positionsToDeal.length * this.timeToDeal;
        this.dealCardToPlayers(positionsToDeal);
        // setTimeout(() => {
        this.dealCardToPlayers(positionsToDeal);
        // }, timeToDeal);
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
            this.smallBlind = this.findFirstAvailablePosition({
                startingPos: this.dealer + 1,
                isEmpty: false,
            });
        }
        if (bigBlind == undefined || !this.positions[bigBlind]) {
            this.bigBlind = this.findFirstAvailablePosition({
                startingPos: this.smallBlind + 1,
                isEmpty: false,
            });
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
