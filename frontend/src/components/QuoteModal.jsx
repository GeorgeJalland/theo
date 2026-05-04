"use client"

import QuoteBlock from "./QuoteBlock"

export default function QuoteModal({
  quote,
  onClose,
  leaderboardItems,
}) {
  function getNextQuote() {
    const index = leaderboardItems.findIndex(
      (item) => item.id === quote.id
    )

    if (index === -1 || index === leaderboardItems.length - 1) {
      onClose()
      return null
    }

    return leaderboardItems[index + 1]
  }

  return (
    <div
      className="modal-layout"
      onClick={(e) => {
        if (e.target.classList.contains("modal-layout")) {
          onClose()
        }
      }}
    >
      <QuoteBlock
        quote={quote}
        modalMode
        getNextQuoteOverride={getNextQuote}
      />
    </div>
  )
}