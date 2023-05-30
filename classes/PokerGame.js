const Deck = require("./Deck");
const PokerHand = require("poker-hand-evaluator");
module.exports = class PokerGame {
    constructor({ playerPositions }) {
        this.players = playerPositions.reduce((acc, player, i) => {
            acc[player] = { hand: [], chips: player.chips };
            return acc;
        }, {});
        this.winner = { score: Infinity };
        this.deck = new Deck();
        this.deck.shuffle();
        this.deck.shuffle();
        this.deck.shuffle();
        this.deck.shuffle();

        // this.dealPlayers();

        // this.dealFlop();
        // this.dealRiver();
        // this.dealTurn();
        // this.determineBestHand();
    }

    determineBestHand() {
        Object.keys(this.players).forEach((player) => {
            const playerHand = [
                ...this.players[player].hand,
                ...this.flop,
                this.turn,
                this.river,
            ];

            //   console.log(`${player} - hand`);
            //   console.log(playerHand);
            this.players[player].bestHand = this.getBestHand(playerHand);
            if (this.players[player].bestHand.rank === "ROYAL_FLUSH") {
                console.log("GOT PNE");
            }
            //   console.log(`${player} - hand`);
            //   console.log(this.players[player].bestHand);
            //   console.log(this.players[player].bestHand.score);
            if (this.players[player].bestHand.score < this.winner.score) {
                this.winner = {
                    player,
                    ...this.players[player],
                    score: this.players[player].bestHand.score,
                };
            }
        });
        // console.log("This Winner is");
        // console.log(this.winner);
        const card1 = this.scoreCard(this.winner.hand[0]);
        const card2 = this.scoreCard(this.winner.hand[1]);
        let cardKey = "";
        if (card1.score > card2.score) {
            cardKey = `${card1.card},${card2.card}`;
        } else {
            cardKey = `${card2.card},${card1.card}`;
        }
        if (!this.winningHands[cardKey]) {
            this.winningHands[cardKey] = 0;
        }
        this.winningHands[cardKey]++;
    }
    scoreCard(card) {
        const [type, suit] = card.split("");
        const suits = ["H", "D", "C", "S"];

        const ranks = [
            "A",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "T",
            "J",
            "Q",
            "K",
        ];
        const suitIndex = suits.indexOf(suit) + 1;
        const rankIndex = ranks.indexOf(type) + 1;
        // console.log({ suitIndex, rankIndex });
        const score = rankIndex * (suitIndex * ranks.length);
        return { suitIndex, rankIndex, score, card };
    }

    dealFlop() {
        this.flop = [];
        this.flop.push(this.deck.drawCard());
        this.flop.push(this.deck.drawCard());
        this.flop.push(this.deck.drawCard());
        // console.log("this.flop");
        // console.log(this.flop);
    }

    dealRiver() {
        this.river = this.deck.drawCard();

        // console.log("this.river");
        // console.log(this.river);
    }

    dealTurn() {
        this.turn = this.deck.drawCard();

        // console.log("this.turn");
        // console.log(this.turn);
    }

    dealPlayer(player) {
        const card = this.deck.drawCard();
        this.players[player].hand.push(card);
        return card;
    }

    // dealPlayers() {
    //     Object.keys(this.players).forEach((player) => {
    //         this.players[player].hand.push(this.deck.drawCard());
    //     });
    //     Object.keys(this.players).forEach((player) => {
    //         this.players[player].hand.push(this.deck.drawCard());
    //     });
    // }

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
            //   console.log(hand);
            //   console.log(hand.describe());
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

    //   generateCombinations(cards, size) {
    //     const combinations = [];
    //     const indices = Array.from(Array(size).keys());

    //     this.generateCombinationHelper(cards, combinations, indices, 0, size - 1, 0);
    //     return combinations;
    //   }

    //   generateCombinationHelper(cards, combinations, indices, start, end, index) {
    //     if (index === indices.length) {
    //       const combination = indices.map((i) => cards[i]);
    //       combinations.push(combination);
    //       return;
    //     }

    //     for (let i = start; i <= end && end - i + 1 >= indices.length - index; i++) {
    //       indices[index] = i;
    //       this.generateCombinationHelper(cards, combinations, indices, i + 1, end, index + 1);
    //     }
    //   }

    //   evaluateHand(hand) {
    //     // Implement your hand evaluation logic here
    //     // This should return an object representing the evaluated hand
    //     // The object should contain properties like 'rank', 'name', and any additional details

    //     // Placeholder implementation that returns a random rank
    //     const ranks = ["High Card", "Pair", "Two Pair", "Three of a Kind", "Straight", "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"];
    //     const randomRankIndex = Math.floor(Math.random() * ranks.length);
    //     const randomRank = ranks[randomRankIndex];

    //     return {
    //       rank: randomRankIndex,
    //       name: randomRank,
    //     };
    //   }
};
