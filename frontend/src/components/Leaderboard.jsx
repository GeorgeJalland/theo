"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import QuoteModal from "./QuoteModal"

const SORT_OPTIONS = [
  { label: "LIKES", value: "likes" },
  { label: "NEWEST", value: "id" },
  { label: "SHARES", value: "shares" },
]

export default function Leaderboard({
  initialData,
  initialOrderBy,
  initialPage,
}) {
  const router = useRouter()

  const [selectedQuote, setSelectedQuote] = useState(null)

  function changeSort(orderBy) {
    router.push(`/leaderboard/${orderBy}/1`)
  }

  function nextPage() {
    router.push(`/leaderboard/${initialOrderBy}/${initialPage + 1}`)
  }

  function prevPage() {
    router.push(`/leaderboard/${initialOrderBy}/${initialPage - 1}`)
  }

  return (
    <>
      <div id="leaderboardContainer">
        <div id="titleContainer">
          <div className="line" />
          <img
            id="rat"
            alt="pixelart rat with a crown"
            src="/images/pixel rat.png"
          />
          <div className="line" />
        </div>

        <div id="instructions" className="instructions">
            <span id="expandText">Click to Expand!</span>
            <img src="/images/arrow1.png" id="instructionsArrow"/>
        </div>

        <div id="sortOptionsContainer">
          {SORT_OPTIONS.map((option, i) => (
            <span key={option.value}>
              <button
                className={
                  option.value === initialOrderBy
                    ? "sortOption selected"
                    : "sortOption"
                }
                onClick={() => changeSort(option.value)}
              >
                [{option.label}]
              </button>

              {i < SORT_OPTIONS.length - 1 && " | "}
            </span>
          ))}
        </div>

        <table id="leaderboard">
          <tbody>
            {initialData.items.map((item) => (
              <tr key={item.id}>
                <td className="metricsCell">
                  {item[initialOrderBy]}
                </td>

                <td
                  className="quoteCell"
                  onClick={() => setSelectedQuote(item)}
                >
                  "{item.text}"
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tableMeta">
          <div id="quoteCountContainer">
            <span id="quoteCountText">[QUOTE COUNT]: </span>
            <span id="quoteCount">{initialData.total}</span>
          </div>

          <div id="leaderboardPageInfoContainer">
            {initialPage > 1 && (
              <img 
                id="leaderboardArrowLeft"
                className="leaderboardArrows"
                src="/images/next-arrow.png"
                alt="arrow pointing left"
                onClick={prevPage}
              />
            )}
            <div className="leaderboardPageInfo">
              [{initialPage}/{initialData.pages}]
            </div>

            {initialPage < initialData.pages && (
              <img 
                id="leaderboardArrowRight"
                className="leaderboardArrows"
                src="/images/next-arrow.png"
                alt="arrow pointing right"
                onClick={nextPage}
              />
            )}
          </div>
        </div>
      </div>

      {selectedQuote && (
        <QuoteModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
          leaderboardItems={initialData.items}
        />
      )}
    </>
  )
}