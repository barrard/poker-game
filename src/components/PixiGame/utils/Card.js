import {
    Container,
    Graphics,
    Point,
    Assets,
    Rectangle,
    Sprite,
    SCALE_MODES,
    Text,
    TextMetrics,
    TextStyle,
    Texture,
    utils,
} from "pixi.js";

// import * as PIXI from "pixi.js";
export default class Card {
    constructor(opts = {}) {
        const {
            location = {},
            // width,
            // height,
            isYou,
            pixiGame,
            // card,
            dealerLocation,
            isCard1,
            delayIndex,
        } = opts;
        const scale = isYou ? 0.5 : 0.25;
        const { x, y } = location;
        this.x = x + 222 * scale;
        this.y = y; ///+ 323; //* scale;
        this.dealerLocation = pixiGame.positionLocations["dealer"];
        this.location = location;
        this.pixiGame = pixiGame;
        this.isYOU = isYou;
        this.cardFaceDrawn = false;
        // this.card = card;
        this.delayIndex = delayIndex;
        this.cardWidth = 222;
        this.cardHeight = 323;
        this.scale = scale;
        this.isCard1 = isCard1;

        this.init();
    }

    async init() {
        const container = new Container();
        this.container = container;

        const cardGfx = new Graphics();
        // cardGfx.pivot.set(0.5);
        this.cardGfx = cardGfx;
        container.addChild(cardGfx);

        this.backTextureUrl = `/img/cards/${"back"}.png`;
        const texture = await Assets.load(this.backTextureUrl);
        const cardSprite = Sprite.from(texture);

        cardSprite.anchor.set(0.5);

        this.cardSprite = cardSprite;
        this.width = this.cardWidth * this.pixiGame.globalScale * this.scale;
        this.height = this.cardHeight * this.pixiGame.globalScale * this.scale;
        cardSprite.width = this.width;
        cardSprite.height = this.height;
        container.addChild(cardSprite);

        this.container.position.set(
            this.dealerLocation.x,
            this.dealerLocation.y
        );
        // this.container.pivot.set(new Point(this.width / 2, this.height / 2));
        // this.container.pivot.set((this.width / 2, this.height / 2));
        this.container.scale.x = 0;
        this.container.scale.y = 0;

        this.pixiGame.mainChartContainer.addChild(container);

        // const errorGfx = new Graphics();
        // this.errorGfx = errorGfx;
        // container.addChild(errorGfx);

        // const playerSelect = new Graphics();
        // this.playerSelect = playerSelect;
        // container.addChild(playerSelect);

        console.log("drawCard");
        this.draw();
        // this.setFace();
    }

    setFace(cardFile = "6_of_clubs") {
        // this.cardFaceSprite = Sprite.from(`/img/cards/${cardFile}.png`);
        // this.cardFaceSprite.width = this.width;
        // this.cardFaceSprite.height = this.height;
    }

    draw() {
        const padding = this.width * 0.05;
        this.padding = padding;
        console.log({ width: this.width, height: this.height });
        this.cardGfx.clear();
        this.cardGfx.beginFill(0xffffff, 1);
        this.cardGfx.drawRoundedRect(
            -this.width / 2 - padding,
            -this.height / 2 - padding,
            this.width + padding * 2,
            this.height + padding * 2,
            5
        );

        const x = this.isCard1
            ? this.x - this.width * 0.35
            : this.x + this.width * 0.15;
        const y = this.y;
        console.log({ x, y });
        this.pixiGame.gsap.to(this.container, {
            pixi: {
                x: x,
                y: y,
                angle: this.isCard1 ? 360 - 10 : 360 + 5,

                scale: 1,
            },
            duration: 1,
            delay: this.delayIndex * 0.1,
            ease: "power1.out",
            onComplete: this.flipCard.bind(this),
        });
    }

    flipCard() {
        if (this.isYOU) {
            const timeline = this.pixiGame.gsap.timeline({
                onUpdate: async (v) => {
                    if (this.cardFaceDrawn) return;
                    if (
                        this.container.skew["_y"] >= Math.PI / 2 &&
                        !this.cardFaceDrawn
                    ) {
                        const cardFile = this.isCard1
                            ? this.pixiGame.playerCards[0]
                            : this.pixiGame.playerCards[1];
                        const textureUrl = `/img/cards/${cardFile}.png`;
                        const texture = await Assets.load(textureUrl);

                        this.cardFaceSprite = Sprite.from(texture);
                        this.cardFaceSprite.anchor.set(0.5);

                        this.cardFaceSprite.width = this.width;
                        this.cardFaceSprite.height = this.height;
                        this.cardFaceDrawn = true;
                        this.container.removeChild(this.cardSprite);
                        this.container.addChild(this.cardFaceSprite);

                        // this.cardFaceSprite.position.set(this.width, 0);

                        this.cardFaceSprite.skew.y = -Math.PI;
                    }
                },
            });

            timeline.to(this.container, {
                duration: 1,

                pixi: {
                    skewY: 180,
                },
            });
        }
    }

    playerError() {
        // const playerError = useCallback((g) => {
        this.errorGfx.clear();

        this.errorGfx.lineStyle(8, 0xdd1111, 0.9);
        this.errorGfx.arc(0, 0, 60, 0, Math.PI * 2, false);

        this.errorGfx.endFill();
        // }, []);

        // return <Graphics anchor={0.5} draw={playerError} />;
    }
}