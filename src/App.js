import React, { useState, useEffect } from "react";
import { withRouter, Route, useHistory, useLocation } from "react-router-dom";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
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
    const [isConnected, setIsConnected] = useState(false);
    const [user, setUser] = useState("");
    const [gameList, setGameList] = useState({});
    const [gameState, setGameState] = useState({});

    const [gameReady, setGameReady] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentHand, setCurrentHand] = useState([]);
    const [errMsg, setErrMsg] = useState({});
    const [socketConnected, setSocketConnected] = useState(null);
    const [eventLogs, setEventLogs] = useState([]);

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

            mySocket.on("connected", (games) => {
                console.log("Join waiting room please");
                // mySocket.emit("joinWaitingRoom");
                setIsConnected(true);
            });
            mySocket.on("setUser", (data) => {
                setUser(data);
            });

            mySocket.on("gameList", (games) => {
                //user has joined the game and assigned a color
                console.log("gameList", games);
                setGameList(games);
            });

            mySocket.on("gameRoomCreated", updateGameList);
            mySocket.on("updateGameList", updateGameList);

            mySocket.on("joiningGame", (game) => {
                //user has joined the game
                setGameState(game);
                history.push(`/game/${game.id}`);
            });

            mySocket.on("gameState", setGameState);

            // mySocket.on("yourHand", setCurrentHand);

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
                isConnected,
                gameState,
                currentHand,
                setGameList,
                errMsg,
                setErrMsg,
                eventLogs,
                setEventLogs,
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
                <Row className="">
                    {errMsg.msg && (
                        <>
                            <Alert background="tomato">{errMsg.msg}</Alert>
                            <XGameBtn>X</XGameBtn>
                        </>
                    )}
                    {user && <h3>Hello {user.name}</h3>}
                    {!user && <h3>Connecting....</h3>}
                </Row>
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
