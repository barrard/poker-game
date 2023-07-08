import React, { useContext, useEffect } from "react";
import MainContext from "../Contexts/MainContext";
import { Link } from "react-router-dom";

import {
    Avatar,
    CountDown,
    Board,
    CreateGameBtn,
    JoinGameBtn,
    Alert,
} from "../components";

export default function GameList(props) {
    // console.log(props);
    const { gameList, history, match } = props;
    const { user, mySocket, setGameList, isConnected } =
        useContext(MainContext);

    // useEffect(() => {
    //     if (!mySocket) return;

    //     mySocket.emit("joinWaitingRoom");

    //     return () => {};
    // }, []);

    //HANDLES THE GAMES LIST
    useEffect(() => {
        if (!mySocket || !isConnected) return;

        // mySocket.on("connected", (games) => {
        console.log("Join waiting room please");
        mySocket.emit("joinWaitingRoom");
        // });
        // mySocket.on("gameList", (games) => {
        //     //user has joined the game and assigned a color
        //     console.log("gameList", games);
        //     setGameList(games);
        // });

        return () => {
            // console.log("off connected");
            // mySocket.off("gameList");
            // mySocket.off("connected");
        };
    }, [mySocket, isConnected]);

    return (
        <div>
            <h3>Game List - Total games {Object.keys(gameList).length}</h3>
            <CreateGameBtn
                onClick={() => {
                    mySocket.emit("createGame", user);
                }}
            >
                Create Game
            </CreateGameBtn>
            {Object.keys(gameList)
                .sort((a, b) => gameList[a].state - gameList[b].state)
                .map((gameId, i) => {
                    let game = gameList[gameId];
                    let needsMorePlayers = game.state === 0;
                    let gameIsStarting = game.state === 1;
                    let dealingHands = game.state === 2;
                    let bettingBlind = game.state === 3;
                    let bettingFlop = game.state === 4;
                    let bettingTurn = game.state === 5;
                    let bettingRiver = game.state === 6;
                    let showdown = game.state === 7;

                    /**
                     * Poker game states
                     * 0 needs more players
                     * 1 game is starting
                     * 2 hands

                    * 3 betting blind
                     * 4 betting flop
                     * 5 betting turn
                     * 6 betting river
                     * 7 showdown
                     *
                     */

                    return (
                        <div key={gameId}>
                            <h4>{`Game #${i + 1} ${gameId}`}</h4>

                            <Alert background="lightblue">
                                {`Players:
                                ${
                                    Object.keys(gameList[gameId].players).length
                                }`}
                            </Alert>

                            {needsMorePlayers && (
                                <Alert background="#eb4f34">
                                    Waiting for more players...
                                </Alert>
                            )}

                            {gameIsStarting && (
                                <Alert background="#eb9c34">
                                    Game In Progress...
                                </Alert>
                            )}

                            {dealingHands && (
                                <Alert background="#8fb828">
                                    Dealing Players
                                </Alert>
                            )}
                            {bettingBlind && (
                                <Alert background="#2bc288">{`Betting Blind`}</Alert>
                            )}
                            {bettingFlop && (
                                <Alert background="#34c3eb">{`Betting Flop`}</Alert>
                            )}
                            {bettingTurn && (
                                <Alert background="#3434eb">{`Betting Turn`}</Alert>
                            )}
                            {bettingRiver && (
                                <Alert background="#b434eb">{`Betting River`}</Alert>
                            )}
                            {showdown && (
                                <Alert background="#eb3468">{`Showdown`}</Alert>
                            )}

                            {Object.keys(gameList[gameId].players).length <
                                8 && (
                                <JoinGameBtn
                                    onClick={() => {
                                        mySocket.emit("joinGame", gameId);
                                    }}
                                >
                                    JOIN
                                </JoinGameBtn>
                            )}
                        </div>
                    );
                })}
        </div>
    );
}
