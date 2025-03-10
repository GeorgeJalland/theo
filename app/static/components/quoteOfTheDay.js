import { fetchQuote, fetchQuotesServedCount, likeQuote, shareQuote } from "../helpers/api.js"
import { updateTextWithAnimation, setLikeButtonColourInitial, setValueAndAnimation, setLikeProperties, makeOpaque } from "../helpers/utils.js"

export class QOTD {
    constructor(searchParams, growAnimations) {
        this.state.quoteId = parseInt(searchParams.get("quoteId"))
        this.growAnimations = growAnimations
        this.addListeners()
    }

    elements = {
        main: document.getElementById("mainContainer"),
        quoteText: document.getElementById("quoteText"),
        quoteLikes: document.getElementById("quoteLikes"),
        quoteShares: document.getElementById("quoteShares"),
        quotesServedCount: document.getElementById("servedCount"),
        likeButton: document.getElementById("likeButton"),
        theoPictureButton: document.getElementById("theoPictureButton"),
        likeArrow: document.getElementById("arrow2"),
        likeMe: document.getElementById("likeMe"),
        theoArrow: document.getElementById("arrow"),
        clickMe: document.getElementById("clickMe"),
        innerQuoteContainer: document.getElementById("innerQuoteContainer"),
        quoteReference: document.getElementById("quoteReference"),
        shareButton: document.getElementById("shareButton")
    };

    state = {
        quoteId: null,
        quoteIsLiked: false,
        userHasClickedLike: false,
        userHasClickedTheo: false,
        quotesServed: 0
    }

    mode = "qotd"

    getHistoryStatesToPush () {
        return [{"quoteId": this.state.quoteId}]
    }

    addListeners() {
        this.elements.likeButton.addEventListener("click", () => this.handleClickLike());
        this.elements.theoPictureButton.addEventListener("click", () => this.handleClickTheo());
        this.elements.shareButton.addEventListener("click", () => this.handleClickShare());        
    }

    async render() {
        await this.updateQuotesServedCount();
        await this.updateQuote(this.state.quoteId);
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
            setValueAndAnimation(this.elements.quoteShares, parseInt(this.elements.quoteShares.textContent) + 1, this.growAnimations)
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
        setValueAndAnimation(this.elements.quotesServedCount, this.state.quotesServed, this.growAnimations, true)
        await this.updateQuote(this.state.quoteId + 1)
        this.pushHistory()
    }

    async updateQuote(quoteId) {
        const data = await fetchQuote(quoteId)
        this.setQuoteData(data)
        this.state.quoteId = data.id;
    }

    setQuoteData(data) {
        if (data) {
            updateTextWithAnimation(this.elements.innerQuoteContainer, this.elements.quoteText, '"' + data.text + '"', 'bounce', 500)
            this.elements.quoteLikes.textContent = data.likes;
            this.elements.quoteShares.textContent = data.shares;
            this.elements.quoteReference.href = data.reference;
            setLikeButtonColourInitial(this.state, this.elements.likeButton, data.has_user_liked_quote);
        } else {
            this.elements.quoteText = "Error Loading Quote"
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
    }
}