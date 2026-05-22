"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function ShareButton({ handleShare, initialShares}) {
    const [shares, setShares] = useState(initialShares || 0)

    async function _handleShare() {
        handleShare()

        setShares(prev => prev + 1)
    }

    return (
    <>
        <div className="share shrink-0">
            <Image
                alt="share button"
                src="/images/share3.png"
                className="shareButton"
                onClick={_handleShare}
                width={64}
                height={64}
                priority
            />
            <div className="text-4xl">
                {shares}
            </div>
        </div>
    </>
    )

}