"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import LikeButton from "./LikeButton"
import ShareButton from "./ShareButton"
import Reference from "./Reference"

export default function MetaContainer({ quote, index, handleLike, handleShare }) {
    const isUrlSpotify = quote.url.includes("spotify")

    return (
        <div className="flex justify-between items-center w-full text-gray-700 pb-2 gap-4 text-3xl z-10">
            <div className="flex gap-3 px-4 border md:border-2 border-black/50 bg-white/30 rounded-2xl shrink-0">
                <LikeButton
                handleLike={handleLike}
                userHasLikedInitial={quote.liked_by_user}
                initialLikes={quote.likes}
                initialDailyLikes={quote.daily_likes}
                />
                <div className="w-px h-8 bg-black/50 self-center" />
                <ShareButton
                handleShare={handleShare}
                initialShares={quote.shares}
                />
            </div>
            <div className="flex justify-end items-center gap-3 flex-1 min-w-0">
                {isUrlSpotify ? (
                    <>
                        <Link href={quote.url} target="_blank" rel="noopener noreferrer" title="open spotify clip" className="flex-none">
                            <Image height={64} width={64} src="/images/spotify_logo.png" alt="spotify logo"className="w-7 h-7 block"/>
                        </Link>
                        <Link href={"/episode/"+quote.episode_id} className="truncate min-w-0" title={quote.episode_title}>{quote.episode_title}</Link>
                    </>
                ) :  <Reference
                    url={quote.url}
                />}
            </div>
        </div>
    )
}