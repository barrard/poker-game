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

export default class Player {
    constructor(opts = {}) {
        const { location = {} } = opts;
        const { x, y } = location;

        this.location = opts.location;
        this.pixiGame = opts.pixiGame;
        this.player = opts.player;

        const container = new Container();
        container.position.set(x, y);
        this.container = container;
        opts.pixiGame.mainChartContainer.addChild(container);

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
        const balanceText = new Text(this.player.chips);
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

        this.balanceText.position.y = -sprite.sprite.height;
        this.balanceText.position.x = -sprite.sprite.width / 2;

        this.container.addChild(sprite.sprite);
    }

    playerSelect() {
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

        this.animationTimer = this.pixiGame.gsap.to(angles, {
            end: 0,

            ease: Linear.easeNone,

            duration: 20,
            onUpdate: () => {
                if (!this.playerSelectGfx?._geometry) {
                    debugger;
                    this.killAnimations();
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

    setBalance(balance) {
        this.balanceText.text = balance;
    }

    betCheckFold(data) {
        debugger;
        this.pixiGame.mySocket.emit("betCheckFold", data);
    }

    playerError() {
        // const playerError = useCallback((g) => {
        this.errorGfx.clear();

        // }, []);

        // return <Graphics anchor={0.5} draw={playerError} />;
    }

    killAnimations() {
        if (this.animationTimer) {
            this.animationTimer.kill();
        }
    }

    isYOU() {
        return this.player.position === this.YOU.position;
    }
}
