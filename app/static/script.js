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
const quoteReference = document.getElementById("quoteReference")
const shareButton = document.getElementById("shareButton")

const isLocal = window.location.hostname === "localhost"
const apiBase = window.location.protocol + '//' + window.location.hostname
const apiRoot = "/api"
const apiPort =  isLocal ? "7000" : ""

function buildApiString(endpoint){
    return apiBase + ':' + apiPort + apiRoot + endpoint
}

const searchParams = new URLSearchParams(window.location.search)
let quoteId = parseInt(searchParams.get("quoteId"));
let quoteIsLiked = false
let userHasClickedLike = false
let userHasClickedTheo = false
let quotesServed = 0

function handleClickLike(localQuoteId) {
    if (!userHasClickedLike) {
        hideElement(likeArrow)
        hideElement(likeMe)
        userHasClickedLike = true
    }
    setLikeProperties(likeButton, quoteLikes, ['grow', 'grow2', 'grow3'])
    likeQuote(localQuoteId)
    quoteIsLiked = !quoteIsLiked
}

async function handleClickTheo(localQuoteId) {
    if (!userHasClickedTheo) {
        hideElement(theoArrow)
        hideElement(clickMe)
        userHasClickedTheo = true
    }
    await fetchQuote(localQuoteId)
    history.pushState({quoteId}, "", `?quoteId=${quoteId}`)
}

async function handleClickShare(localQuoteId) {
    const shareData = {
        title: 'Theo Von Quote',
        text: '"'+quoteText.textContent+'"',
        url: window.location.href
    };
    try {
        console.log(await navigator.share(shareData));
        console.log("Quote successfully shared");
        shareQuote(localQuoteId)
    } catch (error) {
        console.error("Error sharing quote: ", error);
    }
}

async function fetchQuote(localQuoteId) {
    quotesServed += 1;
    setValueAndAnimation(quotesServedCount, quotesServed, ['grow', 'grow2', 'grow3'], setLocaleString=true)
    const api_uri = localQuoteId ? "/quote" + "?" + "id=" + localQuoteId : "/quote"
    try {
        const response = await fetch(buildApiString(api_uri), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        updateTextWithAnimation(innerQuoteContainer, quoteText, data.text, 'bounce', 500)
        quoteLikes.textContent = data.likes;
        quoteReference.href = data.reference;
        quoteId = data.id;

        setLikeButtonColourInitial(likeButton, data.has_user_liked_quote);
    } catch (error) {
        quoteText.textContent = "Error loading quote.";
        console.error("Error:", error);
    }
}

async function fetchQuotesServedCount() {
    try {
        const response = await fetch(buildApiString("/quotes-served"), {
            method: "GET"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        quotesServed = data.quotes_served
        quotesServedCount.textContent = data.quotes_served.toLocaleString();

    } catch (error) {
        quoteText.textContent = "Error loading quote count.";
        console.error("Error:", error);
    }
}

async function likeQuote(localQuoteId) {
    try {
        const response = await fetch(buildApiString("/like-quote" + "/" + localQuoteId), {
            method: "PUT",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to like quote");

    } catch (error) {
        console.error("Error:", error);
    }
}

async function shareQuote(localQuoteId) {
    try {
        const response = await fetch(buildApiString("/share-quote" + "/" + localQuoteId), {
            method: "PUT",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to share quote");

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
fetchQuote(quoteId).then(() => {
    history.pushState({quoteId}, "", `?quoteId=${quoteId}`)
});

likeButton.addEventListener("click", () => handleClickLike(quoteId));
theoPictureButton.addEventListener("click", () => handleClickTheo(quoteId+1));
shareButton.addEventListener("click", () => handleClickShare(quoteId));
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.quoteId) {
        fetchQuote(event.state.quoteId)
    }
  });
