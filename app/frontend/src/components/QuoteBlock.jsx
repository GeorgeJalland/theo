"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  fetchQuote,
  fetchQuotesServedCount,
  likeQuote,
  shareQuote,
} from "@/lib/api"

import {
  applyAnimation,
  getAnimationTypeFromCount,
} from "@/lib/utils"

import { growAnimations } from "@/lib/constants"

export default function QuoteBlock({ quote, quotesServed }) {
  const router = useRouter()
  const audioRef = useRef(null)

  const [_quotesServed, setQuotesServed] = useState(quotesServed || 0)  // TODO: move quotesServed into context or something
  const [likes, setLikes] = useState(quote?.likes || 0)
  const [shares, setShares] = useState(quote?.shares || 0)
  const [userHasLiked, setUserHasLiked] = useState(quote.has_user_liked_quote || false)
  const [userHasClickedTheo, setUserHasClickedTheo] = useState(false) // TODO: lift state or persist this in local storage or something so it doesn't reset on every quote change
  const [userHasClickedLikeHint, setUserHasClickedLikeHint] = useState(false) // TODO: lift state or persist this in local storage or something so it doesn't reset on every quote change

  // -----------------------
  // INIT
  // -----------------------
  useEffect(() => {
    audioRef.current = new Audio("/audio/praise_god.mp3")
  }, [])

  // -----------------------
  // LIKE
  // -----------------------
  function handleLike() {
    if (!userHasClickedLikeHint) {
      setUserHasClickedLikeHint(true)
    }

    const newLikes = userHasLiked ? likes - 1 : likes + 1
    setLikes(newLikes)

    likeQuote(quote.id)
    setUserHasLiked(!userHasLiked)

    console.log(userHasLiked)

    animate("likes", newLikes)
  }

  // -----------------------
  // SHARE
  // -----------------------
  async function handleShare() {
    if (!quote) return

    try {
      await navigator.share({
        title: "Theo Von Quote",
        text: quote.text,
        url: window.location.origin + `/quote/${quote.id}`,
      })

      shareQuote(quote.id)

      const newShares = shares + 1
      setShares(newShares)

      animate("shares", newShares)
    } catch (err) {
      console.error("Share failed:", err)
    }
  }

  // -----------------------
  // NEXT QUOTE
  // -----------------------
  async function handleNextQuote() {
    if (!userHasClickedTheo) {
      setUserHasClickedTheo(true)
    }

    const nextId = quote.id + 1

    const newCount = quotesServed + 1
    setQuotesServed(newCount)

    animate("served", newCount)

    router.push(`/quote/${nextId}`)
  }

  // -----------------------
  // ANIMATION
  // -----------------------
  function animate(type, value) {
    const animation = getAnimationTypeFromCount(value, growAnimations)

    console.log("Animation for " + type + ": " + animation)

    if (animation) {
      const el = document.querySelector(`[data-anim="${type}"]`)
      if (el) {
        applyAnimation(el, animation, 1000)
        audioRef.current?.play()
      }
    }
  }

  // -----------------------
  // RENDER
  // -----------------------
  if (!quote) return <div>Loading...</div>

  return (
    <div className="quoteBlock">

      {/* TOP / THEO HEADER */}
      <div className="theoHeadContainer">
        <img
          src="/images/favicon.png"
          alt="Theo Von Cartoon Head"
          className="theoPictureButton"
          onClick={handleNextQuote}
        />

        <div
          className={`clickMe ${userHasClickedTheo ? "makeOpaque" : ""}`}
        >
          Click Me!
        </div>

        <img
          src="/images/arrow1.png"
          alt="arrow"
          className={`arrow ${userHasClickedTheo ? "makeOpaque" : ""}`}
        />

        <div className="quotesServed">
          <div>Served:</div>
          <div data-anim="served">{_quotesServed}</div>
        </div>
      </div>

      {/* QUOTE */}
      <div className="quoteContainer">
        <div className="innerQuoteContainer">
          <span className="quoteText">"{quote.text}"</span>

          <a
            className="quoteReference"
            href={quote.reference}
          >
            [ref]
          </a>
        </div>
      </div>

      {/* LIKE HINT AREA */}
      <div className="emptyPaddingDiv">
        <div className="emptyDiv" />

        <div
          className={`likeMe ${userHasClickedLikeHint ? "makeOpaque" : ""}`}
        >
          Like & Share!
        </div>

        <img
          src="/images/arrow1.png"
          className={`arrow2 ${userHasClickedLikeHint ? "makeOpaque" : ""}`}
          alt="arrow"
        />
      </div>

      {/* ACTIONS */}
      <div className="actionContainer">

        {/* LIKES */}
        <div className="likesOverlay">
          <img
            src="/images/like-button.png"
            className={`likeButton ${userHasLiked ? "quoteLiked" : ""}`}
            onClick={handleLike}
          />
          <div data-anim="likes">{likes}</div>
        </div>

        {/* SHARES */}
        <div className="share">
          <img
            src="/images/share3.png"
            className="shareButton"
            onClick={handleShare}
          />
          <div data-anim="shares">{shares}</div>
        </div>

      </div>
    </div>
  )
}