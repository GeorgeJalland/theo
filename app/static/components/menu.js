import { hideElement, unhideElement, selectElement, unselectElement } from "../helpers/utils.js"

export class Menu {
    static elements = {
        main: document.getElementById("menu"),
    }

    constructor(items) {
        this.items = items
        this.state.selectedItem = items[0]
        this.addListeners()
    }

    addListeners() {
        Menu.elements.main.addEventListener("click", async (event) => {
            if (event.target.classList.contains("menuItem")) {
                await this.handleClickMenuItem(event)
            }
        })
    }

    state = {
        selectedItem: null
    }

    async render(mode) {
        const menuItem = this.getMenuItemByMode(mode) || this.state.selectedItem
        this.state.selectedItem.undisplay()
        menuItem.display()
        this.state.selectedItem = menuItem
        await menuItem.render()
    }

    async renderWithState(mode, state) {
        const menuItem = this.getMenuItemByMode(mode)
        this.state.selectedItem.undisplay()
        menuItem.display()
        this.state.selectedItem = menuItem
        this.state.selectedItem.setState(state)
        await menuItem.render(false)
    }

    getMenuItemFromEvent(event) {
        return this.items.filter(item => item.button === event.target)[0];
    }

    getMenuItemByMode(mode) {
        return this.items.filter(item => item.component.mode === mode)[0];
    }

    async handleClickMenuItem(event) {
        const menuItem = this.getMenuItemFromEvent(event)
        this.state.selectedItem.undisplay()
        menuItem.display()
        this.state.selectedItem = menuItem
        await menuItem.render()
    }
}

export class MenuItem {
    constructor(component, button) {
        this.component = component;
        this.button = button;
    }

    display() {
        selectElement(this.button)
        unhideElement(this.component.elements.main)
    }

    undisplay() {
        unselectElement(this.button)
        hideElement(this.component.elements.main)
    }

    setState(state) {
        this.component.state = state
    }

    async render(pushHistory) {
        await this.component.render(pushHistory)
    }
}