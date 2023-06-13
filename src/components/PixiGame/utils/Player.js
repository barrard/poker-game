import {
    Container,
    Graphics,
    Rectangle,
    Sprite,
    Text,
    TextMetrics,
    TextStyle,
    Texture,
    utils,
} from "pixi.js";
import { Linear } from "gsap";
import TextureSprite from "./LoadTextureSprite";
import { grn } from "./helpers";

export default class Player {
    constructor(opts = {}) {
        const { location = {} } = opts;
        const { x, y, chipCoords } = location;
        this.chipCoords = chipCoords;
        this.playerBetTime = 20;

        this.location = opts.location;
        this.pixiGame = opts.pixiGame;
        this.player = opts.player;
        this.cardSprites = [];

        const container = new Container();
        container.position.set(x, y);
        this.container = container;
        opts.pixiGame.playerContainer.addChild(container);

        const errorGfx = new Graphics();
        this.errorGfx = errorGfx;
        container.addChild(errorGfx);

        const playerTimerGfx = new Graphics();
        this.playerTimerGfx = playerTimerGfx;
        container.addChild(playerTimerGfx);

        const playerSelectGfx = new Graphics();
        this.playerSelectGfx = playerSelectGfx;
        container.addChild(playerSelectGfx);

        //dealer has no chips
        // if (this.player.chips) {
        const textStyle = new TextStyle({
            fontFamily: "Arial",
            fill: "white",
            fontSize: this.pixiGame.width * 0.012,
            fontWeight: "bold",
            align: "center",
        });
        const balanceText = new Text(this.player.chips, textStyle);

        this.balanceText = balanceText || "";
        container.addChild(balanceText);
        // }
        this.draw();
    }

    async draw() {
        const textureUrl = `/img/players/${this.player.position}.png`;
        const sprite = new TextureSprite({
            textureUrl,
            pixiGame: this.pixiGame,
        });
        await sprite.load();
        this.balanceText.anchor.x = 0.5;
        this.balanceText.anchor.y = 0.5;
        this.balanceText.position.y = this.pixiGame.width * 0.025; // -sprite.sprite.height;
        this.balanceText.position.x = 0; // -sprite.sprite.width / 2;

        this.container.addChild(sprite.sprite);
        //draw chips

        if (this.player.position !== "dealer") {
            this.drawChipStack("large-stack");
        }
    }

    async drawChipStack(stack) {
        const textureUrl = `/img/chips/${stack}.png`;
        const sprite = new TextureSprite({
            textureUrl,
            pixiGame: this.pixiGame,
        });
        await sprite.load();
        const chipScale = 50;
        sprite.sprite.scale.x = chipScale / this.pixiGame.width; // 0.25;
        sprite.sprite.scale.y = chipScale / this.pixiGame.width; // 0.25;
        const x = this.location.chipCoords.x - this.location.x;
        const y = this.location.chipCoords.y - this.location.y;
        sprite.sprite.position.set(x, y);
        // sprite.sprite.anchor.set(0.5);
        this.container.addChild(sprite.sprite);
    }

    startBetTimer() {
        this.playerSelectGfx.clear();
        this.playerTimerGfx.clear();

        // Set the line style and fill color
        this.playerSelectGfx.lineStyle({
            width: 5,
            color: 0xff0000,
        }); // Set line thickness and color
        this.playerTimerGfx.lineStyle(5, 0xcccccc, 0.5);
        // Draw an arc
        const x = 0; // X-coordinate of the center point
        const y = 0; // Y-coordinate of the center point
        const radius = 50; // Radius of the arc
        const startAngle = 0; // Starting angle in radians
        const endAngle = Math.PI * 2; // Ending angle in radians
        const anticlockwise = false; // Clockwise (false) or anticlockwise (true)

        this.playerTimerGfx.arc(
            x,
            y,
            radius,
            startAngle,
            endAngle,
            anticlockwise
        );

        this.playerSelectGfx.arc(
            x,
            y,
            radius,
            startAngle,
            endAngle,
            anticlockwise
        );

        // End the shape
        this.playerSelectGfx.endFill();

        const angles = { end: Math.PI * 2 };

        this.betTimerAnimation = this.pixiGame.gsap.to(angles, {
            end: 0,

            ease: Linear.easeNone,

            duration: this.playerBetTime,
            onUpdate: () => {
                if (!this.playerSelectGfx?._geometry) {
                    this.killBetTimerAnimation();
                    return;
                }
                this.playerSelectGfx.clear();
                // this.playerSelectGfx.beginFill(0xff0000);
                this.playerSelectGfx.lineStyle({
                    width: 5,
                    color: 0xff0000,
                });
                this.playerSelectGfx.arc(
                    x,
                    y,
                    radius,
                    startAngle,
                    angles.end,
                    false
                );
                this.playerSelectGfx.endFill();
            },
        });
    }

    check() {
        //TODO: draw a big check mark or whatever shows this action
        this.playerSelect(0x00ffaa); //sorta greenish blue
    }

    fold() {
        this.playerSelect(0xff0099); //sorta reddish blue
        //animate cards to burn pile
        let cards;
        if (this.isYOU()) {
            cards = [
                this.pixiGame.yourHandSprites["card1"],
                this.pixiGame.yourHandSprites["card2"],
            ];
            cards[0].turnFaceDown();
            cards[1].turnFaceDown();
        } else {
            cards = this.cardSprites;
        }
        const [card1, card2] = cards;

        this.pixiGame.gsap.to(card1.container, {
            pixi: {
                x: this.pixiGame.burnPileLoc.x + grn(-10, 10),
                y: this.pixiGame.burnPileLoc.y + grn(-10, 10),
                angle: -360 + grn(-20, 20),
            },
            duration: 1,
            ease: "power1.out",
        });
        this.pixiGame.gsap.to(card2.container, {
            pixi: {
                x: this.pixiGame.burnPileLoc.x + grn(-10, 10),
                y: this.pixiGame.burnPileLoc.y + grn(-10, 10),
                angle: -360 + grn(-20, 20),
            },
            duration: 1,
            ease: "power1.out",
        });
    }

    endTurn() {
        this.killBetTimerAnimation();
        if (this.playerSelectGfx?._geometry) {
            this.playerSelectGfx.clear();
        }
        if (this.playerTimerGfx?._geometry) {
            this.playerTimerGfx.clear();
        }
    }

    win() {
        this.playerSelect(0x00ff55); //sorta greenish blue
    }

    playerSelect(color) {
        this.errorGfx.clear();
        this.errorGfx.lineStyle(5, color, 0.5);
        // Draw an arc
        const x = 0; // X-coordinate of the center point
        const y = 0; // Y-coordinate of the center point
        const radius = 50; // Radius of the arc
        const startAngle = 0; // Starting angle in radians
        const endAngle = Math.PI * 2; // Ending angle in radians
        const anticlockwise = false; // Clockwise (false) or anticlockwise (true)
        this.errorGfx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
        // End the shape
        this.errorGfx.endFill();
        setTimeout(() => {
            this.errorGfx.clear();
        }, 2000);
    }

    setBalance(balance) {
        this.balanceText.text = balance;
    }

    betCheckFold(data) {
        debugger;
        this.pixiGame.mySocket.emit("betCheckFold", data);
    }

    playerError(color) {
        // const playerError = useCallback((g) => {
        this.errorGfx.clear();
    }

    killBetTimerAnimation() {
        if (this.betTimerAnimation) {
            this.betTimerAnimation.kill();
        }
    }

    isYOU() {
        return this.pixiGame.YOUR_POSITION === this.player.mappedPosition;
        //
        // return this.player.position === this.YOU.position;
    }
}
