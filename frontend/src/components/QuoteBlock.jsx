"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import MetaContainer from "./MetaContainer"
import { timeAgo, isLessThanXWeeksOld } from "../lib/utils"

import {
  fetchQuote,
  likeQuote,
  shareQuote,
} from "@/lib/api"

import {
  applyAnimation,
  getAnimationTypeFromCount,
} from "@/lib/utils"

import { growAnimations } from "@/lib/constants"

export default function QuoteBlock({ quote, loading, index }) {
  const router = useRouter()
  const quoteTextRef = useRef(null)

  const [userHasLiked, setUserHasLiked] = useState(quote.has_user_liked_quote || false)

  function handleLike() {
    likeQuote(quote.id)
  }

  async function handleShare() {
    try {
      await navigator.share({
        title: "Theo Von Quote",
        text: quote.text,
        url: window.location.origin + `/quote/${quote.id}`,
      })

      shareQuote(quote.id)
    } catch (err) {
      console.error("Share failed:", err)
    }
  }

  function animate(ref, value) {
      const animation = getAnimationTypeFromCount(value, growAnimations)

      if (animation && ref.current) {
          applyAnimation(ref.current, animation, 1000)
      }
  }

  const quoteDate = timeAgo(quote.episode_publish_date)
  const new_ = isLessThanXWeeksOld(quote.episode_publish_date, 2)

  return (
      <div className="quoteBlock">
        <div className="quoteContainer">
          <div className="w-full flex justify-between gap-4 pt-1">
            <span className="quoteText" ref={quoteTextRef}>"{quote.text}"</span>
            <div className="flex flex justify-end text-3xl">
              {index && <Link href={`/quote/${quote.id}`}>#{index}</Link>}
            </div>
          </div>
          <div className="flex w-full gap-2 justify-end text-3xl">
            <div className="flex items-center gap-2">
              {new_ && (
                <span className="text-yellow-500">
                  New
                </span>
              )}
              <time
                className="text-gray-700 whitespace-nowrap"
                dateTime={quote.episode_publish_date}
                title={`Quote published on ${quote.episode_publish_date?.split("T")[0] || "Unknown Date"}`}
              >
                {quoteDate}
              </time>
            </div>

          </div>
          <MetaContainer
            quote={quote}
            index={index}
            handleLike={handleLike}
            userHasLiked={userHasLiked}
            handleShare={handleShare}
            animate={animate}
          />
        </div>
      </div>
    )
}