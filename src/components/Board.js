import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useContext,
} from "react";
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

export function Board() {
    const { user, mySocket, currentHand, gameState } = useContext(MainContext);

    // console.log({ gameState, user, tableHeight, tableWidth });

    const appRef = useRef(null);
    const pixieAppRef = useRef(null);
    const pixiCanvasRef = useRef(null);
    const [pixiGame, setPixiGame] = useState(null);

    useEffect(() => {
        // if (!pixiCanvasRef.current) return;
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
        pixieAppRef.current.view.style["image-rendering"] = "pixelated";

        pixieAppRef.current.stage.interactive = true;

        pixiCanvasRef.current.appendChild(pixieAppRef.current.view);

        const pixiGame = new PixiGame({
            pixiApp: pixieAppRef.current,
            height: tableHeight,
            width: tableWidth,
            gameState,
            user,
            gsap,
            globalScale,

            margin: {
                top: 50,
                right: 100,
                left: 0,
                bottom: 40,
            },
        });

        setPixiGame(pixiGame);

        mySocket.on("cardsDealt", (playerPositions) => {
            console.log("cardsDealt");
            pixiGame.dealCards(playerPositions);
        });
        mySocket.on("addPlayer", (player) => {
            console.log("addPlayer");
            pixiGame.addPlayer(player);
        });

        mySocket.on("removePlayer", (player) => {
            console.log("removePlayer");
            pixiGame.removePlayer(player);
        });

        mySocket.on("yourHand", (hand) => {
            console.log("yourHand");
            console.log(hand);
            const [card1, card2] = [
                convertCardToFile(hand[0]),
                convertCardToFile(hand[1]),
            ];
            debugger;
            pixiGame.yourHand([card1, card2]);
        });

        mySocket.on("playersBettingTurn", (playerPosition) => {
            console.log(playerPosition);
            pixiGame.playersBettingTurn(playerPosition);
        });

        return () => {
            console.log("un mont the board?");
            mySocket.off("cardsDealt");
            mySocket.off("addPlayer");
            mySocket.off("removePlayer");
            mySocket.off("yourHand");
            mySocket.off("playersBettingTurn");
            pixieAppRef.current.destroy(true, true);
            pixieAppRef.current = null;
            pixiGame.destroy();
            setPixiGame(false);
        };
    }, []);

    useEffect(() => {
        console.log(gameState);
    }, [gameState]);

    function runTest() {
        // alert("works");
        pixiGame.playersBettingTurn(0);
    }

    if (!gameState.players || !Object.keys(gameState.players)?.length)
        return <>Waiting for players</>;

    return (
        <BoardContainer>
            <button
                onClick={() => {
                    runTest();
                }}
            >
                TEST
            </button>
            gogo?
            <div ref={pixiCanvasRef}></div>
        </BoardContainer>
    );
}

function PlayerTimer() {
    const [arcEndAngle, setArcEndAngle] = useState(Math.PI * 2); // Initial end angle

    useEffect(() => {
        const interval = setInterval(() => {
            setArcEndAngle((prevAngle) => {
                if (prevAngle <= 0) clearInterval(interval);
                return prevAngle - 0.41;
            }); // Update the end angle every interval
        }, 1000); // Interval duration in milliseconds

        return () => {
            clearInterval(interval); // Clear the interval on component unmount
        };
    }, []);

    const playerTimer = (g) => {
        g.clear();

        g.lineStyle(8, 0x33f0ff, 0.2);
        g.arc(0, 0, 60, 0, arcEndAngle, false);

        g.endFill();
    };

    return <Graphics anchor={0.5} draw={playerTimer} />;
}

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

const BoardContainer = styled.div`
    width: 100%;
    margin-bottom: 15em;
    border: solid 2px white;
`;

/*

		<Reward
					ref={(ref) => {
						this.reward = ref;
					}}
					type="confetti"
					config={{
						lifetime: 10,
						// angle: 90,
						elementCount: 100,
						decay: 1,
						spread: 360,
						startVelocity: 10,
						// springAnimation: false,
						colors: ["Red", "yellow", "green", "blue"],
					}}
				></Reward>
				*/

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
