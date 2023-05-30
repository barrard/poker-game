import { Assets, Texture, utils, Sprite } from "pixi.js";
export default class TextureSprite {
    constructor({ textureUrl, pixiGame }) {
        this.textureUrl = textureUrl;
        this.pixiGame = pixiGame;

        // this.init()
    }

    async load() {
        const texture = await Assets.load(this.textureUrl);
        const sprite = Sprite.from(texture);
        // texture.on("update", () => {
        //     const naturalWidth = texture.width;
        //     const naturalHeight = texture.height;
        //     debugger;
        //     console.log("Natural image size:", naturalWidth, naturalHeight);
        //     sprite.width = texture.width * this.pixiGame.globalScale;
        //     sprite.height = texture.height * this.pixiGame.globalScale;
        // });

        sprite.width = texture.width * this.pixiGame.globalScale;
        sprite.height = texture.height * this.pixiGame.globalScale;
        sprite.anchor.set(0.5);
        this.sprite = sprite;
    }
}
