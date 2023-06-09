import {
    Graphics,
    Container,
    Rectangle,
    Text,
    TextMetrics,
    TextStyle,
    utils,
    Sprite,
    Assets,
} from "pixi.js";
// import * as PIXI from "pixi.js";
import positionLocations from "./utils/positionLocations";
import boardPositions from "./utils/boardPositions";
import Player from "./utils/Player";
import Card from "./utils/Card";
//CONFIG??

export default class PixiGame {
    constructor({
        gameState,
        globalScale,
        gsap,
        height,
        mySocket,
        pixiApp,
        handleEventsLog,
        user,
        width,
    }) {
        this.handleEventsLog = handleEventsLog;
        this.mySocket = mySocket;
        this.gsap = gsap;
        this.user = user;
        this.YOU = gameState.players[user.id];
        this.YOUR_POSITION = 4;
        this.globalScale = globalScale;
        this.positionLocations = positionLocations({ width, height });
        this.boardCardPositions = boardPositions({ width, height });

        this.pixiApp = pixiApp;
        this.width = width;

        this.height = height;
        this.gameState = gameState;
        this.maxPlayers = 8;

        this.mainChartContainer = new Container();
        this.overlayContainer = new Container();
        this.playerContainer = new Container();
        // this.mainChartContainer.scale.x = 0.25;
        // this.mainChartContainer.scale.y = 0.25;
        this.yourHandSprites = { card1: null, card2: null };
        this.playerSprites = {};

        this.playerCards = [];
        this.flop = [];

        this.init();
    }
    async init() {
        this.createSeatPositionMap();
        // this.loadAllAssets();
        await this.makeGameBoard();
        this.drawDealer();
        this.drawPlayers();
        this.drawDealerBlindMarkers();
        this.mainChartContainer.addChild(this.playerContainer);
        this.mainChartContainer.addChild(this.overlayContainer);
        this.pixiApp.stage.addChild(this.mainChartContainer);
        this.mySocket.emit("hasJoined");
    }

    // loadAllAssets() {
    //     const cards = "/img/cards/";
    //     const players = "/img/players/";
    //     const loader = Loader.shared;
    //     loader.add(`${cards}10_of_clubs.png`, `${cards}10_of_clubs.png`);
    //     loader.add(`${cards}10_of_diamonds.png`, `${cards}10_of_diamonds.png`);
    //     loader.add(`${cards}10_of_hearts.png`, `${cards}10_of_hearts.png`);
    //     loader.add(`${cards}10_of_spades.png`, `${cards}10_of_spades.png`);
    //     loader.add(`${cards}2_of_clubs.png`, `${cards}2_of_clubs.png`);
    //     loader.add(`${cards}2_of_diamonds.png`, `${cards}2_of_diamonds.png`);
    //     loader.add(`${cards}2_of_hearts.png`, `${cards}2_of_hearts.png`);
    //     loader.add(`${cards}2_of_spades.png`, `${cards}2_of_spades.png`);
    //     loader.add(`${cards}3_of_clubs.png`, `${cards}3_of_clubs.png`);
    //     loader.add(`${cards}3_of_diamonds.png`, `${cards}3_of_diamonds.png`);
    //     loader.add(`${cards}3_of_hearts.png`, `${cards}3_of_hearts.png`);
    //     loader.add(`${cards}3_of_spades.png`, `${cards}3_of_spades.png`);
    //     loader.add(`${cards}4_of_clubs.png`, `${cards}4_of_clubs.png`);
    //     loader.add(`${cards}4_of_diamonds.png`, `${cards}4_of_diamonds.png`);
    //     loader.add(`${cards}4_of_hearts.png`, `${cards}4_of_hearts.png`);
    //     loader.add(`${cards}4_of_spades.png`, `${cards}4_of_spades.png`);
    //     loader.add(`${cards}5_of_clubs.png`, `${cards}5_of_clubs.png`);
    //     loader.add(`${cards}5_of_diamonds.png`, `${cards}5_of_diamonds.png`);
    //     loader.add(`${cards}5_of_hearts.png`, `${cards}5_of_hearts.png`);
    //     loader.add(`${cards}5_of_spades.png`, `${cards}5_of_spades.png`);
    //     loader.add(`${cards}6_of_clubs.png`, `${cards}6_of_clubs.png`);
    //     loader.add(`${cards}6_of_diamonds.png`, `${cards}6_of_diamonds.png`);
    //     loader.add(`${cards}6_of_hearts.png`, `${cards}6_of_hearts.png`);
    //     loader.add(`${cards}6_of_spades.png`, `${cards}6_of_spades.png`);
    //     loader.add(`${cards}7_of_clubs.png`, `${cards}7_of_clubs.png`);
    //     loader.add(`${cards}7_of_diamonds.png`, `${cards}7_of_diamonds.png`);
    //     loader.add(`${cards}7_of_hearts.png`, `${cards}7_of_hearts.png`);
    //     loader.add(`${cards}7_of_spades.png`, `${cards}7_of_spades.png`);
    //     loader.add(`${cards}8_of_clubs.png`, `${cards}8_of_clubs.png`);
    //     loader.add(`${cards}8_of_diamonds.png`, `${cards}8_of_diamonds.png`);
    //     loader.add(`${cards}8_of_hearts.png`, `${cards}8_of_hearts.png`);
    //     loader.add(`${cards}8_of_spades.png`, `${cards}8_of_spades.png`);
    //     loader.add(`${cards}9_of_clubs.png`, `${cards}9_of_clubs.png`);
    //     loader.add(`${cards}9_of_diamonds.png`, `${cards}9_of_diamonds.png`);
    //     loader.add(`${cards}9_of_hearts.png`, `${cards}9_of_hearts.png`);
    //     loader.add(`${cards}9_of_spades.png`, `${cards}9_of_spades.png`);
    //     loader.add(`${cards}ace_of_clubs.png`, `${cards}ace_of_clubs.png`);
    //     loader.add(
    //         `${cards}ace_of_diamonds.png`,
    //         `${cards}ace_of_diamonds.png`
    //     );
    //     loader.add(`${cards}ace_of_hearts.png`, `${cards}ace_of_hearts.png`);
    //     loader.add(`${cards}ace_of_spades.png`, `${cards}ace_of_spades.png`);
    //     loader.add(`${cards}back.png`, `${cards}back.png`);
    //     loader.add(`${cards}black_joker.png`, `${cards}black_joker.png`);
    //     loader.add(`${cards}jack_of_clubs.png`, `${cards}jack_of_clubs.png`);
    //     loader.add(
    //         `${cards}jack_of_diamonds.png`,
    //         `${cards}jack_of_diamonds.png`
    //     );
    //     loader.add(`${cards}jack_of_hearts.png`, `${cards}jack_of_hearts.png`);
    //     loader.add(`${cards}jack_of_spades.png`, `${cards}jack_of_spades.png`);
    //     loader.add(`${cards}king_of_clubs.png`, `${cards}king_of_clubs.png`);
    //     loader.add(
    //         `${cards}king_of_diamonds.png`,
    //         `${cards}king_of_diamonds.png`
    //     );
    //     loader.add(`${cards}king_of_hearts.png`, `${cards}king_of_hearts.png`);
    //     loader.add(`${cards}king_of_spades.png`, `${cards}king_of_spades.png`);
    //     loader.add(`${cards}queen_of_clubs.png`, `${cards}queen_of_clubs.png`);
    //     loader.add(
    //         `${cards}queen_of_diamonds.png`,
    //         `${cards}queen_of_diamonds.png`
    //     );
    //     loader.add(
    //         `${cards}queen_of_hearts.png`,
    //         `${cards}queen_of_hearts.png`
    //     );
    //     loader.add(
    //         `${cards}queen_of_spades.png`,
    //         `${cards}queen_of_spades.png`
    //     );
    //     loader.add(`${cards}red_joker.png`, `${cards}red_joker.png`);
    //     loader.add(`${players}/dealer.png`, `${players}/dealer.png`);
    // }

    drawDealer() {
        // console.log("draw dealer");
        const location = this.positionLocations["dealer"];

        const playerGfx = new Player({
            location,
            pixiGame: this,
            player: { position: "dealer" },
        });
    }

    addPlayer(player) {
        const { position } = player;

        const mappedPosition = this.seatPositionMap[position];
        const location = this.positionLocations[mappedPosition];

        const playerSprite = new Player({
            location,
            pixiGame: this,
            player,
        });
        this.playerSprites[mappedPosition] = playerSprite;
    }

    removePlayer(playerPosition) {
        const mappedPosition = this.seatPositionMap[playerPosition];
        const player = this.playerSprites[mappedPosition];
        if (!player) {
            debugger;
        }
        player.killBetTimerAnimation();
        delete this.playerSprites[mappedPosition];
    }

    drawDealerBlindMarkers() {
        this.marker = {};

        this.addDealMarker("dealer", "dealer", "D", 0xffffff, "black");
        this.addDealMarker("smallBlind", "dealer", "sb", 0x0b5394, "white");
        this.addDealMarker("bigBlind", "dealer", "BB", 0xbf9000, "black");
    }

    addDealMarker(name, loc, letter, color, textColor) {
        const dealerLoc = this.positionLocations[loc];
        //drawDealerChip

        this.marker[name] = new Container();
        this.marker[name].position.x = dealerLoc.x;
        this.marker[name].position.y = dealerLoc.y;
        const dealerGfx = new Graphics();
        const textStyle = new TextStyle({
            fontFamily: "Arial",
            fill: textColor,
            fontSize: this.width * 0.012,
            fontWeight: "bold",
            align: "center",
        });
        const D = new Text(letter, textStyle);
        D.anchor.set(0.5);
        dealerGfx.beginFill(color);
        dealerGfx.drawCircle(0, 0, this.width * 0.01);
        dealerGfx.endFill();
        this.marker[name].addChild(dealerGfx);
        this.marker[name].addChild(D);
        this.overlayContainer.addChild(this.marker[name]);
    }

    drawPlayers() {
        // console.log("drawPlayers");
        if (!this.seatPositionMap) return;
        //for each player, DrawPlayer
        Object.keys(this.gameState.players).forEach((playerId) => {
            const player = this.gameState.players[playerId];
            const { position } = player;
            const mappedPosition = this.seatPositionMap[position];
            const location = this.positionLocations[mappedPosition];
            // console.log(location);
            const playerSprite = new Player({
                location,
                pixiGame: this,
                player,
            });
            this.playerSprites[mappedPosition] = playerSprite;
        });
    }

    async makeGameBoard() {
        // console.log("make board");
        const asset = await Assets.load("/img/poker-table-marble-gold-3d.png");
        const sprite = Sprite.from(asset);
        // const sprite = Sprite.from("/img/poker-table.jpg");

        sprite.width = this.width;
        sprite.height = this.height;

        this.mainChartContainer.addChild(sprite);
        if (!this.seatPositionMap) return;
        //draw each seat position
        Object.keys(this.seatPositionMap).forEach((seatKey) => {
            const pos = this.positionLocations[this.seatPositionMap[seatKey]];
            const seatGfx = new Graphics();
            this.mainChartContainer.addChild(seatGfx);
            seatGfx.position.set(pos.x, pos.y);

            seatGfx.clear();
            seatGfx.beginFill(0xffffff, 0.1);
            seatGfx.drawRoundedRect(-25, -25, 50, 50, 5);
        });

        //draw Board card positions
        Object.keys(this.boardCardPositions).forEach((position) => {
            const pos = this.boardCardPositions[position];
            const seatGfx = new Graphics();
            this.mainChartContainer.addChild(seatGfx);
            seatGfx.position.set(pos.x, pos.y);
            const width = 222 * this.globalScale * 0.5;
            const height = 323 * this.globalScale * 0.5;

            seatGfx.clear();
            seatGfx.beginFill(0xffffff, 0.1);
            seatGfx.drawRoundedRect(-width / 2, -height / 2, width, height, 5);
        });
    }

    dealCards(playerPositions) {
        playerPositions =
            playerPositions ||
            Object.values(this.gameState.players).map((player) => ({
                [player.position]: player,
            }));

        const players = Object.keys(playerPositions);
        console.log(players);
        const dealDuration = players.length * 100;

        let isCard1 = true;
        players.forEach((playerPos, i) => {
            // console.log(`dealing ${isCard1 ? " card 1" : "card 2"}`);
            this.dealCard({
                playerPositions,
                playerPos,
                isCard1,
                delayIndex: i + 1,
            });
        });
        isCard1 = false;

        setTimeout(() => {
            players.forEach((playerPos, i) => {
                // console.log(`dealing ${isCard1 ? " card 1" : "card 2"}`);

                this.dealCard({
                    playerPositions,
                    playerPos,
                    isCard1,
                    delayIndex: i + 1,
                });
            });
        }, dealDuration);
    }

    dealFlop(flop) {
        this.flop = flop;
        let delayIndex = 0;
        let position = 0;
        debugger;
        this.dealBoardCard(position, ++delayIndex, flop[0]);
        this.dealBoardCard(++position, ++delayIndex, flop[1]);
        this.dealBoardCard(++position, ++delayIndex, flop[2]);
    }

    dealTurn(turn) {
        console.log(turn);
        debugger;
        this.turn = turn;
        let delayIndex = 0;
        let position = 3;
        debugger;
        this.dealBoardCard(position, ++delayIndex, turn);
    }

    dealRiver(river) {
        console.log(river);
        debugger;
        this.river = river;
        let delayIndex = 0;
        let position = 4;
        debugger;
        this.dealBoardCard(position, ++delayIndex, river);
    }

    dealBoardCard(position, delayIndex, cardValue) {
        //todo
        const location = this.boardCardPositions[position];

        debugger;
        const card = new Card({
            location,
            pixiGame: this,
            // width,
            // height,
            isBoardPosition: position,
            delayIndex,
            cardValue,
        });
    }

    dealCard({ playerPositions, playerPos, isCard1, delayIndex }) {
        const player = playerPositions[playerPos];
        if (!player) return console.log("no p;ayer");
        const mappedPosition = this.seatPositionMap[playerPos];
        console.log({ mappedPosition });
        const location = this.positionLocations[mappedPosition];
        const isYou = this.YOUR_POSITION === mappedPosition;

        //card size?+
        // isYou?
        //isBoard?
        // let width = scale;
        // let height = scale;
        const card = new Card({
            location,
            pixiGame: this,
            // width,
            // height,
            isCard1,
            delayIndex,
            isYou,
        });
        if (isYou) {
            this.yourHandSprites[isCard1 ? "card1" : "card2"] = card;
        }
    }

    setDealerChip({ position }) {
        this.setMarkerChipPosition({ position, chip: "dealer" });
    }

    setBigBlindChip({ position }) {
        this.setMarkerChipPosition({ position, chip: "bigBlind" });
    }

    setSmallBlindChip({ position }) {
        this.setMarkerChipPosition({ position, chip: "smallBlind" });
    }

    setMarkerChipPosition({ position, chip }) {
        const location = this.getPlayerLoc(position);
        //animate market to positin with gsap
        const container = this.marker[chip];
        if (!location) {
            debugger;
        }
        this.gsap.to(container, {
            pixi: {
                x:
                    chip === "dealer"
                        ? location.x - this.width * 0.012 * 2
                        : location.x,
                y: chip === "dealer" ? location.y : location.y,
            },
            duration: 1,
            ease: "power1.out",
        });
    }

    chipBalance({ position, chips }) {
        const player = this.getPlayerSprite(position);
        player.setBalance(chips);
    }

    playerCheck({ position }) {
        const player = this.getPlayerSprite(position);
        player.check();
    }

    playerFold({ position }) {
        const player = this.getPlayerSprite(position);
        player.fold();
    }

    playerTurnEnd({ position }) {
        //clear the timer and select

        const player = this.getPlayerSprite(position);
        player.endTurn();
    }

    playerWins({ position }) {
        const player = this.getPlayerSprite(position);
        player.win();
        // this.awardWinner();//TODO doesn't exist
    }

    yourHand(hand) {
        console.log(hand);

        const [card1File, card2File] = hand;
        // const card1Sprite = this.yourHandSprites["card1"];
        // const card2Sprite = this.yourHandSprites["card2"];
        this.playerCards = [card1File, card2File];
    }

    betCheckFold(position, data) {
        const player = this.playerSprites[this.YOUR_POSITION];

        player.betCheckFold(data);
    }

    playersBettingTurn({ positionsTurn, toCall }) {
        const playerSprite = this.getPlayerSprite(positionsTurn);
        playerSprite.startBetTimer();
        //add to messages
        if (positionsTurn === this.YOU.position) {
            this.handleEventsLog({
                color: "blue",
                msg: `You turn to call ${toCall}`,
            });
        } else {
            this.handleEventsLog({
                color: "blue",
                msg: `Player ${positionsTurn} turn to call ${toCall}`,
            });
        }
    }

    createSeatPositionMap() {
        if (!this.YOU) return;
        this.gamePositions = Object.keys(this.gameState.positions);
        this.seatPositionMap = {
            [this.YOU.position]: this.YOUR_POSITION,
        };

        while (Object.keys(this.seatPositionMap).length < this.maxPlayers) {
            let newPos =
                this.YOU.position + Object.keys(this.seatPositionMap).length;
            let newRelativePosition =
                this.YOUR_POSITION + Object.keys(this.seatPositionMap).length;
            if (newPos > this.maxPlayers - 1) newPos -= this.maxPlayers;
            if (newRelativePosition > this.maxPlayers - 1)
                newRelativePosition -= this.maxPlayers;

            this.seatPositionMap[newPos] = newRelativePosition;
        }
    }

    getPlayerSprite(position) {
        const mappedPosition = this.seatPositionMap[position];
        const playerSprite = this.playerSprites[mappedPosition];
        return playerSprite;
    }

    getPlayerLoc(position) {
        const mappedPosition = this.seatPositionMap[position];
        const location = this.positionLocations[mappedPosition];
        return location;
    }

    destroy() {
        console.log("dis game stay ovah!");
        //kill any animation like players timers
    }
}
