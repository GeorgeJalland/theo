"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function LikeButton({ handleLike, userHasLikedInitial, initialLikes, animate, initialDailyLikes }) {
    const likesRef = useRef(null)

    const [likes, setLikes] = useState(initialLikes || 0)
    const [userHasLiked, setUserHasLiked] = useState(userHasLikedInitial)
    const [dailyLikes, setDailyLikes] = useState(initialDailyLikes || 0)

    const _handleLike = () => {
        handleLike()

        const newLikes = userHasLiked ? likes - 1 : likes + 1
        setLikes(newLikes)
        setDailyLikes(userHasLiked? dailyLikes -1 : dailyLikes + 1)
        setUserHasLiked(!userHasLiked)
        animate(likesRef, newLikes)
    }

    return (
    <>
        <div className="likesOverlay">
            <Image
                priority
                alt="like button"
                width={64}
                height={64}
                src="/images/like-button.png"
                className={`likeButton ${userHasLiked ? "quoteLiked" : ""}`}
                onClick={_handleLike}
            />
            <div data-anim="likes" className={`text-4xl ${userHasLiked ? "text-black" : ""}`} ref={likesRef}>
                {likes}
            </div>
            {dailyLikes > 0 && (
                <span title="Daily likes" className="text-green-500 ml-1">
                    ▴{dailyLikes}
                </span>
            )}
        </div>
    </>
    )

}