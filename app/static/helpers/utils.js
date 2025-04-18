const isLocal = window.location.hostname === "localhost"
const apiBase = window.location.protocol + '//' + window.location.hostname
const apiRoot = "/api"
const apiPort = isLocal ? ":7000" : ""

export function buildApiString(endpoint) {
    return apiBase + apiPort + apiRoot + endpoint
}

export function getAnimationTypeFromCount(count, options) {
    // This checks to see if count is multiple of powers of 10 and returns corresponding animation options
    for (let i = 0; i < options.length; i++) {
        if (count % 10 ** (i + 1) != 0) return options[i - 1];
    }
    return options[options.length - 1]
}

export function applyAnimation(element, animation, duration) {
    element.classList.add(animation);
    setTimeout(() => {
        element.classList.remove(animation);
    }, duration);
}

export function hideElement(element) {
    element.classList.add("hide")
}

export function unhideElement(element) {
    element.classList.remove("hide")
}

export function selectElement(element) {
    element.classList.add("selected")
}

export function unselectElement(element) {
    element.classList.remove("selected")
}

export function makeOpaque(element) {
    element.classList.add("makeOpaque")
}

export function updateCanonicalLinkWithUrl() {
    const url = window.location.href
    let canonicalLink = document.getElementById('canonicalLink');
    canonicalLink.setAttribute("href", url);
  }