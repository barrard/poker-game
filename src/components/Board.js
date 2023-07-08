import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useContext,
} from "react";
import { EventsLog } from "./StyledComponents";
import styled, { keyframes } from "styled-components";
import Reward from "react-rewards";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
// import { Application, Assets, Sprite, Container } from "pixi.js";
import * as PIXI from "pixi.js";
import { Stage, Container, Sprite, Text, Graphics } from "@pixi/react";
import MainContext from "../Contexts/MainContext";
import PixiGame from "./PixiGame";
gsap.registerPlugin(PixiPlugin);

PixiPlugin.registerPIXI(PIXI);

const width = window.innerWidth;
const height = (width / 1920) * 1080;
const maxTableWidth = 12000;
const tableWidth =
    window.innerWidth > maxTableWidth ? maxTableWidth : window.innerWidth;
const tableHeight = (tableWidth / 1920) * 1080;
const globalScale = tableWidth / 1920;

export function Board(props = {}) {
    const { gameId } = props;
    const { user, mySocket, currentHand, gameState, setEventLogs } =
        useContext(MainContext);

    // console.log({ gameState, user, tableHeight, tableWidth });

    const gameIdRef = useRef(gameId);
    const appRef = useRef(null);
    const pixieAppRef = useRef(null);
    const pixiCanvasRef = useRef(null);
    const [pixiGame, setPixiGame] = useState(null);

    useEffect(() => {
        if (!pixiCanvasRef.current) return;
        console.log("--- mont the board?");
        pixieAppRef.current = new PIXI.Application({
            // height: tableHeight,
            // width: tableWidth,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000,
            antialias: true,
            resolution: 4,
            autoDensity: true, // !!!
        });
        // pixieAppRef.current.view.style["image-rendering"] = "pixelated";
        if (!pixieAppRef.current) return;

        pixieAppRef.current.stage.interactive = true;

        pixiCanvasRef.current.appendChild(pixieAppRef.current.view);

        const pixiGame = new PixiGame({
            handleEventsLog,
            pixiApp: pixieAppRef.current,
            height: tableHeight,
            width: tableWidth,
            gameState,
            user,
            gsap,
            globalScale,
            mySocket,

            margin: {
                top: 50,
                right: 100,
                left: 0,
                bottom: 40,
            },
        });

        setPixiGame(pixiGame);

        mySocket.on("cardsDealt", (playerPositions) => {
            debugger;
            pixiGame.dealCards(playerPositions);
        });
        mySocket.on("addPlayer", (player) => {
            pixiGame.addPlayer(player);
        });

        mySocket.on("removePlayer", (position) => {
            handleEventsLog({
                color: "tomato",
                msg: `Player ${position} has left`,
            });
            pixiGame.removePlayer(position);
        });

        mySocket.on("yourHand", (hand) => {
            const [card1, card2] = [
                convertCardToFile(hand[0]),
                convertCardToFile(hand[1]),
            ];
            pixiGame.yourHand([card1, card2]);
        });

        mySocket.on("playersBettingTurn", ({ positionsTurn, toCall }) => {
            pixiGame.playersBettingTurn({ positionsTurn, toCall });
        });

        mySocket.on("chipBalance", (chipBalanceData) => {
            pixiGame.chipBalance(chipBalanceData);
        });

        mySocket.on("playerCheck", ({ position }) => {
            handleEventsLog({
                color: "white",
                msg: `Player ${position} checks`,
                txtColor: "black",
            });
            pixiGame.playerCheck({ position });
        });

        mySocket.on("playerFold", ({ position }) => {
            handleEventsLog({
                color: "tomato",
                msg: `Player ${position} folds`,
            });
            pixiGame.playerFold({ position });
        });

        mySocket.on("playerTurnEnd", ({ position }) => {
            handleEventsLog({
                color: "red",
                msg: `Player ${position} end turn`,
            });
            pixiGame.playerTurnEnd({ position });
        });

        mySocket.on("playerWins", ({ position }) => {
            handleEventsLog({
                color: "green",
                msg: `Player ${position} Wins`,
            });
            pixiGame.playerWins({ position });
        });

        mySocket.on("theFlop", ({ flop }) => {
            handleEventsLog({
                color: "yellow",
                msg: `Flop ${flop}`,
                txtColor: "black",
            });
            flop = flop.map((card) => convertCardToFile(card));
            pixiGame.dealFlop(flop);
        });

        mySocket.on("theTurn", ({ turn }) => {
            handleEventsLog({
                color: "yellow",
                txtColor: "black",
                msg: `Turn ${turn}`,
            });
            turn = convertCardToFile(turn);
            pixiGame.dealTurn(turn);
        });

        mySocket.on("theRiver", ({ river }) => {
            handleEventsLog({
                color: "yellow",
                txtColor: "black",
                msg: `River ${river}`,
            });
            river = convertCardToFile(river);
            pixiGame.dealRiver(river);
        });

        mySocket.on("setDealerChip", ({ position }) => {
            handleEventsLog({
                color: "purple",
                msg: `Player ${position} is Dealer`,
            });
            pixiGame.setDealerChip({ position });
        });

        mySocket.on("setBigBlindChip", ({ position }) => {
            handleEventsLog({
                color: "#bf9000",
                msg: `Player ${position} is Big Blind`,
            });
            pixiGame.setBigBlindChip({ position });
        });

        mySocket.on("setSmallBlindChip", ({ position }) => {
            handleEventsLog({
                color: "#0b5394",
                msg: `Player ${position} is Small Blind`,
            });
            pixiGame.setSmallBlindChip({ position });
        });

        mySocket.on("playerBet", ({ position, bet }) => {
            handleEventsLog({
                color: "#098f20",
                msg: `Player ${position} bet ${bet}`,
            });

            pixiGame.playerBet({ position, bet });
        });

        mySocket.on("settleBets", () => {
            handleEventsLog({
                color: "aquamari",
                msg: `Get ready for the game to start!`,
            });

            pixiGame.settleBets();
        });

        mySocket.on("showDown", (cards) => {
            handleEventsLog({
                color: "green",
                msg: `The Showdown`,
            });
            cards.forEach((hand) => {
                if (hand.card1) {
                    hand.card1 = convertCardToFile(hand.card1);
                }
                if (hand.card2) {
                    hand.card2 = convertCardToFile(hand.card2);
                }
            });

            pixiGame.showDown(cards);
        });

        return () => {
            console.log("un mont the board?");
            mySocket.off("cardsDealt");
            mySocket.off("addPlayer");
            mySocket.off("removePlayer");
            mySocket.off("yourHand");
            mySocket.off("playersBettingTurn");
            mySocket.off("chipBalance");
            mySocket.off("playerCheck");
            mySocket.off("playerFold");
            mySocket.off("playerTurnEnd");
            mySocket.off("playerWins");
            mySocket.off("theFlop");
            mySocket.off("theTurn");
            mySocket.off("theRiver");
            mySocket.off("setDealerChip");
            mySocket.off("setBigBlindChip");
            mySocket.off("setSmallBlindChip");
            mySocket.off("playerBet");
            mySocket.off("settleBets");
            mySocket.off("showDown");

            setEventLogs([]);
            pixiGame.destroy();
            pixieAppRef.current.destroy(true, true);
            pixieAppRef.current = null;
            setPixiGame(false);
            mySocket.emit("leaveGame", gameIdRef.current);
        };
    }, []);

    useEffect(() => {
        console.log(gameState);
    }, [gameState]);

    function bet5() {
        pixiGame.betCheckFold({ bet: 5 });
    }
    function bet10() {
        pixiGame.betCheckFold({ bet: 10 });
    }
    function check() {
        pixiGame.betCheckFold({ check: true });
    }

    function testFlop() {
        // alert("works");
        // pixiGame.playersBettingTurn(0);
        pixiGame.dealFlop(["5_of_spades", "3_of_hearts", "king_of_diamonds"]);
    }

    function testDeal() {
        pixiGame.testDeal();
    }

    function myTurn() {
        console.log("myTurn");
        mySocket.emit("testMyTurn");
    }
    function endTurn() {
        console.log("end turn");
        mySocket.emit("endMyTurn");
    }

    function setDealer() {
        mySocket.emit("TESTsetDealerChip");
    }

    function setBB() {
        mySocket.emit("TESTsetBingBlind");
    }
    function setSB() {
        mySocket.emit("TESTsetSmallBlind");
    }

    function testBet() {
        mySocket.emit("testBet");
    }

    function testFold() {
        mySocket.emit("testFold");
    }

    function handleEventsLog(event) {
        setEventLogs((logs) => {
            return [...logs, event];
        });
    }

    function testSettleBets() {
        pixiGame.settleBets();
    }
    function testShowDown() {
        // pixiGame.testShowDown();
        // pixiGame.showDown();
        mySocket.emit("TESTshowDown");
    }

    if (!gameState.players || !Object.keys(gameState.players)?.length)
        return <>Waiting for players</>;

    return (
        <BoardContainer>
            <TestButtonsContainer>
                <TestBtn fn={testShowDown} text="TEST showdown" />
                <TestBtn fn={testSettleBets} text="TEST settleBets" />
                <TestBtn fn={testFold} text="Test FOLD" />
                <TestBtn fn={testBet} text="Test Bet BB" />
                <TestBtn fn={setBB} text="Set BB" />
                <TestBtn fn={setSB} text="Set sb" />
                <TestBtn fn={setDealer} text="Set Dealer" />
                <TestBtn fn={myTurn} text="My Turn" />
                <TestBtn fn={endTurn} text="end Turn" />
                <TestBtn fn={bet5} text="BET5" />
                <TestBtn fn={bet10} text="BET10" />
                <TestBtn fn={check} text="CHECK" />
                <TestBtn fn={testFlop} text="TEST Flop" />
                <TestBtn fn={testDeal} text="TEST Deal" />
            </TestButtonsContainer>
            {/* Events logger */}

            <div ref={pixiCanvasRef}></div>
        </BoardContainer>
    );
}

function TestBtn({ fn, text }) {
    return (
        <button
            onClick={() => {
                fn();
            }}
        >
            {text}
        </button>
    );
}

// function PlayerTimer() {
//     const [arcEndAngle, setArcEndAngle] = useState(Math.PI * 2); // Initial end angle

//     useEffect(() => {
//         const interval = setInterval(() => {
//             setArcEndAngle((prevAngle) => {
//                 if (prevAngle <= 0) clearInterval(interval);
//                 return prevAngle - 0.41;
//             }); // Update the end angle every interval
//         }, 1000); // Interval duration in milliseconds

//         return () => {
//             clearInterval(interval); // Clear the interval on component unmount
//         };
//     }, []);

//     const playerTimer = (g) => {
//         g.clear();

//         g.lineStyle(8, 0x33f0ff, 0.2);
//         g.arc(0, 0, 60, 0, arcEndAngle, false);

//         g.endFill();
//     };

//     return <Graphics anchor={0.5} draw={playerTimer} />;
// }

function BetButton(props) {
    return <Button x={200} y={30} text="BET" textColor="white" />;
}
function Button(props = {}) {
    const {
        buttonColor = 0xff0000,
        handleClick = () => {},
        x = 0,
        y = 0,
        text = "HELLO WORLD",
        textColor = "red",
        fontSize = 15,
    } = props;

    const textStyle = new PIXI.TextStyle({
        fontFamily: "Arial",
        fill: textColor,
        fontSize: fontSize,
        fontWeight: "bold",
        align: "center",
    });
    let { width: txtWidth, height: txtHeight } = PIXI.TextMetrics.measureText(
        text,
        textStyle
    );
    const btnXPadding = 8;
    const btnYPadding = 4;
    const button = useCallback((g) => {
        g.clear();

        g.beginFill(buttonColor, 0.5);
        g.drawRoundedRect(
            0,
            0,
            txtWidth + btnXPadding,
            txtHeight + btnYPadding,
            3
        );

        g.endFill();
        // Enable button interactivity
        g.interactive = true;
        g.buttonMode = true;
        g.on("click", handleClick);
    }, []);

    return (
        <Container>
            <Graphics x={x} y={y} draw={button}>
                <Text
                    text={text}
                    anchor={{ x: 0.5, y: 0.5 }}
                    style={textStyle}
                    x={txtWidth / 2 + btnXPadding / 2}
                    y={txtHeight / 2 + btnYPadding / 2}
                />
            </Graphics>
        </Container>
    );
}

const TestButtonsContainer = styled.div`
    position: absolute;
    top: 0;
`;

const BoardContainer = styled.div`
    position: relative;
    width: 100%;
    margin-bottom: 15em;
    border: solid 2px white;
`;

function convertCardToFile(card) {
    let [rank, suit] = card.split("");

    switch (rank) {
        case "A":
            rank = "ace";

            break;
        case "T":
            rank = "10";

            break;
        case "J":
            rank = "jack";

            break;
        case "Q":
            rank = "queen";

            break;
        case "K":
            rank = "king";

            break;

        default:
            break;
    }

    switch (suit) {
        case "H":
            suit = "hearts";

            break;
        case "D":
            suit = "diamonds";

            break;
        case "C":
            suit = "clubs";

            break;
        case "S":
            suit = "spades";

            break;

        default:
            break;
    }

    return `${rank}_of_${suit}`;
}
