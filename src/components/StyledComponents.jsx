import React from "react";
import styled from "styled-components";

// export const CreateGameBtn = styled.button`
//     font-family: monospace;
//     color: green;
//     background: lawngreen;
//     border: black solid 1px;
//     border-radius: 5px;
//     padding: 0.5em;
//     font-size: 15px;
//     cursor: pointer;
// `;

export const XGameBtn = (props) => {
    return (
        <GameBtn color="red" background="indianred">
            {props.children}
        </GameBtn>
    );
};

export const CreateGameBtn = (props) => {
    return (
        <GameBtn onClick={props.onClick} color="green" background="lawngreen">
            {props.children}
        </GameBtn>
    );
};

export const GameBtn = styled.button`
    font-family: monospace;
    color: ${({ color }) => (color ? color : "green")};
    background: ${({ background }) => (background ? background : "lawngreen")};
    border: black solid 1px;
    border-radius: 5px;
    padding: 0.5em;
    font-size: 15px;
    cursor: pointer;
`;

export const JoinGameBtn = styled.button`
    font-family: monospace;
    color: black;
    background: goldenrod;
    border: black solid 1px;
    border-radius: 5px;
    padding: 0.5em;
    font-size: 15px;
    cursor: pointer;
`;

export const Alert = styled.p`
    background: ${({ background }) => (background ? background : "tomato")};
    display: inline-block;
    font-family: monospace;
    font-size: 15px;
    color: ${({ color }) => (color ? color : "white")};
    padding: 0.5em;
    border: 1px solid #333;
    border-radius: 5px;
    margin: 1em;
`;

export const EventsLog = styled.div`
    overflow-y: scroll;
    overflow-x: hidden;
    height: 200px;
    width: 100%;
    /* position: absolute; */
    /* right: 0; */
`;

export const Event = styled.div`
    /* height: 100%; */
    width: 100%;
    background: ${({ color }) => color};
    padding: 0.3em;
    margin: 0.1em;
    border-radius: 5px;
    color: ${({ txtColor }) => txtColor};

    /* border: 2px solid red; */
    /* position: absolute; */
    /* right: 0; */
`;

export const BoardContainer = styled.div`
    position: relative;
`;
