"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import LikeButton from "./LikeButton"
import ShareButton from "./ShareButton"
import Reference from "./Reference"

export default function MetaContainer({ quote, index, handleLike, handleShare, animate }) {
    const isUrlSpotify = quote.url.includes("spotify")

    return (
        <div className="flex justify-between items-end w-full text-gray-700 pb-2 text-3xl">
            <div className="flex gap-3 px-4 border md:border-2 border-black/50 bg-white/30 rounded-2xl">
                <LikeButton
                handleLike={handleLike}
                userHasLikedInitial={quote.liked_by_user}
                initialLikes={quote.likes}
                animate={animate}
                initialDailyLikes={quote.daily_likes}
                />
                <div className="w-px h-8 bg-black/50 self-center" />
                <ShareButton
                handleShare={handleShare}
                initialShares={quote.shares}
                animate={animate}
                />
            </div>
            <div className="flex justify-end items-center w-full min-w-0 gap-3">
                {isUrlSpotify ? (
                    <>
                        <Link href={quote.url} target="_blank" rel="noopener noreferrer" title="open spotify clip">
                            <Image height={64} width={64} src="/images/spotify_logo.png" alt="spotify logo"className="w-7 h-full"/>
                        </Link>
                        <Link href={"/episode/"+quote.episode_id} className="truncate max-w-[50%]" title={quote.episode_title}>{quote.episode_title}</Link>
                    </>
                ) :  <Reference
                    url={quote.url}
                />}
            </div>
        </div>
    )
}