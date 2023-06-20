const Deck = require("./Deck");
const PokerHand = require("poker-hand-evaluator");
module.exports = class PokerGame {
    constructor({ players }) {
        this.players = players; //Positions.reduce((acc, player, i) => {
        // acc[player] = { position: player, hand: [], chips: player.chips };
        // return acc;
        // }, {});
        this.winner = { score: Infinity };
        this.deck = new Deck();
        this.deck.shuffle();
        this.deck.shuffle();
        this.deck.shuffle();
        this.deck.shuffle();

        this.board = [];
        this.winner = { score: Infinity, sameScore: [] };
    }

    dealFlop() {
        this.flop = [];
        const burn = this.deck.drawCard();
        this.flop.push(this.deck.drawCard());
        this.flop.push(this.deck.drawCard());
        this.flop.push(this.deck.drawCard());
    }

    dealRiver() {
        const burn = this.deck.drawCard();
        this.river = this.deck.drawCard();
    }

    dealTurn() {
        const burn = this.deck.drawCard();
        this.turn = this.deck.drawCard();
    }

    dealBoard(position) {
        const card = this.deck.drawCard();
        this.board[position] = card;
        return card;
    }

    dealPlayer(player) {
        const card = this.deck.drawCard();
        player.hand.push(card);
        return card;
    }

    determineWinner() {
        const { board } = this;

        Object.keys(this.players).forEach((position) => {
            const player = this.players[position];
            const { hand } = player;
            player.bestHand = this.getBestHand([...board, ...hand]);

            if (player.bestHand.score < this.winner.score) {
                this.winner = {
                    ...player,
                    score: player.bestHand.score,
                    position,
                };
                this.winner.sameScore = [];
            } else if (player.bestHand.score == this.winner.score) {
                this.winner.sameScore.push({
                    ...player,
                    score: player.bestHand.score,
                });
            }
        });
        return this.winner;
    }

    getBestHand(cards) {
        const hands = [];
        let bestHand = { score: Infinity };

        const combinations = this.generateCombinations(cards);
        combinations.forEach((c) => {
            c = c.reduce((acc, c) => {
                acc += `${c} `;
                return acc;
            }, "");
            const hand = new PokerHand(c);

            hands.push(hand);
            if (hand.score < bestHand.score) {
                bestHand = hand;
            }
        });

        return bestHand;
    }

    generateCombinations(values) {
        const combinations = [];

        function generateCombinationHelper(currentCombination, startIdx) {
            if (currentCombination.length === 5) {
                combinations.push(currentCombination.slice());
                return;
            }

            for (let i = startIdx; i < values.length; i++) {
                currentCombination.push(values[i]);
                generateCombinationHelper(currentCombination, i + 1);
                currentCombination.pop();
            }
        }

        generateCombinationHelper([], 0);
        return combinations;
    }
};
