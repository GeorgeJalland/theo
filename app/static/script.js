console.log("script.js got imported!")

const quoteText = document.getElementById("quoteText");
const quoteLikes = document.getElementById("quoteLikes");
const quotesServedCount = document.getElementById("servedCount");
const likeButton = document.getElementById("likeButton");
const apiBase = window.location.protocol + '//' + window.location.hostname
const apiPort = "8000"

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

async function likeQuote() {
    setLikeButtonColourWhenGoingToLikeQuote(likeButton);
    try {
        const response = await fetch(buildApiString("like-quote"), {
            method: "PUT",
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to like quote");

        const data = await response.json();
        document.getElementById("quoteLikes").textContent = data.likes;

    } catch (error) {
        console.error("Error:", error);
    }
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

document.getElementById("likeButton").addEventListener("click", () => likeQuote());
document.getElementById("theoPictureButton").addEventListener("click", () => {
    fetchQuote();
});