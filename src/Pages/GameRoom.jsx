import React, { useEffect, useContext, useRef } from "react";
import { Row, Col, Container, Button } from "react-bootstrap";
import MainContext from "../Contexts/MainContext";
import {
    Avatar,
    CountDown,
    Board,
    CreateGameBtn,
    JoinGameBtn,
    Alert,
    EventsLog,
    BoardContainer,
    Event,
} from "../components";

export default function GameRoom(props) {
    const eventsLogRef = useRef();
    const { match, history } = props;
    const gameId = match.params.gameId;
    const {
        user,
        mySocket,
        isConnected,
        gameState,
        errMsg,
        setErrMsg,
        eventLogs,
        setEventLogs,
    } = useContext(MainContext);

    useEffect(() => {
        eventsLogRef.current.scrollTop = eventsLogRef.current.scrollHeight;
    }, [eventLogs]);

    useEffect(() => {
        if (!mySocket || !user) return;

        if (!gameState) {
            mySocket.emit("joinGame", gameId);
            debugger;
        }
    }, [mySocket, user]);

    useEffect(() => {
        if (!mySocket || !isConnected) return;
        if (gameId !== gameState.id) {
            setErrMsg({ msg: "You sure this is the right room?" });
        }
    }, [gameState, mySocket]);

    if (!gameState) {
        return <>....Connecting to {match.params.gameId}</>;
    }
    console.log("Game room render", gameState.state);
    return (
        <Container fluid className="g-0">
            <Row>
                <Col sm="">
                    <Button
                        className="btn btn-primary"
                        onClick={() => {
                            // mySocket.emit("leaveGame", gameId);
                            history.push("/");
                        }}
                    >{`< HOME`}</Button>

                    <div>GameRoom - {props.match.params.gameId}</div>
                    <div>Game State - {gameState.state}</div>
                </Col>
                <Col className="border g-0" sm="">
                    {/* <p>Events</p> */}
                    <EventsLog ref={eventsLogRef}>
                        {eventLogs.map((event, i) => {
                            return (
                                <Event key={i} color={event.color}>
                                    {i + 1}: {event.msg}
                                </Event>
                            );
                        })}
                    </EventsLog>
                </Col>
            </Row>
            <Row>
                <div>
                    {/* {gameState?.state === 0 && (
                        <Alert>Waiting for more players</Alert>
                    )}
                    {gameState?.state === 1 && (
                        <>
                            <Alert color={"#333"} background={"lawngreen"}>
                                Ready for game to start
                            </Alert>
                        </>
                    )} */}
                    {/* {gameState?.state === 2 && <Alert>Dealing Hands</Alert>}
                    {gameState?.state === 3 && <Alert>Blind Betting</Alert>}
                    {gameState?.state === 4 && <Alert>Dealing Flop</Alert>}
                    {gameState?.state === 5 && <Alert>Flop Betting</Alert>}
                    {gameState?.state === 6 && <Alert>Dealing Turn</Alert>}
                    {gameState?.state === 7 && <Alert>Turn Betting</Alert>}
                    {gameState?.state === 8 && <Alert>Dealing River</Alert>}
                    {gameState?.state === 9 && <Alert>River Betting</Alert>}
                    {gameState?.state === 10 && <Alert>Showdown</Alert>} */}

                    <BoardContainer>
                        <Board gameId={gameId} />
                    </BoardContainer>
                </div>
            </Row>
        </Container>
    );
}
