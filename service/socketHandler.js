const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");
const Game = require("../classes/Game");
const GamesManager = require("../classes/GamesManager");
const { waitFor } = require("../service/serverUtils");
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
        //create uuid
        let user = await createUser();
        console.log("a user connected assigned as " + user.name);
        sockets[user.id] = socket;
        console.log(socket.id);
        socketUserMap[socket.id] = user;
        //send the user thier ID
        socket.emit("setUser", user);
        //send them all the gamesManager

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

        socket.on("joinWaitingRoom", () => {
            console.log("adding socket to waiting room");
            joinRoom(socket, waitingRoom);
            socket.emit("gameList", gamesManager.getGamesState());
        });
        socket.on("joinGame", (gameId) => {
            //user wants to join this game
            joinGame(socket, gameId);
        });

        socket.on("hasJoined", (gameId) => {
            hasJoinedGame(socket, gameId);
        });

        socket.on("leaveGame", (gameId) => {
            //user wants to leave this game
            leaveGame(socket, gameId);
        });

        //DEPRECATED - i think
        socket.on("hasLeft", (position) => {
            //a player has emitted a hasLeft event and passed along their position.
            const roomId = getRoomId(socket);
            if (roomId === null) {
                return console.log("Room is nulllllll");
            }
            if (roomId === "waiting room") {
                return console.log("Later hater and or joined game");
            }
            const game = gamesManager.getGame(roomId);

            if (!game) {
                return console.error(`Game does not exist ${roomId}`);
            }
            //find the game, double check the position,
            const userSocket = verifyUserGame(game, socket);
            if (!userSocket) return;
            console.log("WE GOOOD");

            // and clear this person from the game
            delete game.positions[position];
            delete game.sockets[position];
            delete game.players[userSocket.id];
            game.removePlayer(userSocket, socket);
            game.emitGameStateUpdate();
        });

        socket.on("betCheckFold", (data) => {
            // console.log(data);

            const roomId = getRoomId(socket);
            if (roomId === null) {
                return console.log("Room is nulllllll");
            }
            const game = gamesManager.getGame(roomId);

            const userSocket = verifyUserGame(game, socket);
            if (!userSocket) return;

            console.log("WE GOOOD");
            //whats this gamesManager current biggest bet?
            const positionBetting = game.bettersTurn.position;
            const playerPosition = game.bettersTurn.position;
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
                        if (playersBet === 0 || playersBet < player.chips) {
                            return socket.emit("error", {
                                msg: "Invalid bet",
                            });
                        } else {
                            //TODO
                            //think more about how to handle this
                            game.handlePlayerBet(game.bettersTurn, playersBet);
                            game.nextPositionToBet();

                            return socket.emit("error", {
                                msg: "Side bet initiated",
                            });
                        }
                    } else {
                        game.handlePlayerBet(game.bettersTurn, playersBet);
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

        socket.on("TESTshowDown", () => {
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            if (!game) return;
            game.emitToRoom("showDown", [
                {
                    card1: "2C",
                    card2: "3C",
                },
                {
                    card1: "4C",
                    card2: "5C",
                },
            ]);
        });

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
        socket.on("testFold", async () => {
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            let user = socketUserMap[socket.id];

            if (!game) return;
            //need to mimic game start
            //deal cards
            game.state = 1;
            game.startGame();

            await waitFor(10000);
            //then test the fold
            game.emitToRoom("playerFold", { position: user.position });
        });

        socket.on("testBet", () => {
            const roomId = getRoomId(socket);
            const game = gamesManager.getGame(roomId);
            let user = socketUserMap[socket.id];

            if (!game) return;
            game.startGame();
            game.emitToRoom("playerBet", { position: user.position, bet: 10 });
        });
        socket.emit("connected");
    });
};

function handleDisconnect(socket) {
    const user = getUser(socket);
    const roomId = getRoomId(socket);

    removeSocket(socket, roomId, user);

    console.log(`user ${user?.name} disconnected`);
    console.log(`Room is ${roomId}`);
    if (user) {
        delete sockets[user.id];
    }
    delete socketUserMap[socket.id];
}
function getRoomId(socket) {
    const room = socketRoomMap[socket.id];

    return room;
}

function getUser(socket) {
    const user = socketUserMap[socket.id];

    return user;
}

function verifyUserGame(game, socket) {
    if (!Object.entries(game.sockets).length) return;
    const match = Object.entries(game.sockets).find(([pos, s]) => {
        if (s.id === socket.id) {
            return pos;
        }
    });

    if (!match) {
        return console.log(
            "When did you get removed?  And does everyone know about this?"
        );
    }
    const [socketPos, gameSocket] = match;
    const userSocket = socketUserMap[socket.id];

    if (parseInt(socketPos) !== userSocket.position) {
        // throw Error("WrongSocket Position");
        return false;
    }
    const playerAtPosition = game.positions[userSocket.position];
    if (playerAtPosition?.id !== userSocket.id) {
        return false;
    }

    const player = game.players[userSocket.id];
    if (parseInt(socketPos) !== player.position) {
        // throw Error("WrongSocket Position");
        return false;
    }
    return userSocket;
}

function joinRoom(socket, room) {
    socket.join(room);
    if (!socketRoomMap[socket.id]) {
        socketRoomMap[socket.id] = "";
    }
    socketRoomMap[socket.id] = room;
}

function leaveRoom(socket, room) {
    const roomId = socketRoomMap[socket.id];
    if (!room) {
        console.log("No room");
    } else {
        // delete socketRoomMap[socket.id];

        if (roomId === waitingRoom) {
            console.log("Later hater");
        } else {
            const game = gamesManager.games[roomId];
            let user = socketUserMap[socket.id];
            if (!user) {
                console.log("WTF??");
                throw Error("Hows this guy leaving?");
            }
            if (game) {
                game.removePlayer(user, socket);
            }
        }
    }
}

async function createUser() {
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

function hasJoinedGame(socket, gameId) {
    let user = socketUserMap[socket.id];
    // let roomId = socketRoomMap[socket.id];
    let game = gamesManager.getGame(gameId);
    if (!game || gameId === "waiting room") {
        console.log("no game");
        //TODO move player to waiting room and emit game list state
        //try join game?
        return;
    }
    game.playerHasJoined(user, socket);
}

function removeSocket(socket, gameId, user) {
    //we know a socket has left the server, but does the game know?
    let game = gamesManager.getGame(gameId);
    //does this game still know about the user?
    //check players, positions,

    const gameUser = game?.players?.[user.id];
    const gamePosition = game?.positions?.[user.position];
    const gameSocket = game?.sockets?.[user.position];

    if (gameUser || gamePosition || gameSocket) {
        game.removePlayer(user, socket);
    }

    //no matter what, we will remove the user from
    //the socket handler data
    delete socketUserMap[socket.id];
    delete socketRoomMap[socket.id];
}
function leaveGame(socket, gameId) {
    let user = socketUserMap[socket.id];

    console.log("leaveGame");
    let game = gamesManager.getGame(gameId);
    if (!game) {
        if (socket.connected) {
            socket.emit("error", { msg: "Game does not exist" });
        }
        return;
    } else {
        leaveRoom(socket, gameId);
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
