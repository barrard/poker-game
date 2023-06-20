module.exports = class GamesManager {
    constructor() {
        this.games = {};
    }

    addGame(game) {
        if (this.games[game.id]) {
            console.error(`Duplicate game made??  ${game.id}`);
        } else {
            this.games[game.id] = game;
        }
    }

    getGame(gameId) {
        return this.games[gameId];
    }

    getGamesState() {
        return Object.keys(this.games).reduce((acc, gameId) => {
            acc[gameId] = this.games[gameId].getState();

            return acc;
        }, {});
    }
};
