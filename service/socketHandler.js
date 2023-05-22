const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");
const Game = require("../classes/Game");
const GamesManage = require("../classes/GamesManager");

const games = new GamesManage();
const userGames = {};
let socketIo;
const sockets = {};
const socketIds = {};
const waitingRoom = "waiting room";

const playerLimit = 7;
module.exports = (io) => {
    socketIo = io;
    io.on("connection", async (socket) => {
        console.log("CONNECTED");
        socket.join(waitingRoom);
        //create uuid

        let user = await getUser();
        console.log("a user connected assigned as " + user.name);
        sockets[user.id] = socket;
        console.log(socket.id);
        socketIds[socket.id] = user;
        //send the user thier ID
        socket.emit("setUser", user);
        //send them all the games
        socket.emit("gameList", games.getGamesState());

        socket.on("createGame", () => {
            let user = socketIds[socket.id];
            if (!user) return console.log("No user found");
            //make sure they havent already started a game
            if (userGames[user.id]) {
                //already have a game started
                socket.emit("error", {
                    msg: `You already have a game at ${userGames[user.id]}`,
                });
            } else {
                //create game id
                // let game = createNewGame(user);
                let game = new Game({ socketIo, waitingRoom });
                game.addPlayer(user, socket);
                // let position = game.players[user.id].position;
                games.addGame(game);
                // console.log({ game, position });
                // socket.leave(waitingRoom);
                // socket.join(game.id);
                // socket.emit("joiningGame", { game });
            }
        });

        socket.on("joinGame", (gameId) => {
            //user wants to join this game
            joinGame(socket, gameId);
        });

        // socket.on("selectBox", ({ boxId, gameId }) => {
        //   let game = games[gameId];
        //   if (!game) {
        //     socket.emit("error", {
        //       msg: `Game doesn't exist`,
        //     });
        //     return socket.emit("updateCurrentGame", null);
        //   }
        //   let box = game.boxes[boxId];
        //   let user = socketIds[socket.id];
        //   if (!user) return console.log("No user found");
        //   let player = game.players[user.id];
        //   if (!player) return console.log("No user found");
        //   let color = player.color;
        //   if (!box.color) {
        //     box.color = color;
        //     player.score++;
        //     game.availableBoxes--;
        //   }
        //   io.to(gameId).emit("updateCurrentGame", game);
        //   if (game.availableBoxes === 0) {
        //     game.state = 3;
        //     //get the winner
        //     let highScore = 0;
        //     let winner;
        //     Object.keys(game.players).forEach((userId) => {
        //       let { score } = game.players[userId];
        //       if (score > highScore) {
        //         highScore = score;
        //         winner = game.players[userId];
        //       }
        //     });
        //     game.winner = winner;
        //     io.to(gameId).emit("updateCurrentGame", game);
        //     io.to(waitingRoom).emit("updateGameList", game);
        //   }
        // });

        socket.on("disconnect", () => {
            let userId = socketIds[socket.id];
            console.log(`user ${userId} disconnected`);
        });
    });
};

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
        return { name, pic, id, hand };
    } catch (err) {
        console.log(err);
        return false;
    }
}

function createNewGame(socketIo) {
    const game = new Game();

    return game;
}

function joinGame(socket, gameId) {
    let user = socketIds[socket.id];
    //make sure player limit is not reached
    let game = games.getGame(gameId);
    if (!game) {
        socket.emit("error", { msg: "Game does not exist" });
    }
    game.addPlayer(user, socket);
    // let playerCount = Object.keys(game.players).length;
    // if (playerCount >= playerLimit) {
    //   socket.emit("error", {
    //     msg: "This game has reached its player limit",
    //   });
    // } else {
    // if (Object.keys(game.players).length == 1) {
    //   //this is the second person to join and the game can now start.
    //   //this person will be small blind
    // }
    // game.players[user.id] = { ...user, score: 0, position: playerCount };
    //tell the socket to join the game
    // socket.emit("joiningGame", { game });
    //exit waiting room channel
    // socket.leave(waitingRoom);
    //update game list for waiting room
    //tell the game room someone joined.
    // socketIo.to(gameId).emit("updateCurrentGame", game);
    //tell socket to join the game channel
    // socket.join(gameId);
    //if the player count is hit, start game count down
    // if (Object.keys(game.players).length === playerLimit) {
    // console.log("the game is ready to start");
    // game.state = 1;
    // socketIo.to(gameId).emit("updateCurrentGame", game);
    // setTimeout(() => {
    //   game.state = 2;
    //   socketIo.to(gameId).emit("updateCurrentGame", game);
    //   socketIo.to(waitingRoom).emit("updateGameList", game);
    // }, 5000);
    // }
    // socketIo.to(waitingRoom).emit("updateGameList", game);
    // }
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
