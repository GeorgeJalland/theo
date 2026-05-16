export function getAnimationTypeFromCount(count, options) {
    // This checks to see if count is multiple of powers of 10 and returns corresponding animation options
    for (let i = 0; i < options.length; i++) {
        if (count % 10 ** (i + 1) != 0) return options[i - 1];
    }
    return options[options.length - 1]
}

export function applyAnimation(ref, animation, duration) {
    ref.classList.add(animation);
    setTimeout(() => {
        ref.classList.remove(animation);
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

export function timeAgo(dateString) {
    if (dateString == null) {
        return "?d"
    }

    const now = new Date();
    const date = new Date(dateString);

    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "0d";

    return `${diffDays}d`;
}

export function isLessThanXWeeksOld(date, weeks) {
    const X_WEEKS = 7 * 24 * 60 * 60 * 1000 * weeks;

    const now = Date.now();
    const inputTime = new Date(date).getTime();

    return now - inputTime < X_WEEKS;
};

export function buildPageMeta({ title, description, path }) {
    const url = `https://theo-von.com${path}`;

    return {
        title,
        description,

        alternates: {
            canonical: url,
        },

        openGraph: {
            title: `${title} | Theo Von Quotes`,
            description,
            url,
            type: "website",
        },

        twitter: {
            card: "summary",
            title: `${title} | Theo Von Quotes`,
            description,
        },
    };
};