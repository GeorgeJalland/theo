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
let userHasClickedLike = false
let userHasClickedTheo = false

async function handleClickLike(quote_id) {
    if (!userHasClickedLike) {
        hideElement(likeArrow)
        hideElement(likeMe)
        userHasClickedLike = true
    }
    await likeQuote(quote_id)
}

async function handleClickTheo() {
    if (!userHasClickedTheo) {
        hideElement(theoArrow)
        hideElement(clickMe)
        userHasClickedTheo = true
    }
    await fetchQuote()
}

async function fetchQuote() {
    try {
        const response = await fetch(buildApiString("quote"), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        quoteText.textContent = data.text;
        quoteLikes.textContent = data.likes;
        quote_id = data.id

        setLikeButtonColourWhenQuoteIsLiked(likeButton, data.has_user_liked_quote);
        await fetchQuotesServedCount();

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
        quotesServedCount.textContent = data.quotes_served.toLocaleString();

    } catch (error) {
        quoteText.textContent = "Error loading quote.";
        console.error("Error:", error);
    }
}

async function likeQuote(quote_id) {
    setLikeButtonColourWhenGoingToLikeQuote(likeButton);
    try {
        const response = await fetch(buildApiString("like-quote" + "/" + quote_id), {
            method: "PUT",
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to like quote");

        const data = await response.json();
        quoteLikes.textContent = data.likes;

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

function setLikeButtonColourWhenQuoteIsLiked(element, hasUserLikedQuote) {
    if (hasUserLikedQuote) {
        element.classList.add("quoteLiked");
    } else {
        element.classList.remove("quoteLiked");
    }
}

function setLikeButtonColourWhenGoingToLikeQuote(element) {
    // If we are going to like quote, then quote won't be liked yet so we can pre-empt colour change
    // This means Page instantly renders colour change; don't have to wait for api response
    const is_quote_liked = element.classList.contains("quoteLiked")
    if (!is_quote_liked) {
        element.classList.add("quoteLiked");
    } else {
        element.classList.remove("quoteLiked");
    }
}

fetchQuote();

likeButton.addEventListener("click", () => handleClickLike(quote_id));
theoPictureButton.addEventListener("click", () => handleClickTheo());
