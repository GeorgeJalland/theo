import { fetchQuote, fetchQuotesServedCount, likeQuote, shareQuote } from "../helpers/api.js"
import { applyAnimation, makeOpaque, updateCanonicalLinkWithUrl, getAnimationTypeFromCount } from "../helpers/utils.js"

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
            quotesServed: 0,
            likes: 0,
            shares: 0
        }
        this.state = this.initalState
        this.audio = new Audio("audio/praise_god.mp3")
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
            this.state.shares += 1
            this.elements.quoteShares.textContent = this.state.shares.toLocaleString()
            const animationApplied = this.animateElement(this.elements.quoteShares, this.state.shares)
            if (animationApplied) {
                this.audio.play()
            }
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
        if (this.state.quoteIsLiked) {
            this.state.likes -= 1
            this.elements.likeButton.classList.remove("quoteLiked");
        } else {
            this.state.likes += 1
            const animationApplied = this.animateElement(this.elements.quoteLikes, this.state.likes)
            if (animationApplied) {
                this.audio.play()
            }
            this.elements.likeButton.classList.add("quoteLiked");
        }
        this.elements.quoteLikes.textContent = this.state.likes
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
        this.elements.quotesServedCount.textContent = this.state.quotesServed.toLocaleString()
        const animationApplied = this.animateElement(this.elements.quotesServedCount, this.state.quotesServed)
        if (animationApplied) {
            this.audio.play()
        }
        await this.updateQuote(this.getNextQuoteId())
        this.pushHistory()
    }

    async updateQuote(quoteId) {
        const data = await fetchQuote(quoteId)
        this.setQuoteData(data)
    }

    animateElement(element, value) {
        const animation = getAnimationTypeFromCount(value, this.growAnimations)
        if (animation) {
            applyAnimation(element, animation, 1000)
            return true
        }
        return false
    }

    getNextQuoteId() {
        return this.state.quoteId + 1
    }

    setState(state) {
        this.state = state
    }

    setQuoteData(data) {
        if (data) {
            this.elements.quoteText.textContent = '"' + data.text + '"'
            applyAnimation(this.elements.innerQuoteContainer, 'bounce', 500)
            this.state.likes = data.likes
            this.elements.quoteLikes.textContent = this.state.likes;
            this.state.shares = data.shares;
            this.elements.quoteShares.textContent = this.state.shares;
            this.elements.quoteReference.href = data.reference;
            this.state.quoteIsLiked = data.has_user_liked_quote;
            this.state.quoteId = data.id;
            this.setLikeButtonColourInitial()
        } else {
            if (this.failedNextQuoteCallback) {
                this.failedNextQuoteCallback()
            }
            this.elements.quoteText.textContent = "Error Loading Quote"
        }
    }

    setLikeButtonColourInitial() {
        if (this.state.quoteIsLiked) {
            this.elements.likeButton.classList.add("quoteLiked");
        } else {
            this.elements.likeButton.classList.remove("quoteLiked");
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