import React, { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import Reward from "react-rewards";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
// import { Application, Assets, Sprite, Container } from "pixi.js";
import * as PIXI from "pixi.js";
import { Stage, Container, Sprite, Text, Graphics } from "@pixi/react";
import { useMemo } from "react";
// register the plugin
gsap.registerPlugin(PixiPlugin);

// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);
// PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const width = window.innerWidth;
const height = (width / 1920) * 1080;
const maxTableWidth = 1200;
const tableWidth =
    window.innerWidth > maxTableWidth ? maxTableWidth : window.innerWidth;
const tableHeight = (tableWidth / 1920) * 1080;

const positions = {
    0: {
        x: width * 0.67,
        y: height * 0.29,
        rotation: 0,
    },
    1: {
        x: width * 0.73,
        y: height * 0.49,
        rotation: 0,
    },

    2: {
        x: width * 0.67,
        y: height * 0.65,
        rotation: 0,
    },

    3: {
        x: width * 0.45,
        y: height * 0.7,
        rotation: 0,
    },
    4: {
        x: width * 0.32,
        y: height * 0.65,
        rotation: 0,
    },
    5: {
        x: width * 0.27,
        y: height * 0.49,
        rotation: 0,
    },
    6: {
        x: width * 0.32,
        y: height * 0.29,
        rotation: 0,
    },

    dealer: {
        x: width / 2,
        y: height * 0.25,
        rotation: 0,
    },
};

export const Board = ({ game, user, mySocket, currentHand }) => {
    console.log({ game, user });
    const YOU = game.players[user.id] || { position: 0 };
    const YOUR_POSITION = 3;
    const seatPositionMap = {
        [YOU.position]: YOUR_POSITION,
    };

    while (Object.keys(seatPositionMap).length < 7) {
        let newPos = YOU.position + Object.keys(seatPositionMap).length;
        let newRelativePosition =
            YOUR_POSITION + Object.keys(seatPositionMap).length;
        if (newPos > 6) newPos -= 7;
        if (newRelativePosition > 6) newRelativePosition -= 7;

        seatPositionMap[newPos] = newRelativePosition;
    }

    const getRelativeSeatPosition = (player) => {};
    const appRef = useRef(null);
    const pixieRef = useRef(null);

    useEffect(() => {
        mySocket.on("cardDealt", (playerPosition) => {
            console.log({ playerPosition });
            const seenPlayer = seatPositionMap[playerPosition];
            console.log({ seenPlayer });
            //show card go from therer to here
        });
        return () => {
            mySocket.off("cardDealt");
        };
    });

    // console.log({ width, height });

    let gamePositions = Object.keys(game.positions);
    const dealDuration = gamePositions.length * 0.1;

    const DealHands = useMemo(() => {
        return (
            <>
                {game.cardsDealt && (
                    <DealCards
                        seatPositionMap={seatPositionMap}
                        gamePositions={gamePositions}
                        game={game}
                        isCard1={true}
                        YOUR_POSITION={YOU.position}
                        currentHand={currentHand}
                    />
                )}
                {game.cardsDealt && (
                    <DealCards
                        seatPositionMap={seatPositionMap}
                        gamePositions={gamePositions}
                        game={game}
                        dealDuration={dealDuration}
                        isCard2={true}
                        YOUR_POSITION={YOU.position}
                        currentHand={currentHand}
                    />
                )}
            </>
        );
    }, [game.cardsDealt, seatPositionMap, currentHand, gamePositions]);
    return (
        <BoardContainer>
            <Stage
                width={width}
                height={height}
                options={{
                    antialias: true,
                    resolution: window.devicePixelRatio,
                    autoDensity: true,
                    scaleMode: PIXI.SCALE_MODES.NEAREST,
                }}
            >
                <Sprite
                    image="/img/poker-table.jpg"
                    width={tableWidth}
                    height={tableHeight}
                    x={width / 2}
                    y={height / 2}
                    anchor={{ x: 0.5, y: 0.5 }}
                />
                {Object.keys(game.players).map((socketId) => {
                    return (
                        <Player
                            key={socketId}
                            player={game.players[socketId]}
                            seatPositionMap={seatPositionMap}
                            game={game}
                            mySocket={mySocket}
                            YOU={YOU}
                        />
                    );
                })}

                {DealHands}
                {/* {game.cardsDealt && (
                    <DealCards
                        seatPositionMap={seatPositionMap}
                        gamePositions={gamePositions}
                        game={game}
                        isCard1={true}
                        YOUR_POSITION={YOU.position}
                        currentHand={currentHand}
                    />
                )}
                {game.cardsDealt && (
                    <DealCards
                        seatPositionMap={seatPositionMap}
                        gamePositions={gamePositions}
                        game={game}
                        dealDuration={dealDuration}
                        isCard2={true}
                        YOUR_POSITION={YOU.position}
                        currentHand={currentHand}
                    />
                )} */}

                {/* <Card isDealt={true} toPosition={0} /> */}
                {/* <Card isDealt={true} toPosition={1} />
                <Card isDealt={true} toPosition={2} />
                <Card isDealt={true} toPosition={3} />
                <Card isDealt={true} toPosition={4} />
                <Card isDealt={true} toPosition={5} />
                <Card isDealt={true} toPosition={6} /> */}

                <Sprite
                    image="/img/players/dealer.png"
                    angle={positions.dealer.rotation}
                    anchor={0.5}
                    x={positions.dealer.x}
                    y={positions.dealer.y}
                />
                {/* //CARDS */}
                <Card file="2_of_clubs" />
                <Container>
                    {/* <Text text="Hello World" anchor={{ x: 0.5, y: 0.5 }} filters={[blurFilter]} /> */}
                </Container>
            </Stage>
        </BoardContainer>
    );
};

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

function PlayerError() {
    const playerError = useCallback((g) => {
        g.clear();

        g.lineStyle(8, 0xdd1111, 0.9);
        g.arc(0, 0, 60, 0, Math.PI * 2, false);

        g.endFill();
    }, []);

    return <Graphics anchor={0.5} draw={playerError} />;
}
function Player(props) {
    const { player, seatPositionMap, game, mySocket, YOU } = props;
    const isYOU = player.position === YOU.position;
    let pos = seatPositionMap[player.position]; //+ YOU.position;

    const graphicsRef = useRef();
    let _pos = positions[pos];
    const playerSelect = useCallback((g) => {
        g.clear();

        g.lineStyle(8, 0x333333, 0.5);
        g.arc(0, 0, 60, 0, Math.PI * 2, false);

        g.endFill();
    }, []);

    return (
        <Container anchor={0.5} x={_pos.x} y={_pos.y}>
            <BetButton socket={mySocket} />

            {isYOU && <Graphics anchor={0.5} draw={playerSelect} />}
            {player.position === game.bettersTurn && (
                <>
                    <Button />
                    <PlayerTimer />
                </>
            )}
            {player.position === game.bettersTurnOutOfTime && <PlayerError />}
            <Sprite
                image={`/img/players/${player.position}.png`}
                angle={_pos.rotation}
                anchor={0.5}
            />
        </Container>
    );
}

function DealCards(props = {}) {
    const {
        gamePositions,
        dealDuration = 0,
        game,
        isCard1 = false,
        isCard2 = false,
        seatPositionMap,
        YOUR_POSITION,
        currentHand,
    } = props;

    return gamePositions.map((position, i) => {
        let onComplete = () => {};

        if (position == YOUR_POSITION) {
            onComplete = ({ pixiObject, setCardFile, faceValue }) => {
                // console.log({ isCard1, isCard2 });
                gsap.to(pixiObject, {
                    pixi: {
                        skewY: isCard1 ? -90 : 90,
                    },
                    duration: 0.5,
                    onComplete: () => {
                        // debugger;
                        // console.log(
                        //     `${
                        //         isCard1 ? "Card1 " : "card 2 "
                        //     } first turn and set animation done`
                        // );

                        setCardFile(faceValue);
                        gsap.to(pixiObject, {
                            pixi: {
                                skewY: isCard1 ? 0 : 0,
                            },
                            duration: 1,
                            onComplete: () => {
                                // console.log(
                                //     `${
                                //         isCard1 ? "Card1 " : "card 2 "
                                //     } FINAL turn animation done`
                                // );
                            },
                        });
                    },
                });
            };
        }
        if (!game.positions[position]) {
            return <React.Fragment key={position}></React.Fragment>;
        } else {
            return (
                <Card
                    key={position}
                    delay={i * 0.1 + dealDuration}
                    isDealt={true}
                    toPosition={seatPositionMap[position]}
                    isCard1={isCard1}
                    isCard2={isCard2}
                    faceValue={"ok?"}
                    onComplete={onComplete}
                    file={"back"}
                    currentHand={currentHand}
                />
            );
        }
    });
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

function Card(props = {}) {
    let {
        x = 200,
        y = 200,
        file = "back",
        isDealt = false,
        toPosition = undefined,
        delay = 10,
        isCard1 = false,
        isCard2 = false,
        onComplete = () => {},
        currentHand = false,
    } = props;

    const pixiObject = useRef();
    const width = 222;
    const height = 323;

    const [cardFile, setCardFile] = useState(file);
    const faceValue = !currentHand
        ? "back"
        : isCard1
        ? convertCardToFile(currentHand[0])
        : convertCardToFile(currentHand[1]);

    if (isDealt) {
        x = positions.dealer.x;
        y = positions.dealer.y;
    }

    useEffect(() => {
        if (pixiObject.current) {
            if (isDealt) {
                gsap.to(pixiObject.current, {
                    pixi: {
                        positionX: isCard1
                            ? positions[toPosition].x - 20
                            : positions[toPosition].x + 20,
                        positionY: positions[toPosition].y,
                        rotation: isCard1 ? 360 - 10 : 360 + 10,
                        scale: 0.25,
                    },
                    delay,
                    duration: 1,
                    onComplete: () => {
                        // console.log(
                        //     `${
                        //         isCard1 ? "Card 1 " : "card 2 "
                        //     } initial animation done`
                        // );
                        onComplete({
                            pixiObject: pixiObject.current,
                            setCardFile,
                            faceValue,
                        });
                    },
                });
            }
        }
    }, [pixiObject.current]);
    const draw = useCallback((g) => {
        g.clear();

        g.beginFill(0xffffff, 1);
        g.drawRoundedRect(0, 0, 222, 323, 5);

        g.endFill();
    }, []);

    return (
        //222x323
        <Container
            ref={pixiObject}
            x={x}
            y={y}
            pivot={new PIXI.Point(width / 2, height / 2)}
            // width={width}
            // height={height}
            scale={0}
            skew={{ x: 0, y: 0 }}
        >
            <Graphics draw={draw} />
            <Sprite
                // filters={[new PIXI.filters.FXAAFilter()]}
                image={`/img/cards/${cardFile}.png`}
                anchor={0}
                x={5}
                y={5}
                width={width - 10}
                height={height - 10}
                // scale={1}
                // skew={0}
            />
        </Container>
    );
}

const BoardContainer = styled.div`
    width: 100%;
    margin-bottom: 15em;
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
