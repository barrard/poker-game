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
import Player from "./utils/Player";
import Card from "./utils/Card";
//CONFIG??

export default class PixiGame {
    constructor({
        pixiApp,
        height,
        width,
        gameState,
        user,
        gsap,
        globalScale,
        mySocket,
    }) {
        this.mySocket = mySocket;
        this.gsap = gsap;
        this.user = user;
        this.YOU = gameState.players[user.id];
        this.YOUR_POSITION = 3;
        this.globalScale = globalScale;
        this.positionLocations = positionLocations({ width, height });

        this.pixiApp = pixiApp;
        this.width = width;

        this.height = height;
        this.gameState = gameState;

        this.mainChartContainer = new Container();
        // this.mainChartContainer.scale.x = 0.25;
        // this.mainChartContainer.scale.y = 0.25;
        this.yourHandSprites = { card1: null, card2: null };
        this.playerSprites = {};

        this.init();
    }
    async init() {
        this.createSeatPositionMap();
        // this.loadAllAssets();
        await this.makeGameBoard();
        this.drawDealer();
        this.drawPlayers();
        this.pixiApp.stage.addChild(this.mainChartContainer);
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
        console.log("draw dealer");
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
        player.killAnimations();
        delete this.playerSprites[mappedPosition];
    }

    drawPlayers() {
        console.log("drawPlayers");
        //for each player, DrawPlayer
        Object.keys(this.gameState.players).forEach((playerId) => {
            const player = this.gameState.players[playerId];
            const { position } = player;
            const mappedPosition = this.seatPositionMap[position];
            const location = this.positionLocations[mappedPosition];
            console.log(location);
            const playerSprite = new Player({
                location,
                pixiGame: this,
                player,
            });
            this.playerSprites[mappedPosition] = playerSprite;
        });
    }

    async makeGameBoard() {
        console.log("make board");
        const asset = await Assets.load("/img/poker-table.jpg");
        const sprite = Sprite.from(asset);
        // const sprite = Sprite.from("/img/poker-table.jpg");

        sprite.width = this.width;
        sprite.height = this.height;

        this.mainChartContainer.addChild(sprite);
        //draw each seat position
        Object.keys(this.seatPositionMap).forEach((seatKey) => {
            console.log(
                seatKey,
                this.positionLocations[this.seatPositionMap[seatKey]]
            );
            const pos = this.positionLocations[this.seatPositionMap[seatKey]];
            const seatGfx = new Graphics();
            this.mainChartContainer.addChild(seatGfx);
            seatGfx.position.set(pos.x, pos.y);

            seatGfx.clear();
            seatGfx.beginFill(0xffffff, 1);
            seatGfx.drawRoundedRect(-25, -25, 50, 50, 5);
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
            console.log(`dealing ${isCard1 ? " card 1" : "card 2"}`);
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
                console.log(`dealing ${isCard1 ? " card 1" : "card 2"}`);

                this.dealCard({
                    playerPositions,
                    playerPos,
                    isCard1,
                    delayIndex: i + 1,
                });
            });
        }, dealDuration);
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
    chipBalance({ position, chips }) {
        const mappedPosition = this.seatPositionMap[position];

        const player = this.playerSprites[mappedPosition];
        player.setBalance(chips);
    }

    yourHand(hand) {
        console.log(hand);

        const [card1File, card2File] = hand;
        const card1Sprite = this.yourHandSprites["card1"];
        const card2Sprite = this.yourHandSprites["card2"];
        this.playerCards = [card1File, card2File];
    }

    betCheckFold(position, data) {
        console.log({ position, data });
        const mappedPosition = this.seatPositionMap[position];

        const player = this.playerSprites[mappedPosition];

        player.betCheckFold(data);
    }

    playersBettingTurn(playerPosition) {
        console.log({ playerPosition });
        const mappedPosition = this.seatPositionMap[playerPosition];
        const playerSprite = this.playerSprites[mappedPosition];
        playerSprite.playerSelect();
    }

    createSeatPositionMap() {
        this.gamePositions = Object.keys(this.gameState.positions);
        this.seatPositionMap = {
            [this.YOU.position]: this.YOUR_POSITION,
        };

        while (Object.keys(this.seatPositionMap).length < 7) {
            let newPos =
                this.YOU.position + Object.keys(this.seatPositionMap).length;
            let newRelativePosition =
                this.YOUR_POSITION + Object.keys(this.seatPositionMap).length;
            if (newPos > 6) newPos -= 7;
            if (newRelativePosition > 6) newRelativePosition -= 7;

            this.seatPositionMap[newPos] = newRelativePosition;
        }
    }

    destroy() {
        console.log("dis game stay ovah!");
        //kill any animation like players timers
    }
}
