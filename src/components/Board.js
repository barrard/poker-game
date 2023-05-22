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
    const YOU = game.players[user.id];
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

    console.log({ width, height });

    const Player = (props) => {
        const { player } = props;
        let pos = seatPositionMap[player.position]; //+ YOU.position;
        // if (pos > 6) pos = pos - 6;
        let _pos = positions[pos];
        const playerSelect = useCallback((g) => {
            g.clear();

            g.lineStyle(2, 0xffffff, 0.5);
            g.arc(0, 0, 60, 0, Math.PI * 2, false);

            g.endFill();
        }, []);
        return (
            <Container anchor={0.5} x={_pos.x} y={_pos.y}>
                <Graphics anchor={0.5} draw={playerSelect} />
                <Sprite
                    image={`/img/players/${player.position}.png`}
                    angle={_pos.rotation}
                    anchor={0.5}
                />
            </Container>
        );
    };
    let gamePositions = Object.keys(game.positions);
    const dealDuration = gamePositions.length * 0.1;
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
                        />
                    );
                })}

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

function DealCards(props = {}) {
    const [card1File, setCard1File] = useState("back");
    const [card2File, setCard2File] = useState("back");
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

    let card1Value = currentHand[0];
    let card2Value = currentHand[1];
    return gamePositions.map((position, i) => {
        let onComplete = () => {};
        console.log(currentHand);
        if (position == YOUR_POSITION) {
            debugger;
            onComplete = (pixiObject) => {
                const timeline = gsap.timeline({
                    onUpdate: () => {
                        // Calculate the progress of the timeline
                        const progress = timeline.progress();

                        // Check if the timeline has reached 50% completion
                        if (progress >= 0.5) {
                            console.log("Timeline is 50% complete!");
                            if (isCard1) {
                                setCard1File(convertCardToFile(card1Value));
                            } else if (isCard2) {
                                setCard2File(convertCardToFile(card2Value));
                            }
                        }
                    },
                });

                timeline.to(pixiObject, {
                    pixi: {
                        skewY: isCard1 ? 180 : 180,
                    },
                    duration: 1,
                });
            };
        }
        if (!game.positions[position]) {
            return <React.Fragment key={position}></React.Fragment>;
        } else {
            console.log({ card1File, card2File });
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
                    file={isCard1 ? card1File : card2File}
                />
            );
        }
    });
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
    } = props;
    const pixiObject = useRef();
    const width = 222;
    const height = 323;

    if (isDealt) {
        x = positions.dealer.x;
        y = positions.dealer.y;
    }

    useEffect(() => {
        if (pixiObject.current) {
            if (isDealt) {
                gsap.to(pixiObject.current, {
                    // pixi: { scaleX: 2, scaleY: 1.5, skewX: 30, rotation: 60 },
                    pixi: {
                        positionX: isCard1
                            ? positions[toPosition].x - 10
                            : positions[toPosition].x + 10,
                        positionY: positions[toPosition].y,
                        rotation: isCard1 ? 360 - 15 : 360 + 15,
                        scale: 0.25,
                    },
                    delay,
                    duration: 1,
                    onComplete: () => onComplete(pixiObject.current),
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
        >
            <Graphics draw={draw} />
            <Sprite
                // filters={[new PIXI.filters.FXAAFilter()]}
                image={`/img/cards/${file}.png`}
                anchor={0}
                x={5}
                y={5}
                width={width - 10}
                height={height - 10}
                // scale={1}
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
    debugger;
    return `${rank}_of_${suit}`;
}
