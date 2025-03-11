import { Leaderboard } from "./components/leaderboard.js";
import { Modal } from "./components/modal.js";
import { QOTD } from "./components/quoteOfTheDay.js"
import { Menu, MenuItem } from "./components/menu.js"

const growAnimations = ['grow', 'grow2', 'grow3']
const searchParams = new URLSearchParams(window.location.search)
const mode = searchParams.get("mode")

let leaderboard = new Leaderboard(searchParams, growAnimations)
let qotd = new QOTD(searchParams, growAnimations)


const qotdButton = document.getElementById("menu-qotd")
const leaderboardButton = document.getElementById("menu-leaderboard")
const qotdMenuItem = new MenuItem(qotd, qotdButton)
const leaderboardMenuItem = new MenuItem(leaderboard, leaderboardButton)
let menu = new Menu([qotdMenuItem, leaderboardMenuItem])

menu.render(mode)

window.addEventListener('popstate', (event) => {
    console.log("popping state: ", event.state)
    if (event.state && event.state.mode) {
        menu.renderWithState(event.state.mode, event.state.state)
    }
});
