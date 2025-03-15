import { QuoteBlock } from "./quoteBlock.js"

export class QOTD {
    constructor(searchParams, growAnimations) {
        this.growAnimations = growAnimations
        this.mode = "qotd"
        this.elements = {
            main: document.getElementById("qotd"),
        };
        this.quoteBlock = new QuoteBlock(this.elements.main, this.mode, this.growAnimations, parseInt(searchParams.get("quoteId")))
    }

    async render(pushHistory = true) {
        console.log("rendering qotd: ",pushHistory )
        await this.quoteBlock.render(pushHistory)
    }

    setState(state) {
        this.quoteBlock.setState(state)
    }
}