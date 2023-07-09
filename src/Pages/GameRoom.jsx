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

    return (
        <Container fluid className="g-0">
            <Row>
                <Col sm="">
                    <Button
                        className="btn btn-primary"
                        onClick={() => {
                            history.push("/");
                        }}
                    >{`< HOME`}</Button>

                    <div>GameRoom - {props.match.params.gameId}</div>
                    <div>Game State - {gameState.state}</div>
                </Col>
                <Col className="border g-0" sm="">
                    <EventsLog ref={eventsLogRef}>
                        {eventLogs.map((event, i) => {
                            return (
                                <Event
                                    key={i}
                                    txtColor={event.txtColor || "white"}
                                    color={event.color}
                                >
                                    {i + 1}: {event.msg}
                                </Event>
                            );
                        })}
                    </EventsLog>
                </Col>
            </Row>
            <Row>
                <div>
                    <BoardContainer>
                        <Board gameId={gameId} />
                    </BoardContainer>
                </div>
            </Row>
        </Container>
    );
}
