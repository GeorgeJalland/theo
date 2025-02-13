console.log("script.js got imported!")

const quoteText = document.getElementById("quoteText");
const quoteLikes = document.getElementById("quoteLikes");
const quotesServedCount = document.getElementById("servedCount");
const likeButton = document.getElementById("likeButton");
const theoPictureButton = document.getElementById("theoPictureButton");
const likeArrow = document.getElementById("arrow2");
const likeMe = document.getElementById("likeMe");
const theoArrow = document.getElementById("arrow");
const clickMe = document.getElementById("clickMe");

const apiBase = window.location.protocol + '//' + window.location.hostname
const apiPort = "8000"

let quote_id = 0
let quoteIsLiked = false
let userHasClickedLike = false
let userHasClickedTheo = false
let quotesServed = 0

function handleClickLike(quote_id) {
    if (!userHasClickedLike) {
        hideElement(likeArrow)
        hideElement(likeMe)
        userHasClickedLike = true
    }
    setLikeButtonColourAndValue(likeButton, quoteLikes)
    likeQuote(quote_id)
}

async function handleClickTheo() {
    if (!userHasClickedTheo) {
        hideElement(theoArrow)
        hideElement(clickMe)
        userHasClickedTheo = true
    }
    fetchQuote()
}

async function fetchQuote() {
    quotesServed += 1;
    quotesServedCount.textContent = quotesServed.toLocaleString();
    try {
        const response = await fetch(buildApiString("quote"), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        quoteText.textContent = data.text;
        quoteLikes.textContent = data.likes;

        quote_id = data.id;
        setLikeButtonColourInitial(likeButton, data.has_user_liked_quote);

    } catch (error) {
        quoteText.textContent = "Error loading quote.";
        console.error("Error:", error);
    }
}

async function fetchQuotesServedCount() {
    try {
        const response = await fetch(buildApiString("quotes-served"), {
            method: "GET"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        quotesServed = data.quotes_served
        quotesServedCount.textContent = data.quotes_served.toLocaleString();

    } catch (error) {
        quoteText.textContent = "Error loading quote.";
        console.error("Error:", error);
    }
}

async function likeQuote(quote_id) {
    try {
        const response = await fetch(buildApiString("like-quote" + "/" + quote_id), {
            method: "PUT",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to like quote");

    } catch (error) {
        console.error("Error:", error);
    }
}

function hideElement(element) {
    element.classList.add("hide")
}

function buildApiString(endpoint){
    return apiBase + ':' + apiPort + '/' + endpoint
}

function setLikeButtonColourInitial(likeButtonLocal, hasUserLikedQuote) {
    quoteIsLiked = hasUserLikedQuote
    if (hasUserLikedQuote) {
        likeButtonLocal.classList.add("quoteLiked");
    } else {
        likeButtonLocal.classList.remove("quoteLiked");
    }
}

function setLikeButtonColourAndValue(likeButtonLocal, quoteLikesLocal) {
    if (quoteIsLiked) {
        quoteLikesLocal.textContent = parseInt(quoteLikesLocal.textContent) - 1
        likeButtonLocal.classList.remove("quoteLiked");
    } else {
        quoteLikesLocal.textContent = parseInt(quoteLikesLocal.textContent) + 1
        likeButtonLocal.classList.add("quoteLiked");
    }
    quoteIsLiked = !quoteIsLiked
}

fetchQuotesServedCount();
fetchQuote();

likeButton.addEventListener("click", () => handleClickLike(quote_id));
theoPictureButton.addEventListener("click", () => handleClickTheo());
