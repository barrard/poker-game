const Card = require("./Card");
module.exports = class Deck {
    constructor() {
        this.cards = [];

        // const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
        const suits = ["H", "D", "C", "S"];
        // const ranks = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
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

        // Create a deck of cards
        for (const suit of suits) {
            for (const rank of ranks) {
                const card = new Card(suit, rank);
                this.cards.push(card);
            }
        }
    }

    shuffle() {
        // Shuffle the deck using Fisher-Yates algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    drawCard() {
        // Remove and return the top card from the deck
        const c = this.cards.shift();

        return `${c.rank}${c.suit}`;
    }

    getNumberOfCards() {
        // Return the number of cards remaining in the deck
        return this.cards.length;
    }
};
