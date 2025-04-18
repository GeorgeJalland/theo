import { Leaderboard } from "./components/leaderboard.js"
import { QOTD } from "./components/quoteOfTheDay.js"
import { Menu, MenuItem } from "./components/menu.js"
import { updateCanonicalLinkWithUrl } from "./helpers/utils.js"

const growAnimations = ['grow', 'grow2', 'grow3']
const pathVars = window.location.pathname.split("/")
const mode = pathVars[1]

let leaderboard = new Leaderboard(mode === "leaderboard" ? pathVars  : [], growAnimations)
let qotd = new QOTD(mode === "quote" ? pathVars : [], growAnimations)

const qotdButton = document.getElementById("menu-qotd")
const leaderboardButton = document.getElementById("menu-leaderboard")

const qotdMenuItem = new MenuItem(qotd, qotdButton)
const leaderboardMenuItem = new MenuItem(leaderboard, leaderboardButton)

let menu = new Menu([qotdMenuItem, leaderboardMenuItem])

menu.render(mode)

window.addEventListener('popstate', (event) => {
    console.log("popping state: ", event.state)
    if (event.state && event.state.mode) {
        updateCanonicalLinkWithUrl()
        menu.renderWithState(event.state.mode, event.state.state)
    }
});
