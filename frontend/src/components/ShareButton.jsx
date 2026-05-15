"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function ShareButton({ handleShare, initialShares, animate}) {
    const sharesRef = useRef(null)

    const [shares, setShares] = useState(initialShares || 0)

    async function _handleShare() {
        handleShare()

        setShares(prev => prev + 1)

        animate(sharesRef, shares)
    }

    return (
    <>
        <div className="share">
            <Image
                alt="share button"
                src="/images/share3.png"
                className="shareButton"
                onClick={_handleShare}
                width={64}
                height={64}
                priority
            />
            <div data-anim="shares" className="text-4xl" ref={sharesRef}>
                {shares}
            </div>
        </div>
    </>
    )

}