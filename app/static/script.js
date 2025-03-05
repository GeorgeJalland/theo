console.log("script.js got imported!")
//elements
const qotdButton = document.getElementById("menu-qotd");
const leaderboardButton = document.getElementById("menu-leaderboard");
const mainContainer = document.getElementById("mainContainer");
const leaderboardContainer = document.getElementById("leaderboardContainer");
const menuItems = [{"element": mainContainer, "button": qotdButton}, {"element": leaderboardContainer, "button": leaderboardButton}];

const quoteText = document.getElementById("quoteText");
const quoteLikes = document.getElementById("quoteLikes");
const quoteShares = document.getElementById("quoteShares");
const quotesServedCount = document.getElementById("servedCount");
const likeButton = document.getElementById("likeButton");
const theoPictureButton = document.getElementById("theoPictureButton");
const likeArrow = document.getElementById("arrow2");
const likeMe = document.getElementById("likeMe");
const theoArrow = document.getElementById("arrow");
const clickMe = document.getElementById("clickMe");
const innerQuoteContainer = document.getElementById("innerQuoteContainer");
const quoteReference = document.getElementById("quoteReference");
const shareButton = document.getElementById("shareButton");
const leaderboard = document.getElementById("leaderboard");
const menu = document.getElementById("menu")

const modal = document.getElementById("modal-layout");
const quoteTextModal = document.getElementById("quoteTextModal");
const quoteReferenceModal = document.getElementById("quoteReferenceModal");
const quoteLikesModal = document.getElementById("quoteLikesModal");
const quoteSharesModal = document.getElementById("quoteSharesModal");

const growAnimations = ['grow', 'grow2', 'grow3']

const isLocal = window.location.hostname === "localhost"
const apiBase = window.location.protocol + '//' + window.location.hostname
const apiRoot = "/api"
const apiPort =  isLocal ? "7000" : ""

function buildApiString(endpoint){
    return apiBase + ':' + apiPort + apiRoot + endpoint
}

const quote_limit = 10
const searchParams = new URLSearchParams(window.location.search)
// states
let quoteId = parseInt(searchParams.get("quoteId"));
let quoteIsLiked = false
let userHasClickedLike = false
let userHasClickedTheo = false
let quotesServed = 0
let top_quotes_page = 1
let selectedMenuItem = {"element": mainContainer, "button": qotdButton}

function displayMenuItem(element, menuButton) {
    unselectElement(selectedMenuItem.button)
    selectElement(menuButton)
    hideElement(selectedMenuItem.element)
    unhideElement(element)
    selectedMenuItem.element = element
    selectedMenuItem.button = menuButton
}

function handleClickLike(localQuoteId) {
    if (!userHasClickedLike) {
        makeOpaque(likeArrow)
        makeOpaque(likeMe)
        userHasClickedLike = true
    }
    setLikeProperties(likeButton, quoteLikes, growAnimations)
    likeQuote(localQuoteId)
    quoteIsLiked = !quoteIsLiked
}

async function handleClickTheo(localQuoteId) {
    if (!userHasClickedTheo) {
        makeOpaque(theoArrow)
        makeOpaque(clickMe)
        userHasClickedTheo = true
    }
    await fetchQuote(localQuoteId)
    history.pushState({quoteId}, "", `?quoteId=${quoteId}`)
}

async function handleClickShare(localQuoteId) {
    const shareData = {
        title: 'Theo Von Quote',
        text: quoteText.textContent,
        url: window.location.href
    };
    try {
        console.log(await navigator.share(shareData));
        console.log("Quote successfully shared");
        shareQuote(localQuoteId)
        setValueAndAnimation(quoteShares, parseInt(quoteShares.textContent)+1, growAnimations)
    } catch (error) {
        console.error("Error sharing quote: ", error);
    }
}

async function fetchQuote(localQuoteId) {
    quotesServed += 1;
    setValueAndAnimation(quotesServedCount, quotesServed, growAnimations, setLocaleString=true)
    const api_uri = localQuoteId ? "/quote" + "?" + "id=" + localQuoteId : "/quote"
    try {
        const response = await fetch(buildApiString(api_uri), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        updateTextWithAnimation(innerQuoteContainer, quoteText, '"'+data.text+'"', 'bounce', 500)
        quoteLikes.textContent = data.likes;
        quoteShares.textContent = data.shares;
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

async function fetchTopQuotes(orderBy, page, limit) {
    endpoint_uri = "/quotes"+"?"+"order_by="+orderBy+"&"+"page="+page+"&"+"size="+limit
    try {
        const response = await fetch(buildApiString(endpoint_uri), {
            method: "GET"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        data.items.forEach(function(item) {
            const tr = document.createElement('tr');
            const likesCell = document.createElement('td');
            const quoteCell = document.createElement('td');

            likesCell.textContent = item.likes
            quoteCell.textContent = '"' + item.text + '"'
            quoteCell.dataset.quoteId = item.id
            quoteCell.dataset.ref = item.reference
            quoteCell.dataset.shares = item.shares
            quoteCell.dataset.likes = item.likes
            quoteCell.classList = "quoteCell"

            tr.appendChild(likesCell);
            tr.appendChild(quoteCell);
            leaderboard.appendChild(tr);
          });
        // populate some state with top quotes???
        // display in tables

    } catch (error) {
        quoteText.textContent = "Error loading quotes.";
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

function unhideElement(element) {
    element.classList.remove("hide")
}

function selectElement(element) {
    element.classList.add("selected")
}

function unselectElement(element) {
    element.classList.remove("selected")
}

function makeOpaque(element) {
    element.classList.add("makeOpaque")
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
fetchTopQuotes("likes", top_quotes_page, quote_limit);

// listeners
likeButton.addEventListener("click", () => handleClickLike(quoteId));
theoPictureButton.addEventListener("click", () => handleClickTheo(quoteId+1));
shareButton.addEventListener("click", () => handleClickShare(quoteId));
menu.addEventListener("click", event => {
    if (event.target.classList.contains("menuItem")) {
        let menuItem = menuItems.filter(item => item.button === event.target)[0]
        displayMenuItem(menuItem.element, menuItem.button)
    }
})
leaderboard.addEventListener("click", event => {
    if (event.target.classList.contains("quoteCell")) {
        unhideElement(modal)
        quoteTextModal.textContent = event.target.textContent
        quoteReferenceModal.href = event.target.dataset.ref
        quoteLikesModal.textContent = event.target.dataset.likes
        quoteSharesModal.textContent = event.target.dataset.shares
    }
});
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        hideElement(modal);
    }
});
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.quoteId) {
        fetchQuote(event.state.quoteId)
    }
  });
