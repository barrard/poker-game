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
import TextureSprite from "./utils/LoadTextureSprite";
import { grn } from "./utils/helpers";

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

        this.mainContainer = new Container();
        this.overlayContainer = new Container();
        this.playerContainer = new Container();
        // this.mainContainer.scale.x = 0.25;
        // this.mainContainer.scale.y = 0.25;
        this.yourHandSprites = { card1: null, card2: null };
        this.playerSprites = {};
        this.playerBetSprites = {};
        this.allBetChipSprites = [];

        this.playerCards = [];
        this.flop = [];
        this.allCardSprites = [];

        this.init();
    }
    async init() {
        this.createSeatPositionMap();
        // this.loadAllAssets();
        await this.makeGameBoard();
        this.drawDealer();
        this.drawPlayers();
        this.drawDealerBlindMarkers();
        this.mainContainer.addChild(this.playerContainer);
        this.mainContainer.addChild(this.overlayContainer);
        this.pixiApp.stage.addChild(this.mainContainer);
        this.mySocket.emit("hasJoined", this.gameState.id);
    }

    settleBets() {
        console.log("settleBets");
        //remove all the cards on the table.
        console.log(this);
        this.allCardSprites.forEach((card) => {
            this.mainContainer.removeChild(card.container);
        });
        this.allCardSprites = [];
        this.allBetChipSprites = [];
    }
    showDown(cards) {
        console.log("showdown");
        //all players involved need to show
        console.log(this);
        //their face cards
        console.log(cards);

        cards.forEach((card, i) => {
            const mappedPosition = this.seatPositionMap[i];
            const player = this.playerSprites[mappedPosition];
            const cardSprites = player.cardSprites;
            const location = this.positionLocations[mappedPosition];

            const isYOU = this.YOUR_POSITION === mappedPosition;
            // if (isYOU) {
            //     console.log("show your card");
            //     const yourCards = this.yourHandSprites;
            //     //for each one call, layDown
            cardSprites.forEach((cardSprite, i) => {
                let cardValue;
                let x, y, isCard1;
                y = location.y;
                if (i === 0) {
                    cardValue = card["card1"];
                    // x=location.x-
                    isCard1 = true;
                } else {
                    cardValue = card["card2"];
                }
                cardSprite.showDown({ location, cardValue, isCard1 });
            });
            // } else {
            console.log({ mappedPosition, cards, isYOU });
            // }
        });
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
        console.log("addPlayer");
        const { position } = player;

        const mappedPosition = this.seatPositionMap[position];
        const location = this.positionLocations[mappedPosition];
        player.mappedPosition = mappedPosition;
        if (this.playerSprites[mappedPosition]) return;
        const playerSprite = new Player({
            location,
            pixiGame: this,
            player,
        });
        this.playerSprites[mappedPosition] = playerSprite;
    }

    removePlayer(playerPosition) {
        if (playerPosition == undefined) {
            return console.log("removePlayer is undefined");
        }
        const mappedPosition = this.seatPositionMap[playerPosition];
        const player = this.playerSprites[mappedPosition];
        if (!player) {
            debugger;
        }
        player?.killBetTimerAnimation();
        player?.destroy();
        delete this.playerSprites[mappedPosition];

        //todo delete cards or anything else, player fold or whatever
    }

    drawDealerBlindMarkers() {
        this.marker = {};

        this.addDealMarker("dealer", "dealer", "D", 0xffffff, "black");
        this.addDealMarker("smallBlind", "dealer", "sb", 0x0b5394, "white");
        this.addDealMarker("bigBlind", "dealer", "BB", 0xbf9000, "black");
    }

    addDealMarker(name, loc, letter, color, textColor) {
        const dealerLoc = this.positionLocations[loc];

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
        if (!this.seatPositionMap) return;
        //for each player, DrawPlayer
        Object.keys(this.gameState.players).forEach((playerId) => {
            const player = this.gameState.players[playerId];
            this.addPlayer(player);
        });
    }

    async makeGameBoard() {
        // console.log("make board");
        // const asset = await Assets.load("/img/poker-table-marble-gold-3d.png");
        const asset = await Assets.load("/img/poker-table-3d.png");

        const sprite = Sprite.from(asset);
        // const sprite = Sprite.from("/img/poker-table.jpg");

        sprite.width = this.width;
        sprite.height = this.height;

        this.mainContainer.addChild(sprite);
        if (!this.seatPositionMap) return;
        //draw each seat position
        Object.keys(this.seatPositionMap).forEach((seatKey) => {
            const pos = this.positionLocations[this.seatPositionMap[seatKey]];
            const seatGfx = new Graphics();
            this.mainContainer.addChild(seatGfx);
            seatGfx.position.set(pos.x, pos.y);

            seatGfx.clear();
            seatGfx.beginFill(0xffffff, 0.1);
            seatGfx.drawRoundedRect(-25, -25, 50, 50, 5);
            //draw chip area
            const chipCoords = pos.chipCoords;
            if (!chipCoords) return;
            const chipAreaGfx = new Graphics();
            this.mainContainer.addChild(chipAreaGfx);
            chipAreaGfx.position.set(chipCoords.x, chipCoords.y);
            chipAreaGfx.clear();
            chipAreaGfx.beginFill(0xeeeeee, 0.3);
            chipAreaGfx.drawRoundedRect(-15, -15, 30, 30, 5);
        });

        //draw Board card positions
        Object.keys(this.boardCardPositions).forEach((position) => {
            const pos = this.boardCardPositions[position];
            const seatGfx = new Graphics();
            this.mainContainer.addChild(seatGfx);
            seatGfx.position.set(pos.x, pos.y);
            const width = 222 * this.globalScale * 0.5;
            const height = 323 * this.globalScale * 0.5;

            seatGfx.clear();
            seatGfx.beginFill(0xffffff, 0.1);
            seatGfx.drawRoundedRect(-width / 2, -height / 2, width, height, 5);
        });

        //draw pot location
        this.drawPotLoc();

        //draw burn pile location
        this.drawBurnPileLoc();
    }

    drawPotLoc() {
        const x = this.width * 0.5;
        const y = this.height * 0.4;
        this.potGfx = new Graphics();
        this.mainContainer.addChild(this.potGfx);
        this.potLoc = { x, y };
        this.potGfx.position.set(this.potLoc.x, this.potLoc.y);
        const width = 222 * this.globalScale * 0.35;
        const height = 323 * this.globalScale * 0.25;
        this.potGfx.clear();
        this.potGfx.beginFill(0xffffff, 0.1);
        this.potGfx.drawRoundedRect(-width / 2, -height / 2, width, height, 5);

        const textStyle = new TextStyle({
            fontFamily: "Arial",
            fill: "white",
            fontSize: this.width * 0.025,
            fontWeight: "bold",
            align: "center",
        });

        const potChipBalanceText = new Text("", textStyle);

        this.potChipBalanceText = potChipBalanceText;
        this.potChipBalanceText.anchor.x = 0.5;
        this.potChipBalanceText.anchor.y = 0.5;
        this.potChipBalanceText.position.y = y + this.globalScale * 50; // -sprite.sprite.height;
        this.potChipBalanceText.position.x = x; // -sprite.sprite.width / 2;
        this.mainContainer.addChild(potChipBalanceText);

        this.setPotBalance("0");
    }

    drawBurnPileLoc() {
        const bpGfx = new Graphics();
        this.burnPileGfx = bpGfx;
        this.mainContainer.addChild(this.burnPileGfx);
        this.burnPileLoc = { x: this.width * 0.44, y: this.height * 0.35 };
        bpGfx.position.set(this.burnPileLoc.x, this.burnPileLoc.y);
        const width = 222 * this.globalScale * 0.35;
        const height = 323 * this.globalScale * 0.25;
        bpGfx.clear();
        bpGfx.beginFill(0x666666, 0.5);
        bpGfx.drawRoundedRect(-width / 2, -height / 2, width, height, 5);
    }

    setPotBalance(balance) {
        this.potChipBalanceText.text = balance;
    }

    dealCards(playerPositions) {
        this.allCardSprites = [];
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
        this.dealBoardCard(position, delayIndex, turn);
    }

    dealRiver(river) {
        console.log(river);
        debugger;
        this.river = river;
        let delayIndex = 0;
        let position = 4;
        debugger;
        this.dealBoardCard(position, delayIndex, river);
    }

    dealBoardCard(position, delayIndex, cardValue) {
        const location = this.boardCardPositions[position];
        const card = new Card({
            location,
            pixiGame: this,
            isBoardPosition: position,
            delayIndex,
            cardValue,
        });
        // this.allCardSprites.push(card);
    }

    dealCard({ playerPositions, playerPos, isCard1, delayIndex }) {
        const player = playerPositions[playerPos];
        if (!player) return console.log("no player");
        const mappedPosition = this.seatPositionMap[playerPos];
        console.log({ mappedPosition });
        const location = this.positionLocations[mappedPosition];
        const playerSprite = this.playerSprites[mappedPosition];
        const isYou = this.YOUR_POSITION === mappedPosition;

        const card = new Card({
            location,
            pixiGame: this,
            isCard1,
            delayIndex,
            isYou,
        });
        if (isYou) {
            this.yourHandSprites[isCard1 ? "card1" : "card2"] = card;
            playerSprite.cardSprites.push(card);
        } else {
            playerSprite.cardSprites.push(card);
        }
        // this.allCardSprites.push(card);
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

    async playerBet({ position, bet }) {
        let chipImg;
        if (bet <= 10) {
            chipImg = "short-stack";
        }

        const textureUrl = `/img/chips/${chipImg}.png`;
        const sprite = new TextureSprite({
            textureUrl,
            pixiGame: this,
        });
        await sprite.load();
        this.playerBetSprites[position] = sprite.sprite;
        const { x, y } = this.getPlayerLoc(position);

        sprite.sprite.position.x = x; // -sprite.sprite.height;
        sprite.sprite.position.y = y; // -sprite.sprite.width / 2;
        const chipScale = 0.1 * this.globalScale;
        sprite.sprite.scale.x = chipScale; /// this.width; // 0.25;
        sprite.sprite.scale.y = chipScale; /// this.height; // 0.25;
        this.overlayContainer.addChild(sprite.sprite);

        this.allBetChipSprites.push(sprite);
        this.gsap.to(sprite.sprite, {
            pixi: {
                x: this.potLoc.x + grn(-10, 10),
                y: this.potLoc.y + grn(-10, 10),
            },
            duration: 1,
            ease: "power1.out",
        });
    }

    chipBalance({ position, chips, pot, bet }) {
        console.log({ position, chips, pot, bet });
        const player = this.getPlayerSprite(position);
        player.setChipBalance(chips);
        this.setPotBalance(pot);
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
        player?.endTurn();
    }

    playerWins({ position }) {
        const player = this.getPlayerSprite(position);
        player.win();
        this.awardWinner(position); //TODO doesn't exist
    }

    awardWinner(position) {
        //just move the chips to their side
        const player = this.getPlayerSprite(position);

        console.log(this.allBetChipSprites);
        this.allBetChipSprites.forEach((sprite, i) => {
            this.gsap.to(sprite.sprite, {
                pixi: {
                    x: player.location.chipCoords.x + grn(-10, 10),
                    y: player.location.chipCoords.y + grn(-10, 10),
                },
                duration: 1,
                ease: "power1.out",
                delay: 0.2 * i,
            });
        });
    }

    yourHand(hand) {
        console.log(hand);

        const [card1File, card2File] = hand;

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
        //this player has left, remove att their shit
        this.removePlayer(this.YOU?.position);
        this.yourHandSprites.card1?.timeline?.kill();
        this.yourHandSprites.card2?.timeline?.kill();
        // this.mySocket.emit("hasLeft", this.YOU.position);
        this.settleBets();
        this.allCardSprites.forEach((card) => {
            card.timeline.kill();
            // this.mainContainer.removeChild(card.container);
        });
    }

    testDeal() {
        this.dealCards();
    }
}
