import React from "react";

export default function GameRoom(props) {
    console.log(props);
    return <div>GameRoom {props.match.params.gameId}</div>;
}
