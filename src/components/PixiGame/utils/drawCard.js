export default function Card(opts = {}) {
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
        currentHand = false,
    } = opts;

    debugger;

    // const pixiObject = useRef();
    // const width = 222;
    // const height = 323;

    // const [cardFile, setCardFile] = useState(file);
    // const faceValue = !currentHand
    //     ? "back"
    //     : isCard1
    //     ? convertCardToFile(currentHand[0])
    //     : convertCardToFile(currentHand[1]);

    // if (isDealt) {
    //     x = positions.dealer.x;
    //     y = positions.dealer.y;
    // }

    // useEffect(() => {
    //     if (pixiObject.current) {
    //         if (isDealt) {
    //             gsap.to(pixiObject.current, {
    //                 pixi: {
    //                     positionX: isCard1
    //                         ? positions[toPosition].x - 20
    //                         : positions[toPosition].x + 20,
    //                     positionY: positions[toPosition].y,
    //                     rotation: isCard1 ? 360 - 10 : 360 + 10,
    //                     scale: 0.25,
    //                 },
    //                 delay,
    //                 duration: 1,
    //                 onComplete: () => {
    //                     // console.log(
    //                     //     `${
    //                     //         isCard1 ? "Card 1 " : "card 2 "
    //                     //     } initial animation done`
    //                     // );
    //                     onComplete({
    //                         pixiObject: pixiObject.current,
    //                         setCardFile,
    //                         faceValue,
    //                     });
    //                 },
    //             });
    //         }
    //     }
    // }, [pixiObject.current]);

    // const draw = useCallback((g) => {
    //     g.clear();

    //     g.beginFill(0xffffff, 1);
    //     g.drawRoundedRect(0, 0, 222, 323, 5);

    //     g.endFill();
    // }, []);

    // return (
    //     //222x323
    //     <Container
    //         ref={pixiObject}
    //         x={x}
    //         y={y}
    //         pivot={new PIXI.Point(width / 2, height / 2)}
    //         // width={width}
    //         // height={height}
    //         scale={0}
    //         skew={{ x: 0, y: 0 }}
    //     >
    //         <Graphics draw={draw} />
    //         <Sprite
    //             // filters={[new PIXI.filters.FXAAFilter()]}
    //             image={`/img/cards/${cardFile}.png`}
    //             anchor={0}
    //             x={5}
    //             y={5}
    //             width={width - 10}
    //             height={height - 10}
    //             // scale={1}
    //             // skew={0}
    //         />
    //     </Container>
    // );
}
