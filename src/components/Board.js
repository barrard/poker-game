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
export const Board = ({ game, user }) => {
  console.log({ game, user });
  const YOU = game.players[user.id];
  const YOUR_POSITION = 3;
  const seatPositionMap = {
    [YOU.position]: YOUR_POSITION, //5 : 3 /// 0:3
    // 6 : 4  //  1:4
  };

  while (Object.keys(seatPositionMap).length < 7) {
    let newPos = YOU.position + Object.keys(seatPositionMap).length;
    let newRelativePosition = YOUR_POSITION + Object.keys(seatPositionMap).length;
    if (newPos > 6) newPos -= 7;
    if (newRelativePosition > 6) newRelativePosition -= 7;

    seatPositionMap[newPos] = newRelativePosition;
    debugger;
  }

  const getRelativeSeatPosition = (player) => {
    // console.log(YOU);
    // if (YOU.position > seatPositionMap[YOU.position]) {
    //   offset = YOU.position - seatPositionMap[YOU.position];
    // } else {
    //   offset = seatPositionMap[YOU.position] - YOU.position;
    // }
    // debugger;
    // console.log(player);
  };
  const appRef = useRef(null);
  const pixieRef = useRef(null);

  const width = window.innerWidth;
  const height = (width / 1920) * 1080;
  const maxTableWidth = 1200;
  const tableWidth = window.innerWidth > maxTableWidth ? maxTableWidth : window.innerWidth;
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
  };

  const dealer = {
    x: width / 2,
    y: height * 0.25,
    rotation: 0,
  };

  const pixiObject = useRef();
  useEffect(() => {
    if (pixiObject.current) {
      gsap.to(pixiObject.current, { pixi: { scaleX: 2, scaleY: 1.5, skewX: 30, rotation: 60 }, duration: 1 });
    }
  }, [pixiObject.current]);

  console.log({ width, height });

  const Card = (props) => {
    const draw = useCallback((g) => {
      g.clear();

      g.beginFill(0xffffff, 1);
      g.drawRoundedRect(0, 0, 222, 323, 5);

      g.endFill();
    }, []);
    return (
      //222x323
      <Container x={100} y={100}>
        <Graphics draw={draw} />
        <Sprite image={props.file} anchor={0} x={0} y={0} />
      </Container>
    );
  };

  const Player = (props) => {
    const { player } = props;
    let pos = seatPositionMap[player.position]; //+ YOU.position;
    // if (pos > 6) pos = pos - 6;
    let _pos = positions[pos];
    debugger;
    const playerSelect = useCallback((g) => {
      g.clear();

      g.lineStyle(2, 0xffffff, 0.5);
      //   g.arcTo(0, 0, 45, 45, 500);
      g.arc(0, 0, 60, 0, Math.PI * 2, false);

      g.endFill();
    }, []);
    return (
      <Container anchor={0.5} x={_pos.x} y={_pos.y}>
        <Graphics anchor={0.5} draw={playerSelect} />
        <Sprite image={`/img/players/${player.position}.png`} angle={_pos.rotation} anchor={0.5} />
      </Container>
    );
  };
  return (
    <BoardContainer>
      <Stage width={width} height={height}>
        <Sprite image="/img/poker-table.jpg" width={tableWidth} height={tableHeight} x={width / 2} y={height / 2} anchor={{ x: 0.5, y: 0.5 }} />
        {Object.keys(game.players).map((socketId) => {
          debugger;
          return <Player key={socketId} player={game.players[socketId]} />;
        })}
        {/* <Player player={{ position: 3 }} /> */}
        {/* <Sprite image="/img/players/2.png" angle={position1.rotation} anchor={0.5} x={position1.x} y={position1.y} /> */}
        {/* <Sprite image="/img/players/Fighter-M-02.png" angle={position2.rotation} anchor={0.5} x={position2.x} y={position2.y} />
        <Sprite image="/img/players/Fighter-M-02.png" angle={position3.rotation} anchor={0.5} x={position3.x} y={position3.y} />
        <Sprite image="/img/players/Fighter-M-02.png" angle={position4.rotation} anchor={0.5} x={position4.x} y={position4.y} />
        <Sprite image="/img/players/Fighter-M-02.png" angle={position5.rotation} anchor={0.5} x={position5.x} y={position5.y} />
        <Sprite image="/img/players/Fighter-M-02.png" angle={position6.rotation} anchor={0.5} x={position6.x} y={position6.y} />
        <Sprite image="/img/players/Fighter-M-02.png" angle={position7.rotation} anchor={0.5} x={position7.x} y={position7.y} /> */}
        <Sprite image="/img/players/dealer.png" angle={dealer.rotation} anchor={0.5} x={dealer.x} y={dealer.y} />
        {/* //CARDS */}
        <Card file="/img/cards/2_of_clubs.png" />
        <Container>{/* <Text text="Hello World" anchor={{ x: 0.5, y: 0.5 }} filters={[blurFilter]} /> */}</Container>
      </Stage>
    </BoardContainer>
  );
};

const spin = keyframes`
0%{transform:rotate(0deg)}
100%{transform:rotate(360deg)}
`;

const BoardContainer = styled.div`
  width: 100%;
  margin-bottom: 15em;
  border: 2px solid red;
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
