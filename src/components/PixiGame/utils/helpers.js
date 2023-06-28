import { TextMetrics, TextStyle } from "pixi.js";
export function grn(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// export const textStyle = new TextStyle({
//     fontFamily: "Arial",
//     fill: "white",
//     fontSize: this.width * 0.03,
//     fontWeight: "bold",
//     align: "center",
// });
