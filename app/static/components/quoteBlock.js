import { fetchQuote, fetchQuotesServedCount, likeQuote, shareQuote } from "../helpers/api.js"
import { updateTextWithAnimation, setLikeButtonColourInitial, setValueAnimationPlayAudio, setLikeProperties, makeOpaque, updateCanonicalLinkWithUrl } from "../helpers/utils.js"

export class QuoteBlock {
    constructor(container, parentMode, growAnimations, quoteId = null, getNextQuoteIdOverride = null, pushHistoryOveride = null, failedNextQuoteCallback = null) {
        this.growAnimations = growAnimations
        this.mode = parentMode
        this.root = container
        if (getNextQuoteIdOverride) {
            this.getNextQuoteId = getNextQuoteIdOverride
            this.nextQuoteIdMethodOverridden = true
        }
        this.pushHistory = pushHistoryOveride || this.pushHistory
        this.failedNextQuoteCallback = failedNextQuoteCallback
        this.elements = {
            quoteText: this.root.querySelector(".quoteText"),
            quoteLikes: this.root.querySelector(".quoteLikes"),
            quoteShares: this.root.querySelector(".quoteShares"),
            quotesServedCount: this.root.querySelector(".servedCount"),
            likeButton: this.root.querySelector(".likeButton"),
            theoPictureButton: this.root.querySelector(".theoPictureButton"),
            likeArrow: this.root.querySelector(".arrow2"),
            likeMe: this.root.querySelector(".likeMe"),
            theoArrow: this.root.querySelector(".arrow"),
            clickMe: this.root.querySelector(".clickMe"),
            innerQuoteContainer: this.root.querySelector(".innerQuoteContainer"),
            quoteReference: this.root.querySelector(".quoteReference"),
            shareButton: this.root.querySelector(".shareButton")
        };
        this.initalState = {
            quoteId: quoteId,
            quoteIsLiked: false,
            userHasClickedLike: false,
            userHasClickedTheo: false,
            quotesServed: 0
        }
        this.state = this.initalState
        this.addListeners()
    }

    static createClone(classToAdd) {
        let clone = document.getElementById("quoteBlock").cloneNode(true)
        clone.classList.add(classToAdd)
        return clone
    }

    getHistoryStatesToPush () {
        return [{"quoteId": this.state.quoteId}]
    }

    addListeners() {
        this.elements.likeButton.addEventListener("click", () => this.handleClickLike());
        this.elements.theoPictureButton.addEventListener("click", () => this.handleClickTheo());
        this.elements.shareButton.addEventListener("click", () => this.handleClickShare());        
    }

    async render(pushHistory = true) {
        await this.updateQuote(this.state.quoteId);
        await this.updateQuotesServedCount();
        if (pushHistory) {
            this.pushHistory()
        }
    }

    reset() {
        this.resetState()
        this.resetElements()
    }

    resetState() {
        this.state = this.initalState
    }

    resetElements() {
        this.elements.quoteText.textContent = ""
        this.elements.quoteLikes.textContent = ""
        this.elements.quoteShares.textContent = ""
        this.elements.quotesServedCount.textContent = ""
    }

    async handleClickShare() {
        const shareData = {
            title: 'Theo Von Quote',
            text: this.elements.quoteText.textContent,
            url: window.location.origin + window.location.pathname + `?mode=this&quoteId=${this.state.quoteId}`
        };
        try {
            console.log(await navigator.share(shareData));
            console.log("Quote successfully shared");
            shareQuote(this.state.quoteId)
            setValueAnimationPlayAudio(this.elements.quoteShares, parseInt(this.elements.quoteShares.textContent) + 1, this.growAnimations)
        } catch (error) {
            console.error("Error sharing quote: ", error);
        }
    }
    
    handleClickLike() {
        if (!this.state.userHasClickedLike) {
            makeOpaque(this.elements.likeArrow)
            makeOpaque(this.elements.likeMe)
            this.state.userHasClickedLike = true
        }
        setLikeProperties(this.elements.likeButton, this.elements.quoteLikes, this.growAnimations, this.state.quoteIsLiked)
        likeQuote(this.state.quoteId)
        this.state.quoteIsLiked = !this.state.quoteIsLiked
    }
    
    async handleClickTheo() {
        if (!this.state.userHasClickedTheo) {
            makeOpaque(this.elements.theoArrow)
            makeOpaque(this.elements.clickMe)
            this.state.userHasClickedTheo = true
        }
        this.state.quotesServed += 1;
        setValueAnimationPlayAudio(this.elements.quotesServedCount, this.state.quotesServed, this.growAnimations, true)
        await this.updateQuote(this.getNextQuoteId())
        this.pushHistory()
    }

    async updateQuote(quoteId) {
        const data = await fetchQuote(quoteId)
        this.setQuoteData(data)
    }

    getNextQuoteId() {
        return this.state.quoteId + 1
    }

    setState(state) {
        this.state = state
    }

    setQuoteData(data) {
        if (data) {
            updateTextWithAnimation(this.elements.innerQuoteContainer, this.elements.quoteText, '"' + data.text + '"', 'bounce', 500)
            this.elements.quoteLikes.textContent = data.likes;
            this.elements.quoteShares.textContent = data.shares;
            this.elements.quoteReference.href = data.reference;
            setLikeButtonColourInitial(this.state, this.elements.likeButton, data.has_user_liked_quote);
            this.state.quoteId = data.id;
        } else {
            if (this.failedNextQuoteCallback) {
                this.failedNextQuoteCallback()
            }
            this.elements.quoteText.textContent = "Error Loading Quote"
        }
    }

    async updateQuotesServedCount() {
        const data = await fetchQuotesServedCount()
        this.setQuotesServedCount(data)
    }

    setQuotesServedCount(data) {
        if (data) {
            this.state.quotesServed = data.quotes_served
            this.elements.quotesServedCount.textContent = data.quotes_served.toLocaleString();
        } else {
            this.elements.quoteText.textContent = "Error loading quote count.";
        }
    }

    pushHistory() {
        let additionalUrlStates = ""
        for (const state of this.getHistoryStatesToPush()) {
            const [key, value] = Object.entries(state)[0]
            additionalUrlStates += `&${key}=${value}`
        }
        history.pushState({ "mode": this.mode, "state": this.state }, "", `?mode=${this.mode}${additionalUrlStates}`)
        updateCanonicalLinkWithUrl()
    }
}