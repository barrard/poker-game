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
    console.log(props);
    const { gameList, history, match } = props;
    const { user, mySocket, setGameList } = useContext(MainContext);

    //HANDLES THE GAMES LIST
    useEffect(() => {
        if (!mySocket) return;
        mySocket.on("gameList", (games) => {
            //user has joined the game and assigned a color
            console.log("gameList", games);
            setGameList(games);
        });

        return () => {
            mySocket.off("gameList");
        };
    }, [mySocket]);

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
                    let showdown = game.state === 10;
                    let bettingRiver = game.state === 9;
                    let dealingRiver = game.state === 8;
                    let bettingTurn = game.state === 7;
                    let dealingTurn = game.state === 6;
                    let bettingFlop = game.state === 5;
                    let dealingFlop = game.state === 4;
                    let bettingBlind = game.state === 3;
                    let dealingBlind = game.state === 2;
                    let gameInProgress = game.state === 1;
                    let needsMorePlayers = game.state === 0;

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

                    return (
                        <div key={gameId}>
                            <h4>{`Game #${i + 1} ${gameId}`}</h4>

                            {(needsMorePlayers || gameInProgress) && (
                                <>
                                    <Alert background="lightblue">
                                        {`Players Ready:
                                ${
                                    Object.keys(gameList[gameId].players).length
                                }`}
                                    </Alert>

                                    {needsMorePlayers && (
                                        <Alert>
                                            Waiting for more players...
                                        </Alert>
                                    )}

                                    {gameInProgress && (
                                        <Alert background="lightblue">
                                            Game In Progress...
                                        </Alert>
                                    )}
                                    <JoinGameBtn
                                        onClick={() => {
                                            mySocket.emit("joinGame", gameId);
                                        }}
                                    >
                                        JOIN
                                    </JoinGameBtn>
                                </>
                            )}

                            {dealingBlind && (
                                <Alert background="lightblue">
                                    Dealing Blind
                                </Alert>
                            )}
                            {bettingBlind && (
                                <Alert background="tomato">{`Dealing Blind`}</Alert>
                            )}
                        </div>
                    );
                })}
        </div>
    );
}
