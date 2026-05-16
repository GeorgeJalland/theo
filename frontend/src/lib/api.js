function buildApiString(endpoint) {
    const baseUrl =
    typeof window === "undefined"
        ? process.env.API_URL
        : ""
    return `${baseUrl}/api${endpoint}`
}

async function tryGetError(response) {
    let errorMessage;
    try {
        const errorData = await response.json();

        errorMessage =
            errorData.detail ||
            errorData.message ||
            `Request failed with status ${response.status}`;
    } catch {
        errorMessage = `Request failed with status ${response.status}`;
    }

    return errorMessage
}

async function serversideGetRequest(
    endpointUri, 
    {
        cookie = null,
        revalidate = null,
    } = {}
) {
        try {
        const options = {
            method: "GET",
        };

        if (cookie) {
            options.headers = {
                cookie,
            };
        }
        else {
            options.credentials = "include";
        }

        if (revalidate !== null) {
            options.next = {
                revalidate: revalidate
            }
        }

        const response = await fetch(
            buildApiString(endpointUri),
            options
        );

        if (!response.ok) {
            throw new Error(await tryGetError(response));
        }

        return await response.json();

    } catch (error) {
        console.error("Error:", error);
    }
}

export async function fetchQuote(id, cookie=null) {
    const queryParams = new URLSearchParams({
        id: String(id),
    });

    const apiUri = `/quote?${queryParams.toString()}`;

    return await serversideGetRequest(apiUri, { cookie })
}

export async function fetchEpisode(id) {
    const queryParams = new URLSearchParams({
        id: String(id),
    });

    const apiUri = `/episode?${queryParams.toString()}`;

    return await serversideGetRequest(apiUri, { revalidate: 3600 })
}

export async function fetchQuotes(
    orderBy,
    sortOrder,
    page,
    quoteLimit,
    episodeId = null,
    cookie = null
) {
    const params = new URLSearchParams({
        order_by: orderBy,
        sort_order: sortOrder,
        page: String(page),
        size: String(quoteLimit),
    });

    if (episodeId) {
        params.append("episode_id", episodeId);
    }

    const endpointUri = `/quotes?${params.toString()}`;

    return await serversideGetRequest(endpointUri, { cookie })
}

export async function fetchEpisodes(
    orderBy,
    sortOrder,
    page,
    limit
) {
    const queryParams = new URLSearchParams({
        order_by: orderBy,
        sort_order: sortOrder,
        page: String(page),
        size: String(limit),
    });

    const endpointUri = `/episodes?${queryParams.toString()}`;

    return await serversideGetRequest(endpointUri, { revalidate: 3600 })
}

export async function searchQuotes(
    searchTerm,
    page,
    quoteLimit,
    cookie = null
) {
    const queryParams = new URLSearchParams({
        search_term: searchTerm,
        page: String(page),
        size: String(quoteLimit),
    });

    const endpointUri = `/search_quotes?${queryParams.toString()}`;

    return await serversideGetRequest(endpointUri, { cookie })
}

export async function fetchQuotesServedCount() {
    return await serversideGetRequest("/quotes-served", { revalidate: 0 })
}

export async function fetchQuoteCount() {
    return await serversideGetRequest("/quote-count", { revalidate: 0 })
}

export async function fetchEpisodeCount() {
    return await serversideGetRequest("/episode-count", { revalidate: 0 })
}

export async function fetchLikeCount() {
    return await serversideGetRequest("/like-count", { revalidate: 0 })
}

export async function likeQuote(localQuoteId) {
    try {
        const response = await fetch(buildApiString("/like-quote" + "/" + localQuoteId), {
            method: "PUT",
            credentials: "include"
        });
        if (!response.ok) throw new Error(await tryGetError(response));

    } catch (error) {
        console.error("Error:", error);
    }
}

export async function shareQuote(localQuoteId) {
    try {
        const response = await fetch(buildApiString("/share-quote" + "/" + localQuoteId), {
            method: "PUT",
            credentials: "include"
        });
        if (!response.ok) throw new Error(await tryGetError(response));

    } catch (error) {
        console.error("Error:", error);
    }
}

export async function fetchBootstrap() {
    const endpointUri = `/bootstrap`;

    return await serversideGetRequest(endpointUri)
}