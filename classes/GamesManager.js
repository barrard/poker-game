module.exports = class GamesManager {
  constructor() {
    this.games = {};
  }

  addGame(game) {
    this.games[game.id] = game;
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
