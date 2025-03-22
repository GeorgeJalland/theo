const isLocal = window.location.hostname === "localhost"
const apiBase = window.location.protocol + '//' + window.location.hostname
const apiRoot = "/api"
const apiPort = isLocal ? "7000" : ""

export function buildApiString(endpoint) {
    return apiBase + ':' + apiPort + apiRoot + endpoint
}

export function setValueAnimationPlayAudio(element, value, animationOptions, setLocaleString = false) {
    const animation = getAnimationTypeFromCount(value, animationOptions)
    if (setLocaleString) {
        value = value.toLocaleString()
    }
    if (!animation) {
        element.textContent = value
        return
    }
    playAudio("audio/praise_god.mp3")
    updateTextWithAnimation(element, element, value, animation, 1000)
};

export function playAudio(source) {
    const audio = new Audio(source)
    audio.play()
}

export function getAnimationTypeFromCount(count, options) {
    // This checks to see if count is multiple of powers of 10 and returns corresponding animation options
    for (let i = 0; i < options.length; i++) {
        if (count % 10 ** (i + 1) != 0) return options[i - 1];
    }
    return options[options.length - 1]
}

export function updateTextWithAnimation(containerElement, element, newText, animation, duration) {
    element.textContent = newText;
    containerElement.classList.add(animation);
    setTimeout(() => {
        containerElement.classList.remove(animation);
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

export function setLikeButtonColourInitial(state, likeButtonLocal, hasUserLikedQuote) {
    state.quoteIsLiked = hasUserLikedQuote
    if (hasUserLikedQuote) {
        likeButtonLocal.classList.add("quoteLiked");
    } else {
        likeButtonLocal.classList.remove("quoteLiked");
    }
}

export function setLikeProperties(likeButtonElement, quoteLikesElement, animationOptions, quoteLiked) {
    // This function sets like count and button colour based on if like was previously selected, sets animation on positive increment
    if (quoteLiked) {
        quoteLikesElement.textContent = parseInt(quoteLikesElement.textContent) - 1
        likeButtonElement.classList.remove("quoteLiked");
    } else {
        setValueAnimationPlayAudio(quoteLikesElement, parseInt(quoteLikesElement.textContent) + 1, animationOptions)
        likeButtonElement.classList.add("quoteLiked");
    }
}

export function updateCanonicalLinkWithUrl() {
    const url = window.location.href
    let canonicalLink = document.getElementById('canonicalLink');
    canonicalLink.setAttribute("href", url);
  }