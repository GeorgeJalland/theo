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

export default function QuoteBlock({ id, text, likes: initialLikes, shares: initialShares, url, has_user_liked_quote, quotesServed }) {
  const router = useRouter()
  const audioRef = useRef(null)
  const likesRef = useRef(null)
  const sharesRef = useRef(null)
  const servedRef = useRef(null)
  const innerQuoteContainerRef = useRef(null)

  const [_quotesServed, setQuotesServed] = useState(quotesServed || 0)  // TODO: move quotesServed into context or something
  const [likes, setLikes] = useState(initialLikes || 0)
  const [shares, setShares] = useState(initialShares || 0)
  const [userHasLiked, setUserHasLiked] = useState(has_user_liked_quote || false)
  const [userHasClickedTheo, setUserHasClickedTheo] = useState(false) // TODO: lift state or persist this in local storage or something so it doesn't reset on every quote change
  const [userHasClickedLikeHint, setUserHasClickedLikeHint] = useState(false) // TODO: lift state or persist this in local storage or something so it doesn't reset on every quote change

  // -----------------------
  // INIT
  // -----------------------
  useEffect(() => {
    audioRef.current = new Audio("/audio/praise_god.mp3")
    applyAnimation(innerQuoteContainerRef.current, "bounce", 500)
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

    likeQuote(id)
    setUserHasLiked(!userHasLiked)

    console.log(userHasLiked)

    animate(likesRef, newLikes)
  }

  // -----------------------
  // SHARE
  // -----------------------
  async function handleShare() {
    if (!quote) return

    try {
      await navigator.share({
        title: "Theo Von Quote",
        text: text,
        url: window.location.origin + `/quote/${id}`,
      })

      shareQuote(id)

      const newShares = shares + 1
      setShares(newShares)

      animate(sharesRef, newShares)
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

    const nextId = id + 1

    const newCount = quotesServed + 1
    setQuotesServed(newCount)

    animate(servedRef, newCount)

    router.push(`/quote/${nextId}`)
  }

  // -----------------------
  // ANIMATION
  // -----------------------
  function animate(ref, value) {
    const animation = getAnimationTypeFromCount(value, growAnimations)

    if (animation && ref.current) {
        applyAnimation(ref.current, animation, 1000)
        audioRef.current?.play()
    }
  }


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
          <div data-anim="served" ref={servedRef}>
            {_quotesServed}
          </div>
        </div>
      </div>

      {/* QUOTE */}
      <div className="quoteContainer">
        <div className="innerQuoteContainer" ref={innerQuoteContainerRef}>
          <span className="quoteText">"{text}"</span>

          <a
            className="quoteReference"
            href={url}
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
          <div data-anim="likes" ref={likesRef}>
            {likes}
          </div>
        </div>

        {/* SHARES */}
        <div className="share">
          <img
            src="/images/share3.png"
            className="shareButton"
            onClick={handleShare}
          />
          <div data-anim="shares" ref={sharesRef}>
            {shares}
          </div>
        </div>

      </div>
    </div>
  )
}