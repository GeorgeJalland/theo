import { fetchQuotes } from "../helpers/api.js"
import { hideElement, unhideElement, selectElement, unselectElement } from "../helpers/utils.js"

export class Leaderboard {
    constructor(searchParams) {
        this.searchParams = searchParams
        this.addListeners()
    }

    elements = {
        main: document.getElementById("leaderboardContainer"),
        leaderboardBody: document.querySelector("#leaderboard tbody"),
        leaderboardMeta: document.getElementById("leaderboardMeta"),
        leaderboardArrowLeft: document.getElementById("leaderboardArrowLeft"),
        leaderboardArrowRight: document.getElementById("leaderboardArrowRight"),
        sortOptionsContainer: document.getElementById("sortOptionsContainer"),
    }

    state = {
        page: 1,
        orderBy: "likes"
    }

    mode = "leaderboard"
    QUOTE_LIMIT = 10

    getHistoryStatesToPush () {
        return []
    }

    addListeners() {
        this.elements.sortOptionsContainer.addEventListener("click", (event) => {
            if (event.target.classList.contains("sortOption")) {
                this.handleClickSortOption(event)
            }
        })
        this.elements.leaderboardArrowRight.addEventListener("click", () => this.handleClickNextArrow());
        this.elements.leaderboardArrowLeft.addEventListener("click", () => this.handleClickPrevArrow());
    }

    async render() {
        await this.updateQuotes();
    }

    async updateQuotes() {
        const data = await fetchQuotes(this.state.orderBy, this.state.page, this.QUOTE_LIMIT)
        this.populateLeaderboard(data)
    }

    populateLeaderboard(data) {
        this.elements.leaderboardBody.innerHTML = "";
        data.items.forEach(item => {
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
            this.elements.leaderboardBody.appendChild(tr);
        });
        this.elements.leaderboardMeta.textContent = "[" + data.page + "/" + data.pages + "]"
        if (data.page == 1) {
            hideElement(this.elements.leaderboardArrowLeft)
        } else {
            unhideElement(this.elements.leaderboardArrowLeft)
        }
        if (data.page == data.pages) {
            hideElement(this.elements.leaderboardArrowRight)
        } else {
            unhideElement(this.elements.leaderboardArrowRight)
        }
    }

    async handleClickSortOption(event) {
        this.state.orderBy = event.target.dataset.sortby
        this.state.page = 1
        selectElement(event.target)
        let siblings = [...event.target.parentNode.children].filter(child => child !== event.target)
        siblings.forEach(element => unselectElement(element))
        await this.updateQuotes()
    }

    async handleClickNextArrow() {
        this.state.page += 1
        await this.updateQuotes()
    }
    
    async handleClickPrevArrow() {
        this.state.page -= 1
        await updateQuotes()
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