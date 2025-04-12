import { QuoteBlock } from "./quoteBlock.js"

export class QOTD {
    constructor(pathVars, growAnimations) {
        this.growAnimations = growAnimations
        this.mode = "quote"
        this.elements = {
            main: document.getElementById("qotd"),
        };
        this.quoteBlock = new QuoteBlock(this.elements.main, this.mode, this.growAnimations, pathVars[2])
    }

    async render(pushHistory = true) {
        await this.quoteBlock.render(pushHistory)
    }

    setState(state) {
        this.quoteBlock.setState(state)
    }
}