import { buildApiString } from "./utils.js"

export async function fetchQuote(localQuoteId) {
    const api_uri = localQuoteId ? "/quote" + "?" + "id=" + localQuoteId : "/quote"
    try {
        const response = await fetch(buildApiString(api_uri), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to fetch");

        return await response.json();
    } catch (error) {
        console.error("Error:", error);
    }
}

export async function fetchQuotes(orderBy, page, quoteLimit) {
    let endpoint_uri = "/quotes" + "?" + "order_by=" + orderBy + "&" + "page=" + page + "&" + "size=" + quoteLimit
    try {
        const response = await fetch(buildApiString(endpoint_uri), {
            method: "GET"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return await response.json();

    } catch (error) {
        console.error("Error:", error);
    }
}

export async function fetchQuotesServedCount() {
    try {
        const response = await fetch(buildApiString("/quotes-served"), {
            method: "GET"
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return await response.json();

    } catch (error) {
        console.error("Error:", error);
    }
}

export async function likeQuote(localQuoteId) {
    try {
        const response = await fetch(buildApiString("/like-quote" + "/" + localQuoteId), {
            method: "PUT",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to like quote");

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
        if (!response.ok) throw new Error("Failed to share quote");

    } catch (error) {
        console.error("Error:", error);
    }
}

export async function userLikedQuote(localQuoteId) {
    try {
        const response = await fetch(buildApiString("/user-liked-quote" + "/" + localQuoteId), {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) throw new Error("Failed to determine if quote is liked by user.");
        return response.json()
    } catch (error) {
        console.error("Error:", error);
    }
}