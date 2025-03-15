import { hideElement, unhideElement } from "../helpers/utils.js"
import { QuoteBlock } from "./quoteBlock.js"

export class QuoteModal {
    constructor(container, growAnimations, mode, onCloseCallback, getNextQuoteIdOverride) {
        this.growAnimations = growAnimations
        this.root = container
        this.elements = {
            main: this.root.querySelector(".modal-layout"),
            instructions: this.root.querySelector(".instructions")
        }
        this.elements.main.appendChild(QuoteBlock.createClone("modal"))
        this.quoteBlock = new QuoteBlock(this.elements.main, mode, this.growAnimations, null, getNextQuoteIdOverride, () => {}, () => this.close())
        this.onCloseCallback = onCloseCallback
        this.addListeners()
    }

    state = {
        hasUserClickedQuote: false,
    }

    addListeners() {
        this.elements.main.addEventListener("click", (event) => {
            if (event.target === this.elements.main) {
                this.close()
            }
        });
    }

    close() {
        hideElement(this.elements.main);
        this.onCloseCallback()
    }

    setQuoteBlockQuoteIdState (quoteId) {
        this.quoteBlock.state.quoteId = quoteId
    }

    async handleClickQuoteCell(quoteId) {
        if (!this.state.hasUserClickedQuote) {
            hideElement(instructions)
            this.state.hasUserClickedQuote = true
        }
        unhideElement(this.elements.main)
        this.setQuoteBlockQuoteIdState(quoteId)
        this.quoteBlock.render()
    }
}