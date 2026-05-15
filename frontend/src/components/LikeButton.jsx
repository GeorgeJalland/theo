"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function LikeButton({ handleLike, userHasLikedInitial, initialLikes, animate }) {
    const likesRef = useRef(null)

    const [likes, setLikes] = useState(initialLikes || 0)
    const [userHasLiked, setUserHasLiked] = useState(userHasLikedInitial)

    const _handleLike = () => {
        handleLike()

        const newLikes = userHasLiked ? likes - 1 : likes + 1
        setLikes(newLikes)
        
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
        </div>
    </>
    )

}