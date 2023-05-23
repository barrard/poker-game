import React, { useState, useEffect } from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";

import {
    Avatar,
    CountDown,
    Board,
    CreateGameBtn,
    JoinGameBtn,
    Alert,
} from "./components";
import Confetti from "react-confetti";

import "./App.css";
import socketIOClient from "socket.io-client";
import GameList from "./Pages/GameList";
import GameRoom from "./Pages/GameRoom";
const ENDPOINT = window.location.origin;

//pull somehing from codepen
//i want a confetti wining animation

//https://loading.io/background/m-confetti
//this one seems to try and make me buy it or something
//but i like it
//buy it?  buy what?
function App() {
    const [mySocket, setMySocket] = useState(null);
    const [user, setUser] = useState("");
    const [gameList, setGameList] = useState({});
    const [currentGame, setCurrentGame] = useState(null);
    const [color, setColor] = useState(null);
    const [gameReady, setGameReady] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentHand, setCurrentHand] = useState([]);

    useEffect(() => {
        const socket = socketIOClient(ENDPOINT, {
            withCredentials: true,
            extraHeaders: {
                "my-custom-header": "abcd",
            },
        });
        setMySocket(socket);
    }, []);

    // const selectBox = (id) => {
    // 	if (currentGame.state !== 2) return;
    // 	let box = currentGame.boxes[id];
    // 	if (!box.color) {
    // 		box.color = "pending";
    // 	}
    // 	mySocket.emit("selectBox", { boxId: id, gameId: currentGame.id });
    // 	console.log(currentGame);
    // 	setCurrentGame({ ...currentGame });
    // };
    useEffect(() => {
        if (mySocket) {
            mySocket.on("setUser", (data) => {
                console.log(data);
                setUser(data);
            });

            mySocket.on("new game", (game) => {
                //user has joined the game and assigned a color
                console.log(gameList);
                gameList[game.id] = game;

                setGameList({ ...gameList });
            });

            mySocket.on("gameList", (games) => {
                //user has joined the game and assigned a color
                console.log("gameList", games);
                setGameList(games);
            });

            mySocket.on("joiningGame", ({ game, color }) => {
                //user has joined the game and assigned a color
                setColor(color);
                setCurrentGame(game);
            });

            mySocket.on("updateGameList", (game) => {
                console.log("updateGameList");
                console.log(game);
                gameList[game.id] = game;

                setGameList({ ...gameList });
            });

            mySocket.on("updateCurrentGame", (game) => {
                setCurrentGame(game);
            });
            mySocket.on("yourHand", (hand) => {
                setCurrentHand(hand);
                console.log(hand);
            });

            return () => {
                mySocket.off("setUser");
                mySocket.off("new");
                mySocket.off("gameList");
                mySocket.off("joiningGame");
                mySocket.off("updateGameList");
                mySocket.off("updateCurrentGame");
                mySocket.off("yourHand");
            };
        }
    });
    return (
        <Router>
            <div
                style={{
                    position: "relative",
                    overflow: "hidden",
                    background: "black",
                    color: "white",
                    minHeight: "100vh",
                }}
            >
                <Route
                    exact
                    path="/"
                    render={(props) => (
                        <GameList {...props} Socket={mySocket} />
                    )}
                />
                <Route
                    path="/game/:gameId"
                    render={(props) => (
                        <GameRoom {...props} Socket={mySocket} />
                    )}
                />
            </div>
        </Router>
        // <div
        //     style={{
        //         position: "relative",
        //         overflow: "hidden",
        //         background: "black",
        //         color: "white",
        //         minHeight: "100vh",
        //     }}
        // >
        //     <div>
        //         {user && <h3>Hello {user.name}</h3>}
        //         {!user && <h3>Connecting....</h3>}
        //     </div>

        //     {!currentGame && (
        //         <div>
        //             <h3>
        //                 Game List - Total games {Object.keys(gameList).length}
        //             </h3>
        //             <CreateGameBtn
        //                 onClick={() => {
        //                     mySocket.emit("createGame", user);
        //                     //   alert("click");
        //                 }}
        //             >
        //                 Create Game
        //             </CreateGameBtn>
        //             {Object.keys(gameList)
        //                 .sort((a, b) => gameList[a].state - gameList[b].state)
        //                 .map((gameId, i) => {
        //                     let game = gameList[gameId];
        //                     let gameOver = game.state === 3;
        //                     let gameInProgress = game.state === 2;
        //                     let gameIsStarting = game.state === 1;
        //                     let needsMorePlayers = game.state === 0;

        //                     /**
        //                      * Poker game states
        //                      * 0 needs more players
        //                      * 1 game in progress
        //                      * 2 dealing blind
        //                      *    --who is big blind and small blind
        //                      * 3 betting blind
        //                      * 4 dealing flop
        //                      * 5 betting flop
        //                      * 6 dealing turn
        //                      * 7 betting turn
        //                      * 8 dealing river
        //                      * 9 betting river
        //                      * 10 showdown
        //                      *
        //                      */

        //                     return (
        //                         <div key={gameId}>
        //                             <h4>{`Game #${i + 1} ${gameId}`}</h4>

        //                             {needsMorePlayers && (
        //                                 <>
        //                                     <Alert background="lightblue">
        //                                         {`Players Ready:
        // 										${Object.keys(gameList[gameId].players).length}`}
        //                                     </Alert>
        //                                     <Alert>
        //                                         Waiting for more players...
        //                                     </Alert>
        //                                     <JoinGameBtn
        //                                         onClick={() =>
        //                                             mySocket.emit(
        //                                                 "joinGame",
        //                                                 gameId
        //                                             )
        //                                         }
        //                                     >
        //                                         JOIN
        //                                     </JoinGameBtn>
        //                                 </>
        //                             )}
        //                             {gameIsStarting && (
        //                                 <Alert background="lightblue">
        //                                     Game Is Starting...
        //                                 </Alert>
        //                             )}
        //                             {gameInProgress && (
        //                                 <Alert background="lightblue">
        //                                     Game In Progress...
        //                                 </Alert>
        //                             )}
        //                             {gameOver && (
        //                                 <Alert background="tomato">{`Game Is Over.  ${game.winner.name} won...`}</Alert>
        //                             )}
        //                         </div>
        //                     );
        //                 })}
        //         </div>
        //     )}

        //     {currentGame && (
        //         <div>
        //             {currentGame.state === 0 && (
        //                 <Alert>Waiting for more players</Alert>
        //             )}
        //             {currentGame.state === 1 && (
        //                 <>
        //                     <Alert color={"#333"} background={"lawngreen"}>
        //                         Ready for game to start
        //                     </Alert>
        //                     {/* <CountDown /> */}
        //                 </>
        //             )}
        //             {currentGame.state === 2 && <Alert>Dealing Hands</Alert>}
        //             {currentGame.state === 3 && <Alert>Blind Betting</Alert>}
        //             {currentGame.state === 4 && <Alert>Dealing Flop</Alert>}
        //             {currentGame.state === 5 && <Alert>Flop Betting</Alert>}
        //             {currentGame.state === 6 && <Alert>Dealing Turn</Alert>}
        //             {currentGame.state === 7 && <Alert>Turn Betting</Alert>}
        //             {currentGame.state === 8 && <Alert>Dealing River</Alert>}
        //             {currentGame.state === 9 && <Alert>River Betting</Alert>}
        //             {currentGame.state === 10 && <Alert>Showdown</Alert>}

        //             {/* // <> */}
        //             {/* {currentGame.winner.id === user.id && (
        // 						<>
        // 							<h1>YOU WON!!!</h1>
        // 							<Confetti />
        // 						</>
        // 					)} */}
        //             {/* {currentGame.winner.id !== user.id && (
        // 						<>
        // 							<h1>YOU LOST!!!</h1>
        // 						</>
        // 					)} */}
        //             {/* </> */}
        //             {/* // ) */}
        //             {/* } */}

        //             <div>
        //                 <div>
        //                     <Board
        //                         mySocket={mySocket}
        //                         game={currentGame}
        //                         user={user}
        //                         currentHand={currentHand}
        //                     />
        //                 </div>
        //             </div>
        //         </div>
        //     )}
        // </div>
    );
}

export default App;
