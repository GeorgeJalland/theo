console.log("This got imported!")

document.addEventListener("DOMContentLoaded", () => {
    const quoteText = document.getElementById("quoteText");
    const quoteLikes = document.getElementById("quoteLikes");
    const quotesServedCount = document.getElementById("servedCount")
    // const refreshButton = document.getElementById("refresh-quote");

    async function fetchQuote() {
        try {
            const response = await fetch("http://localhost:8000/quote", {
                method: "GET",
                credentials: "include"                
            });
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            quoteText.textContent = data.text;
            quoteLikes.textContent = data.likes;

            await fetchQuotesServedCount()
        } catch (error) {
            quoteText.textContent = "Error loading quote.";
            console.error("Error:", error);
        }
    }

    async function fetchQuotesServedCount() {
        try {
            const response = await fetch("http://localhost:8000/quotes-served", {
                method: "GET"
            });
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            quotesServedCount.textContent = data.quotes_served.toLocaleString();
        } catch (error) {
            quoteText.textContent = "Error loading quote.";
            console.error("Error:", error);
        }
    }

    async function likeQuote() {
        try {
            const response = await fetch(`http://localhost:8000/like-quote`, {
                method: "PUT",
                credentials: "include"
            });
    
            if (!response.ok) throw new Error("Failed to like quote");
    
            const data = await response.json();
            document.getElementById("quoteLikes").textContent = data.likes;
        } catch (error) {
            console.error("Error:", error);
        }
    }
    
    fetchQuote();

    document.getElementById("likeButton").addEventListener("click", () => likeQuote());
    document.getElementById("theoPictureButton").addEventListener("click", () => fetchQuote());
});