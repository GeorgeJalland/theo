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
const innerQuoteContainer = document.getElementById("innerQuoteContainer")

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
    setLikeProperties(likeButton, quoteLikes, ['grow', 'grow2', 'grow3'])
    likeQuote(quote_id)
    quoteIsLiked = !quoteIsLiked
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
    setValueAndAnimation(quotesServedCount, quotesServed, ['grow', 'grow2', 'grow3'], setLocaleString=true)
    try {
        const response = await fetch(buildApiString("quote"), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        updateTextWithAnimation(innerQuoteContainer, quoteText, data.text, 'bounce', 500)
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

function setValueAndAnimation(element, value, animationOptions, setLocaleString = false) {
    animation = getAnimationTypeFromCount(value, animationOptions)
    if (setLocaleString) {
        value =  value.toLocaleString()
    }
    if (!animation) {
        element.textContent = value
        return
    }
    updateTextWithAnimation(element, element, value, animation, 1000)
};

function getAnimationTypeFromCount(count, options) {
    // This checks to see if count is multiple of powers of 10 and returns corresponding animation options
    for (let i = 0; i < options.length; i++) {
        if (count % 10**(i+1) != 0) return options[i-1];
    }
    return options[options.length-1]
}

function updateTextWithAnimation(containerElement, element, newText, animation, duration) {
    element.textContent = newText;
    containerElement.classList.add(animation);
    setTimeout(() => {
        containerElement.classList.remove(animation);
    }, duration);
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

function setLikeProperties(likeButtonElement, quoteLikesElement, animationOptions) {
    // This function sets like count and button colour based on if like was previously selected, sets animation on positive increment
    if (quoteIsLiked) {
        quoteLikesElement.textContent = parseInt(quoteLikesElement.textContent) - 1
        likeButtonElement.classList.remove("quoteLiked");
    } else {
        setValueAndAnimation(quoteLikesElement, parseInt(quoteLikesElement.textContent) + 1, animationOptions)
        likeButtonElement.classList.add("quoteLiked");
    }
}

fetchQuotesServedCount();
fetchQuote();

likeButton.addEventListener("click", () => handleClickLike(quote_id));
theoPictureButton.addEventListener("click", () => handleClickTheo());
