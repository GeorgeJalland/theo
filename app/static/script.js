console.log("This got imported!")

document.addEventListener("DOMContentLoaded", () => {
    const quoteText = document.getElementById("quote-text");
    const quoteLikes = document.getElementById("quote-likes");
    // const refreshButton = document.getElementById("refresh-quote");

    async function fetchQuote() {
        try {
            const response = await fetch("http://localhost:8000/quote", {
                method: "GET",
                credentials: "include"                
            });
            if (!response.ok) throw new Error("Failed to fetch");

            const data = await response.json();
            console.log("data: ", data)
            quoteText.textContent = '"' + data.text + '"';
            quoteLikes.textContent = data.likes;
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
            document.getElementById("quote-likes").textContent = data.likes;
        } catch (error) {
            console.error("Error:", error);
        }
    }
    
    // Fetch quote on page load
    fetchQuote();

    // Attach to the "Like" button click event
    document.getElementById("like-button").addEventListener("click", () => likeQuote());
    document.getElementById("next-quote-button").addEventListener("click", () => fetchQuote());
});