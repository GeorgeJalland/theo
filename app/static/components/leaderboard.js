import { fetchQuotes } from "../helpers/api.js"
import { hideElement, unhideElement, selectElement, unselectElement } from "../helpers/utils.js"

export class Leaderboard {
    constructor(searchParams) {
        this.state.page = parseInt(searchParams.get("page")) || 1
        this.state.orderBy = searchParams.get("orderBy") || "likes"
        this.addListeners()
        this.selectSortOption(this.getSortElement())
    }

    elements = {
        main: document.getElementById("leaderboardContainer"),
        leaderboardBody: document.querySelector("#leaderboard tbody"),
        leaderboardMeta: document.getElementById("leaderboardMeta"),
        leaderboardArrowLeft: document.getElementById("leaderboardArrowLeft"),
        leaderboardArrowRight: document.getElementById("leaderboardArrowRight"),
        sortOptionsContainer: document.getElementById("sortOptionsContainer"),
        metricHeader: document.getElementById("leaderboardMetric"),
    }

    state = {
        page: 1,
        orderBy: "likes",
    }

    mode = "leaderboard"
    QUOTE_LIMIT = 10

    getHistoryStatesToPush () {
        return [{"page": this.state.page}, {"orderBy": this.state.orderBy}]
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

    async render(pushHistory = true) {
        await this.updateQuotes();
        if (pushHistory) {
            this.pushHistory();
        }
    }

    async updateQuotes() {
        const data = await fetchQuotes(this.state.orderBy, this.state.page, this.QUOTE_LIMIT)
        this.populateLeaderboard(data)
    }

    populateLeaderboard(data) {
        this.elements.leaderboardBody.innerHTML = "";
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            const metricsCell = document.createElement('td');
            const quoteCell = document.createElement('td');

            metricsCell.textContent = item[this.state.orderBy]
            metricsCell.classList = "likesCell"
            quoteCell.textContent = '"' + item.text + '"'
            quoteCell.classList = "quoteCell"

            tr.dataset.quoteId = item.id
            tr.dataset.ref = item.reference
            tr.dataset.shares = item.shares
            tr.dataset.likes = item.likes
            tr.id = "quote_id_"+item.id

            tr.appendChild(metricsCell);
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
        this.selectSortOption(event.target)
        this.state.page = 1
        this.state.orderBy = event.target.dataset.sortby
        await this.render()
    }

    selectSortOption(element) {
        const selectedElement = [...sortOptionsContainer.children].filter(child => child.classList.contains("selected"))[0]
        unselectElement(selectedElement)
        selectElement(element)
    }

    getSortElement() {
        const selectedElement = [...sortOptionsContainer.children].filter(child => child.dataset.sortby === this.state.orderBy)[0]
        return selectedElement
    }

    async handleClickNextArrow() {
        this.state.page += 1
        await this.render()
    }
    
    async handleClickPrevArrow() {
        this.state.page -= 1
        await this.render()
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
