console.log("script.js got imported!")

const quoteText = document.getElementById("quoteText");
const quoteLikes = document.getElementById("quoteLikes");
const quotesServedCount = document.getElementById("servedCount");

async function fetchQuote() {
    try {
        const response = await fetch("http://localhost:8000/quote", {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        quoteText.textContent = data.text;
        quoteLikes.textContent = data.likes;

        setLikeButtonColourWhenQuoteIsLiked(data.id);

    } catch (error) {
        quoteText.textContent = "Error loading quote.";
        console.error("Error:", error);
    }
}

async function fetchQuotesServedCount() {
    try {
        const response = await fetch("http://localhost:8000/quotes-served", {
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
    const quoteId = getCookie("quote_id");
    try {
        const response = await fetch(`http://localhost:8000/like-quote/` + quoteId, {
            method: "PUT",
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to like quote");

        const data = await response.json();
        document.getElementById("quoteLikes").textContent = data.likes;

        setLikeButtonColourWhenQuoteIsLiked(quoteId);

    } catch (error) {
        console.error("Error:", error);
    }
}

function setLikeButtonColourWhenQuoteIsLiked(quoteId) {
    const likeButton = document.getElementById("likeButton")
    if (isQuoteLiked(quoteId)) {
        likeButton.classList.add("quoteLiked");
    } else {
        likeButton.classList.remove("quoteLiked");
    }
}

function isQuoteLiked (quoteId) {
    return getCookie("liked_quotes").includes(quoteId)
}

// Function to get the value of a specific cookie by name
function getCookie(name) {
    const cookieArr = document.cookie.split('; ');
    for (let i = 0; i < cookieArr.length; i++) {
        const [key, value] = cookieArr[i].split('=');
        if (key === name) {
            return decodeAndParseCookie(value);
        }
    }
    return null; // If cookie is not found
}

function decodeAndParseCookie(cookie) {
    const decodedCookie = decodeURIComponent(cookie)
    return JSON.parse(decodedCookie)
}

fetchQuotesServedCount();
fetchQuote();

document.getElementById("likeButton").addEventListener("click", () => likeQuote());
document.getElementById("theoPictureButton").addEventListener("click", () => {
    fetchQuotesServedCount();
    fetchQuote();
});