import { fetchQuotes } from "../helpers/api.js"
import { hideElement, unhideElement, selectElement, unselectElement } from "../helpers/utils.js"
import { QuoteModal } from "./quoteModal.js"

export class Leaderboard {
    constructor(searchParams, growAnimations) {
        this.growAnimations = growAnimations
        this.state.page = parseInt(searchParams.get("page")) || 1
        this.state.orderBy = searchParams.get("orderBy") || "likes"
        this.mode = "leaderboard"
        this.elements = {
            main: document.getElementById("leaderboardContainer"),
            body: document.querySelector("#leaderboard tbody"),
            quoteCount: document.getElementById("quoteCount"),
            pageInfo: document.getElementById("leaderboardPageInfo"),
            arrowLeft: document.getElementById("leaderboardArrowLeft"),
            arrowRight: document.getElementById("leaderboardArrowRight"),
            sortOptionsContainer: document.getElementById("sortOptionsContainer"),
            metricHeader: document.getElementById("leaderboardMetric"),
        }
        this.modal = new QuoteModal(this.elements.main, this.growAnimations, this.mode, () => this.pushHistory(), () => this.getNextQuoteId())
        this.addListeners()
        this.selectSortOption(this.getSortElement())
    }

    state = {
        page: 1,
        orderBy: "likes",
        selectedQuoteRowId: null
    }

    QUOTE_LIMIT = 10

    getHistoryStatesToPush () {
        return [{"page": this.state.page}, {"orderBy": this.state.orderBy}]
    }

    addListeners() {
        this.elements.main.addEventListener("click", event => {
            if (event.target.classList.contains("quoteCell")) {
                const row = event.target.parentElement
                this.state.selectedQuoteRowId = row.dataset.quoteId
                this.modal.handleClickQuoteCell(this.state.selectedQuoteRowId);
            }
        })
        this.elements.sortOptionsContainer.addEventListener("click", (event) => {
            if (event.target.classList.contains("sortOption")) {
                this.handleClickSortOption(event)
            }
        })
        this.elements.arrowRight.addEventListener("click", () => this.handleClickNextArrow());
        this.elements.arrowLeft.addEventListener("click", () => this.handleClickPrevArrow());
    }

    async render(pushHistory = true) {
        await this.updateQuotes();
        this.selectSortOption(this.getSortElement());
        if (pushHistory) {
            this.pushHistory();
        }
    }

    async updateQuotes() {
        const data = await fetchQuotes(this.state.orderBy, this.state.page, this.QUOTE_LIMIT)
        this.populateLeaderboard(data)
    }

    populateLeaderboard(data) {
        this.elements.body.innerHTML = "";
        data.items.forEach(item => {
            const tr = document.createElement('tr');
            const metricsCell = document.createElement('td');
            const quoteCell = document.createElement('td');

            metricsCell.textContent = item[this.state.orderBy]
            metricsCell.classList = "likesCell"
            quoteCell.textContent = '"' + item.text + '"'
            quoteCell.classList = "quoteCell"

            tr.dataset.quoteId = item.id
            tr.id = "quote_id_"+item.id

            tr.appendChild(metricsCell);
            tr.appendChild(quoteCell);
            this.elements.body.appendChild(tr);
        });
        this.elements.pageInfo.textContent = "[" + data.page + "/" + data.pages + "]"
        this.elements.quoteCount.textContent = data.total
        if (data.page == 1) {
            hideElement(this.elements.arrowLeft)
        } else {
            unhideElement(this.elements.arrowLeft)
        }
        if (data.page == data.pages) {
            hideElement(this.elements.arrowRight)
        } else {
            unhideElement(this.elements.arrowRight)
        }
    }

    async handleClickSortOption(event) {
        this.state.page = 1
        this.state.orderBy = event.target.dataset.sortby
        this.selectSortOption(event.target)
        await this.render()
    }

    setState(state) {
        this.state = state
    }

    selectSortOption(element) {
        const selectedElement = [...this.elements.sortOptionsContainer.children].filter(child => child.classList.contains("selected"))[0]
        unselectElement(selectedElement)
        selectElement(element)
    }

    getSortElement() {
        const selectedElement = [...this.elements.sortOptionsContainer.children].filter(child => child.dataset.sortby === this.state.orderBy)[0]
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

    getNextQuoteId() {
        if (!this.state.selectedQuoteRowId) {
            return null
        }
        const selectedRow = [...this.elements.body.children].filter(child => child.dataset.quoteId === this.state.selectedQuoteRowId)[0]
        const nextRow = selectedRow.nextElementSibling;
        if (!nextRow) {
            return 0
        }
        const nextQuoteId = nextRow.dataset.quoteId
        this.state.selectedQuoteRowId = nextQuoteId
        return nextQuoteId;
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
