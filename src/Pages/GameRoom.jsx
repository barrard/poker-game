import React, { useEffect, useContext } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import MainContext from "../Contexts/MainContext";
import {
    Avatar,
    CountDown,
    Board,
    CreateGameBtn,
    JoinGameBtn,
    Alert,
} from "../components";

export default function GameRoom(props) {
    const { match, history } = props;
    const gameId = match.params.gameId;
    const { user, mySocket, gameState, errMsg, setErrMsg } =
        useContext(MainContext);

    useEffect(() => {
        if (!mySocket || !user) return;

        if (!gameState) {
            mySocket.emit("joinGame", gameId);
            debugger;
        }
    }, [mySocket, user]);

    useEffect(() => {
        if (gameId !== gameState.id) {
            setErrMsg({ msg: "You sure this is the right room?" });
        }
    }, [gameState]);
    if (!gameState) {
        return <>....Connecting to {match.params.gameId}</>;
    }

    return (
        <Container>
            <Row>
                <Button
                    className="btn btn-primary"
                    onClick={() => {
                        mySocket.emit("leaveGame", gameId);
                        history.push("/");
                    }}
                >{`< HOME`}</Button>
            </Row>
            <Row>
                <div>GameRoom {props.match.params.gameId}</div>
            </Row>
            <Row>
                <div>
                    {gameState?.state === 0 && (
                        <Alert>Waiting for more players</Alert>
                    )}
                    {gameState?.state === 1 && (
                        <>
                            <Alert color={"#333"} background={"lawngreen"}>
                                Ready for game to start
                            </Alert>
                            {/* <CountDown /> */}
                        </>
                    )}
                    {gameState?.state === 2 && <Alert>Dealing Hands</Alert>}
                    {gameState?.state === 3 && <Alert>Blind Betting</Alert>}
                    {gameState?.state === 4 && <Alert>Dealing Flop</Alert>}
                    {gameState?.state === 5 && <Alert>Flop Betting</Alert>}
                    {gameState?.state === 6 && <Alert>Dealing Turn</Alert>}
                    {gameState?.state === 7 && <Alert>Turn Betting</Alert>}
                    {gameState?.state === 8 && <Alert>Dealing River</Alert>}
                    {gameState?.state === 9 && <Alert>River Betting</Alert>}
                    {gameState?.state === 10 && <Alert>Showdown</Alert>}

                    <div>
                        <Board />
                    </div>
                </div>
            </Row>
        </Container>
    );
}
