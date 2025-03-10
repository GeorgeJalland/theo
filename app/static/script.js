console.log("script.js got imported!")
//elements
const qotdButton = document.getElementById("menu-qotd");
const leaderboardButton = document.getElementById("menu-leaderboard");
const mainContainer = document.getElementById("mainContainer");
const leaderboardContainer = document.getElementById("leaderboardContainer");

class MenuItem {
    constructor(mode, displayElement, state, button, loadFunction, historyStatesToPush=[]) {
        this.mode = mode;
        this.displayElement = displayElement;
        this.state = state;
        this.button = button;
        this.loadFunction = loadFunction;
        this.historyStatesToPush = historyStatesToPush
    }

    static getMenuItemFromEvent(event) {
        return menuItems.filter(item => item.button === event.target)[0];
    }

    static getMenuItemByMode(mode) {
        return menuItems.filter(item => item.mode === mode)[0];
    }

    setState(state) {
        for (const key in state) {
            this.state[key] = state[key]
        }
    }

    async render(menuState) {
        await this.load()
        this.display(menuState)
        this.pushHistory(menuState)
    }

    async load() {
        await this.loadFunction(this.state)
    }

    display(menuState) {
        unselectElement(menuState.selectedItem.button)
        selectElement(this.button)
        hideElement(menuState.selectedItem.displayElement)
        unhideElement(this.displayElement)
        menuState.selectedItem = this
    }

    pushHistory() {
        let additionalUrlStates = ""
        for (const state of this.historyStatesToPush){
            additionalUrlStates += `&${state}=${this.state[state]}`
        }
        history.pushState({"mode": this.mode, "state": this.state}, "", `?mode=${this.mode}${additionalUrlStates}`)
    }
}

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
const leaderboardBody = document.querySelector("#leaderboard tbody")
const menu = document.getElementById("menu")

const modal = document.getElementById("modal-layout");
const quoteTextModal = document.getElementById("quoteTextModal");
const quoteReferenceModal = document.getElementById("quoteReferenceModal");
const quoteLikesModal = document.getElementById("quoteLikesModal");
const quoteSharesModal = document.getElementById("quoteSharesModal");
const likeButtonModal = document.getElementById("likeButtonModal");
const shareButtonModal = document.getElementById("shareButtonModal");
const likeArrowModal = document.getElementById("arrow2Modal");
const likeMeModal = document.getElementById("likeMeModal");
const leaderboardMeta = document.getElementById("leaderboardMeta");
const leaderboardArrowLeft = document.getElementById("leaderboardArrowLeft");
const leaderboardArrowRight = document.getElementById("leaderboardArrowRight");
const sortOptionsContainer = document.getElementById("sortOptionsContainer");

const growAnimations = ['grow', 'grow2', 'grow3']

const isLocal = window.location.hostname === "localhost"
const apiBase = window.location.protocol + '//' + window.location.hostname
const apiRoot = "/api"
const apiPort = isLocal ? "7000" : ""

function buildApiString(endpoint) {
    return apiBase + ':' + apiPort + apiRoot + endpoint
}

const quote_limit = 10
const searchParams = new URLSearchParams(window.location.search)

// states, maybe qotd and modal can be instances of same class
let qotdState = {
    quoteId: parseInt(searchParams.get("quoteId")),
    quoteIsLiked: false,
    userHasClickedLike: false,
    userHasClickedTheo: false,
    quotesServed: 0
}

let leaderboardState = {
    page: 1,
    orderBy: "likes"
}

let modalState = {
    quoteId: 0,
    quoteIsLiked: false,
    userHasClickedLike: false,
    userHasClickedTheo: false,
}

const qotdLoadFunction = async (state) => {
    await fetchQuotesServedCount();
    await fetchQuote(state.quoteId);
}
const leaderboardLoadFunction = async (state) => {
    await fetchQuotes("likes", state.page, quote_limit);
}
const qotdMenuItem = new MenuItem(mode="qotd", displayElement=mainContainer, state=qotdState, button=qotdButton, loadFunction=qotdLoadFunction, historyStatesToPush=["quoteId"])
const leaderboardMenuItem = new MenuItem(mode="leaderboard", displayElement=leaderboardContainer, state=leaderboardState, button=leaderboardButton, loadFunction=leaderboardLoadFunction)
const menuItems = [qotdMenuItem, leaderboardMenuItem]

let menuState = {
    selectedItem: qotdMenuItem
}

async function mainLoad(searchParameters, menuState) {
    const menuItem = MenuItem.getMenuItemByMode(searchParameters.get("mode")) || qotdMenuItem
    await menuItem.render(menuState)
}

async function handleClickMenuItem(event, menuState) {
    const menuItem = MenuItem.getMenuItemFromEvent(event)
    await menuItem.render(menuState)
}

async function handleClickSortOption(event, state) {
    state.orderBy = event.target.dataset.sortby
    state.page = 1
    selectElement(event.target)
    let siblings = [...event.target.parentNode.children].filter(child => child !== event.target)
    siblings.forEach(element => unselectElement(element))
    await fetchQuotes(state.orderBy, state.page, quote_limit)
}

async function handleClickQuoteCell(event) {
    unhideElement(modal)
    const row = event.target.parentElement
    quoteTextModal.textContent = event.target.textContent
    quoteReferenceModal.href = row.dataset.ref
    quoteLikesModal.textContent = row.dataset.likes
    quoteSharesModal.textContent = row.dataset.shares
    modalState.quoteId = row.dataset.quoteId
    setLikeButtonColourInitial(modalState, likeButtonModal, await userLikedQuote(modalState.quoteId))
}

async function handleClickNextArrow(state) {
    state.page += 1
    await fetchQuotes(state.orderBy, state.page, quote_limit)
}

async function handleClickPrevArrow(state) {
    state.page -= 1
    await fetchQuotes(state.orderBy, state.page, quote_limit)
}

function handleClickLike(state, likeButtonElement, quoteLikesElement, likeArrowElement, likeMeElement) {
    if (!state.userHasClickedLike) {
        makeOpaque(likeArrowElement)
        makeOpaque(likeMeElement)
        state.userHasClickedLike = true
    }
    setLikeProperties(likeButtonElement, quoteLikesElement, growAnimations, state.quoteIsLiked)
    likeQuote(state.quoteId)
    state.quoteIsLiked = !state.quoteIsLiked
}

function handleClickLikeModal(state, likeButtonElement, quoteLikesElement, likeArrowElement, likeMeElement) {
    handleClickLike(state, likeButtonElement, quoteLikesElement, likeArrowElement, likeMeElement)
    const row = document.getElementById("quote_id_"+state.quoteId)
    row.dataset.likes = quoteLikesElement.textContent
    row.querySelector(".likesCell").textContent = quoteLikesElement.textContent
}

async function handleClickTheo(localQuoteId) {
    if (!qotdState.userHasClickedTheo) {
        makeOpaque(theoArrow)
        makeOpaque(clickMe)
        qotdState.userHasClickedTheo = true
    }
    await fetchQuote(localQuoteId)
    qotdMenuItem.pushHistory()
}

async function handleClickShare(localQuoteId) {
    const shareData = {
        title: 'Theo Von Quote',
        text: quoteText.textContent,
        url: window.location.origin + window.location.pathname + `?mode=qotd&quoteId=${localQuoteId}`
    };
    try {
        console.log(await navigator.share(shareData));
        console.log("Quote successfully shared");
        shareQuote(localQuoteId)
        setValueAndAnimation(quoteShares, parseInt(quoteShares.textContent) + 1, growAnimations)
    } catch (error) {
        console.error("Error sharing quote: ", error);
    }
}

async function fetchQuote(localQuoteId) {
    qotdState.quotesServed += 1;
    setValueAndAnimation(quotesServedCount, qotdState.quotesServed, growAnimations, setLocaleString = true)
    const api_uri = localQuoteId ? "/quote" + "?" + "id=" + localQuoteId : "/quote"
    try {
        const response = await fetch(buildApiString(api_uri), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        updateTextWithAnimation(innerQuoteContainer, quoteText, '"' + data.text + '"', 'bounce', 500)
        quoteLikes.textContent = data.likes;
        quoteShares.textContent = data.shares;
        quoteReference.href = data.reference;
        qotdState.quoteId = data.id;

        setLikeButtonColourInitial(qotdState, likeButton, data.has_user_liked_quote);
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
        qotdState.quotesServed = data.quotes_served
        quotesServedCount.textContent = data.quotes_served.toLocaleString();

    } catch (error) {
        quoteText.textContent = "Error loading quote count.";
        console.error("Error:", error);
    }
}

async function fetchQuotes(orderBy, page, limit) {
    endpoint_uri = "/quotes" + "?" + "order_by=" + orderBy + "&" + "page=" + page + "&" + "size=" + limit
    try {
        const response = await fetch(buildApiString(endpoint_uri), {
            method: "GET"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        leaderboardBody.innerHTML = "";
        // can some of this be abstracted into functions?
        data.items.forEach(function (item) {
            const tr = document.createElement('tr');
            const likesCell = document.createElement('td');
            const quoteCell = document.createElement('td');

            likesCell.textContent = item.likes
            likesCell.classList = "likesCell"
            quoteCell.textContent = '"' + item.text + '"'
            quoteCell.classList = "quoteCell"

            tr.dataset.quoteId = item.id
            tr.dataset.ref = item.reference
            tr.dataset.shares = item.shares
            tr.dataset.likes = item.likes
            tr.id = "quote_id_"+item.id

            tr.appendChild(likesCell);
            tr.appendChild(quoteCell);
            leaderboardBody.appendChild(tr);
        });
        leaderboardMeta.textContent = "[" + data.page + "/" + data.pages + "]"
        if (data.page == 1) {
            hideElement(leaderboardArrowLeft)
        } else {
            unhideElement(leaderboardArrowLeft)
        }
        if (data.page == data.pages) {
            hideElement(leaderboardArrowRight)
        } else {
            unhideElement(leaderboardArrowRight)
        }
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

async function userLikedQuote(localQuoteId) {
    try {
        const response = await fetch(buildApiString("/user-liked-quote" + "/" + localQuoteId), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to determine if quote is liked by user.");
        return response.json()

    } catch (error) {
        console.error("Error:", error);
    }
}

function setValueAndAnimation(element, value, animationOptions, setLocaleString = false) {
    animation = getAnimationTypeFromCount(value, animationOptions)
    if (setLocaleString) {
        value = value.toLocaleString()
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
        if (count % 10 ** (i + 1) != 0) return options[i - 1];
    }
    return options[options.length - 1]
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

function setLikeButtonColourInitial(state, likeButtonLocal, hasUserLikedQuote) {
    state.quoteIsLiked = hasUserLikedQuote
    if (hasUserLikedQuote) {
        likeButtonLocal.classList.add("quoteLiked");
    } else {
        likeButtonLocal.classList.remove("quoteLiked");
    }
}

function setLikeProperties(likeButtonElement, quoteLikesElement, animationOptions, quoteLiked) {
    // This function sets like count and button colour based on if like was previously selected, sets animation on positive increment
    if (quoteLiked) {
        quoteLikesElement.textContent = parseInt(quoteLikesElement.textContent) - 1
        likeButtonElement.classList.remove("quoteLiked");
    } else {
        setValueAndAnimation(quoteLikesElement, parseInt(quoteLikesElement.textContent) + 1, animationOptions)
        likeButtonElement.classList.add("quoteLiked");
    }
}

// Functions called on page load
mainLoad(searchParams, menuState)

// listeners
menu.addEventListener("click", async (event) => {
    if (event.target.classList.contains("menuItem")) {
        await handleClickMenuItem(event, menuState)
    }
})

likeButton.addEventListener("click", () => handleClickLike(qotdState, likeButton, quoteLikes, likeArrow, likeMe));
theoPictureButton.addEventListener("click", () => handleClickTheo(qotdState.quoteId + 1));
shareButton.addEventListener("click", () => handleClickShare(qotdState.quoteId));
leaderboard.addEventListener("click", event => {
    if (event.target.classList.contains("quoteCell")) {
        handleClickQuoteCell(event);
    }
})
sortOptionsContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("sortOption")) {
        handleClickSortOption(event, leaderboardState)
    }
})
leaderboardArrowRight.addEventListener("click", () => handleClickNextArrow(leaderboardState));
leaderboardArrowLeft.addEventListener("click", () => handleClickPrevArrow(leaderboardState));
likeButtonModal.addEventListener("click", () => handleClickLikeModal(modalState, likeButtonModal, quoteLikesModal, likeArrowModal, likeMeModal));
shareButtonModal.addEventListener("click", () => handleClickShare(modalState.quoteId));

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        hideElement(modal);
    }
});
window.addEventListener('popstate', (event) => {
    console.log("popping state: ", event.state)
    if (event.state && event.state.mode) {
        const menuItem = MenuItem.getMenuItemByMode(event.state.mode)
        menuItem.setState(event.state.state)
        menuItem.load()
        menuItem.display(menuState)
    }
});
