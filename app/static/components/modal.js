import { hideElement, unhideElement, setLikeButtonColourInitial, setLikeProperties, makeOpaque, setValueAndAnimation } from "../helpers/utils.js"
import { likeQuote, userLikedQuote, shareQuote } from "../helpers/api.js";

export class Modal {
    constructor(growAnimations) {
        this.growAnimations = growAnimations
        this.addListeners()
    }

    elements = {
        layout: document.getElementById("modal-layout"),
        quoteText: document.getElementById("quoteTextModal"),
        quoteReference: document.getElementById("quoteReferenceModal"),
        quoteLikes: document.getElementById("quoteLikesModal"),
        quoteShares: document.getElementById("quoteSharesModal"),
        likeButton: document.getElementById("likeButtonModal"),
        shareButton: document.getElementById("shareButtonModal"),
        likeArrow: document.getElementById("arrow2Modal"),
        likeMe: document.getElementById("likeMeModal"),
        instructions: document.getElementById("instructions")
    }

    state = {
        quoteId: 0,
        quoteIsLiked: false,
        userHasClickedLike: false,
        hasUserClickedQuote: false,
    }

    addListeners() {
        this.elements.likeButton.addEventListener("click", () => this.handleClickLike());
        this.elements.shareButton.addEventListener("click", () => this.handleClickShare());
        this.elements.layout.addEventListener("click", (event) => {
            if (event.target === this.elements.layout) {
                hideElement(this.elements.layout);
            }
        });
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

        const row = document.getElementById("quote_id_" + this.state.quoteId)
        row.dataset.likes = this.elements.quoteLikes.textContent
        row.querySelector(".likesCell").textContent = this.elements.quoteLikes.textContent
    }

    async handleClickShare() {
        const shareData = {
            title: 'Theo Von Quote',
            text: this.elements.quoteText.textContent,
            url: window.location.origin + window.location.pathname + `?mode=qotd&quoteId=${this.state.quoteId}`
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

    async handleClickQuoteCell(event) {
        if (!this.state.hasUserClickedQuote) {
            hideElement(instructions)
            this.state.hasUserClickedQuote = true
        }
        unhideElement(this.elements.layout)
        const row = event.target.parentElement
        this.elements.quoteText.textContent = event.target.textContent
        this.elements.quoteReference.href = row.dataset.ref
        this.elements.quoteLikes.textContent = row.dataset.likes
        this.elements.quoteShares.textContent = row.dataset.shares
        this.state.quoteId = row.dataset.quoteId
        setLikeButtonColourInitial(this.state, this.elements.likeButton, await userLikedQuote(this.state.quoteId))
    }
}