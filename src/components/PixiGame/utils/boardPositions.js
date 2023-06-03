export default ({ width, height }) => {
    const shift = 0.02;
    const space = 0.065;
    const gap = 0.005;
    function getXLoc(i) {
        return width * (0.35 + i * space + shift);
    }
    const y = height * 0.55;
    return {
        0: {
            x: getXLoc(0),
            y,
            rotation: 0,
        },
        1: {
            x: getXLoc(1),
            y,
            rotation: 0,
        },
        2: {
            x: getXLoc(2),
            y,
            rotation: 0,
        },

        3: {
            x: getXLoc(3),
            y,
            rotation: 0,
        },

        4: {
            x: getXLoc(4),
            y,
            rotation: 0,
        },
    };
};
