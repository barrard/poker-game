const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");
const Game = require("../classes/Game");
const GamesManager = require("../classes/GamesManager");

const gamesManager = new GamesManager();
const userGames = {};
const socketRoomMap = {};
let socketIo;
const sockets = {};
const socketUserMap = {};
const waitingRoom = "waiting room";

const playerLimit = 7;
module.exports = (io) => {
    socketIo = io;

    io.on("connection", async (socket) => {
        socket.on("disconnect", () => {
            handleDisconnect(socket);
        });
        console.log("CONNECTED");
        joinRoom(socket, waitingRoom);
        //create uuid
        let user = await getUser();
        console.log("a user connected assigned as " + user.name);
        sockets[user.id] = socket;
        console.log(socket.id);
        socketUserMap[socket.id] = user;
        //send the user thier ID
        socket.emit("setUser", user);
        //send them all the gamesManager
        socket.emit("gameList", gamesManager.getGamesState());

        socket.on("createGame", () => {
            let user = socketUserMap[socket.id];
            if (!user) return console.log("No user found");

            let game = new Game({ socketIo, waitingRoom });
            joinRoom(socket, game.id);
            game.addPlayer(user, socket);
            // let position = game.players[user.id].position;
            gamesManager.addGame(game);
            io.to(waitingRoom).emit("gameList", gamesManager.getGamesState());
        });

        socket.on("joinGame", (gameId) => {
            //user wants to join this game
            joinGame(socket, gameId);
        });

        socket.on("hasJoined", () => {
            hasJoinedGame(socket);
        });

        socket.on("leaveGame", (gameId) => {
            //user wants to join this game
            leaveGame(socket, gameId);
        });

        socket.on("betCheckFold", (data) => {
            console.log(data);

            const roomId = getRoomId(socket);
            if (roomId === null) {
                return console.log("Room is nulllllll");
            }
            const game = gamesManager.getGame(roomId);

            const userSocket = verifyUserSocket(game, socket);

            console.log("WE GOOOD");
            //whats this gamesManager current biggest bet?
            const positionBetting = game.bettersTurn;
            const playerPosition = game.bettersTurn;
            if (positionBetting !== userSocket.position) {
                return socket.emit("error", {
                    msg: "Betting out of turn",
                });
            }
            const biggestBet = game.bet.biggestBet;
            const currentBetSize = game.bet.biggestBet;
            const playerChips = userSocket.chips;
            const player = game.positions[playerPosition];
            const playersCurrentBet = player.bet;
            const needsToBet = biggestBet - playersCurrentBet;

            //is this bet, check, fold?
            for (let action in data) {
                if (action === "bet") {
                    //does this bet meet or exceed th current bet?
                    const playersBet = data[action];
                    //does the player have enough to cover this bet?
                    if (playerChips < playersBet) {
                        return socket.emit("error", {
                            msg: "No Can Bet More Than You Got",
                        });
                        //Is the bet less than required amount
                    } else if (playersBet < needsToBet) {
                        //possible side game?
                        //players bet should be more than 0, and equal to all their remaining chips
                        if (playersBet === 0) {
                            return socket.emit("error", {
                                msg: "Almost had a side bet",
                            });
                        } else {
                            //TODO
                            //think more about how to handle this
                            game.handlePlayerBet(positionBetting, playersBet);
                            game.nextPositionToBet();

                            return socket.emit("error", {
                                msg: "Side bet initiated",
                            });
                        }
                    } else {
                        game.handlePlayerBet(positionBetting, playersBet);
                        game.nextPositionToBet();
                    }
                } else if (action === "check") {
                    //check if they can check

                    //is there a current bet you must match?
                    if (needsToBet > 0) {
                        return socket.emit("error", {
                            msg: "You can't Check",
                        });
                    } else {
                        game.handlePlayerCheck(playerPosition);
                        game.nextPositionToBet();
                    }
                } else if (action === "fold") {
                    game.handlePlayerFold(playerPosition);
                    game.nextPositionToBet();
                } else {
                    throw Error(`What is this ${action}`);
                }
            }
        });

        // ~~~~~~~~    TESTS!!!  ~~~~~~~~

        socket.on("testMyTurn", () => {
            //user wants to join this game
            // leaveGame(socket, gameId);
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            if (!game) return;
            game.bettersTurn = 0;
            game.emitToRoom("playersBettingTurn", {
                toCall: 10,
                positionsTurn: game.bettersTurn,
            });
        });

        socket.on("endMyTurn", () => {
            //user wants to join this game
            // leaveGame(socket, gameId);
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            if (!game) return;

            game.emitToRoom("playerTurnEnd", {
                position: 0,
            });
        });

        socket.on("TESTsetDealerChip", () => {
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            if (!game) return;
            game.emitToRoom("setDealerChip", { position: 0 });
        });

        socket.on("TESTsetBingBlind", () => {
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            if (!game) return;
            game.emitToRoom("setBigBlindChip", { position: 0 });
        });

        socket.on("TESTsetSmallBlind", () => {
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            if (!game) return;
            game.emitToRoom("setSmallBlindChip", { position: 0 });
        });
    });
};

function handleDisconnect(socket) {
    let user = socketUserMap[socket.id];
    // let roomId = socketRoomMap[socket.id];
    const roomId = getRoomId(socket);

    if (user === null) {
        console.log("user is nulllllll");
    } else {
        console.log(`user ${user?.name} disconnected`);
    }
    if (roomId === null) {
        return console.log("Room is nulllllll");
    }

    leaveGame(socket, roomId);
}
function getRoomId(socket) {
    const room = socketRoomMap[socket.id];
    // const roomMatches = [];
    // socket.rooms.forEach((r) => {
    //     const roomMatch = Object.keys(gamesManager.games).find(
    //         (roomId) => roomId === r
    //     );
    //     if (roomMatch) {
    //         roomMatches.push(roomMatch);
    //     }
    // });
    // if (roomMatches.length > 1 || roomMatches.length < 1) {
    //     return null;
    //     // throw Error("WHAT ROOOMS MATCH?!");
    // }
    // const roomId = roomMatches[0];
    return room;
}

function verifyUserSocket(game, socket) {
    const [socketPos, gameSocket] = Object.entries(game.sockets).find(
        ([pos, s]) => {
            if (s.id === socket.id) {
                return pos;
            }
        }
    );

    const userSocket = socketUserMap[socket.id];

    if (parseInt(socketPos) !== userSocket.position) {
        throw Error("WrongSocket Position");
    }
    return userSocket;
}

function joinRoom(socket, room) {
    socket.join(room);
    if (!socketRoomMap[socket.id]) {
        socketRoomMap[room] = "";
    }
    socketRoomMap[socket.id] = room;
}

function leaveRoom(socket, room) {
    const roomId = socketRoomMap[socket.id];
    if (!room) {
        console.log("No room");
    } else {
        delete socketRoomMap[socket.id];

        if (roomId === waitingRoom) {
            console.log("Later hater");
        } else {
            const game = gamesManager.games[roomId];
            let user = socketUserMap[socket.id];
            if (!user) {
                console.log("WTF??");
            }
            if (game) {
                game.removePlayer(user, socket);
            }
        }
    }
}

async function getUser() {
    try {
        let { results } = await rp("https://randomuser.me/api/", {
            json: true,
        });
        results = results[0];

        let { title, first, last } = results.name;
        let name = `${title} ${first} ${last}`;
        let pic = results.picture.medium;
        let id = results.login.uuid;
        let hand = [];
        let chips = 10000;
        return { name, pic, id, hand, chips };
    } catch (err) {
        console.log(err);
        return false;
    }
}

function createNewGame(socketIo) {
    const game = new Game();

    return game;
}

function hasJoinedGame(socket) {
    let user = socketUserMap[socket.id];
    let roomId = socketRoomMap[socket.id];
    let game = gamesManager.getGame(roomId);
    if (!game || roomId === "waiting room") {
        console.log("no game");
        //TODO move player to waiting room and emit game list state
        return;
    }
    game.playerHasJoined(user);
}
function leaveGame(socket, gameId) {
    let user = socketUserMap[socket.id];
    //make sure player limit is not reached
    let game = gamesManager.getGame(gameId);
    if (!game) {
        socket.emit("error", { msg: "Game does not exist" });
        socket.emit("gameList", gamesManager.getGamesState());

        return;
    }
    leaveRoom(socket, gameId);

    if (socket.connected) {
        joinRoom(socket, waitingRoom);
        socket.emit("gameList", gamesManager.getGamesState());
    }
}

function joinGame(socket, gameId) {
    let user = socketUserMap[socket.id];
    //make sure player limit is not reached
    let game = gamesManager.getGame(gameId);
    if (!game) {
        socket.emit("error", { msg: "Game does not exist" });
        socket.emit("gameList", gamesManager.getGamesState());

        return;
    }
    joinRoom(socket, game.id);

    game.addPlayer(user, socket);
}

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
