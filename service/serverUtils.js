module.exports = {
    async waitFor(time) {
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                return resolve();
            }, time);
        });
    },
};
