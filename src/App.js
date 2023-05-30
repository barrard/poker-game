import React, { useState, useEffect } from "react";
import { withRouter, Route, useHistory, useLocation } from "react-router-dom";

import {
    Avatar,
    CountDown,
    Board,
    CreateGameBtn,
    JoinGameBtn,
    XGameBtn,
    Alert,
} from "./components";
import Confetti from "react-confetti";

import "./App.css";
import socketIOClient from "socket.io-client";
import GameList from "./Pages/GameList";
import GameRoom from "./Pages/GameRoom";
import MainContext from "./Contexts/MainContext";
const ENDPOINT = window.location.origin;

//pull somehing from codepen
//i want a confetti wining animation

//https://loading.io/background/m-confetti
//this one seems to try and make me buy it or something
//but i like it
//buy it?  buy what?
function App(props) {
    const history = useHistory();
    let location = useLocation();

    const [mySocket, setMySocket] = useState(null);
    const [user, setUser] = useState("");
    const [gameList, setGameList] = useState({});
    const [gameState, setGameState] = useState({});

    const [gameReady, setGameReady] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentHand, setCurrentHand] = useState([]);
    const [errMsg, setErrMsg] = useState({});
    const [socketConnected, setSocketConnected] = useState(null);

    useEffect(() => {
        const socket = socketIOClient(ENDPOINT, {
            withCredentials: true,
            extraHeaders: {
                "my-custom-header": "abcd",
            },
        });

        socket.on("connect", () => {
            setSocketConnected(true);
        });
        socket.on("disconnect", () => {
            setSocketConnected(false);
        });

        setMySocket(socket);
    }, []);

    useEffect(() => {
        if (mySocket) {
            function updateGameList(game) {
                gameList[game.id] = game;

                setGameList({ ...gameList });
            }
            mySocket.on("setUser", (data) => {
                setUser(data);
            });

            mySocket.on("gameRoomCreated", updateGameList);
            mySocket.on("updateGameList", updateGameList);

            mySocket.on("joiningGame", (game) => {
                //user has joined the game
                setGameState(game);
                history.push(`/game/${game.id}`);
            });

            mySocket.on("gameState", setGameState);

            mySocket.on("yourHand", setCurrentHand);

            mySocket.on("error", setErrMsg);

            return () => {
                mySocket.off("setUser");
                mySocket.off("gameRoomCreated");
                mySocket.off("updateGameList");
                mySocket.off("joiningGame");
                mySocket.off("gameState");
                mySocket.off("yourHand");
                mySocket.off("error");
            };
        }
    }, [mySocket, history]);
    return (
        <MainContext.Provider
            value={{
                user,
                mySocket,
                gameState,
                currentHand,
                setGameList,
                errMsg,
                setErrMsg,
            }}
        >
            <div
                style={{
                    // position: "relative",
                    overflow: "hidden",
                    background: "black",
                    color: "white",
                    minHeight: "100vh",
                }}
            >
                {/* User messages? */}
                <div>
                    {errMsg.msg && (
                        <>
                            <Alert background="tomato">{errMsg.msg}</Alert>
                            <XGameBtn>X</XGameBtn>
                        </>
                    )}
                    {user && <h3>Hello {user.name}</h3>}
                    {!user && <h3>Connecting....</h3>}
                </div>
                <Route
                    exact
                    path="/"
                    render={(props) => (
                        <GameList {...props} gameList={gameList} />
                    )}
                />
                <Route
                    path="/game/:gameId"
                    render={(props) => <GameRoom {...props} />}
                />
            </div>
        </MainContext.Provider>
    );
}

export default withRouter(App);
