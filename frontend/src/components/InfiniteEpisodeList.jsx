"use client"

import { useState, useRef, useEffect } from "react"

import { fetchEpisodes } from "../lib/api";
import Image from "next/image";
import Link from "next/link";

export default function InfiniteEpisodeList({
    initialEpisodes,
    pages,
    total,
    initialOrderBy,
    initialSortOrder 
}) {
    const [episodes, setEpisodes] = useState(initialEpisodes)
    const [orderBy, setOrderBy] = useState(initialOrderBy)
    const [sortOrder, setSortOrder] = useState(initialSortOrder)
    const [page, setPage] = useState(1)

    const [loading, setLoading] = useState(false)

    const loaderRef = useRef(null)
    const canLoadMore = page < pages

    async function loadMore() {
        if (loading || !canLoadMore) return

        setLoading(true)

        try {
            const nextPage = page + 1

            const res = await fetchEpisodes(orderBy, sortOrder, nextPage, 20)

            setEpisodes(prev => [...prev, ...res.items])
            setPage(nextPage)

        } finally {
            setLoading(false)
        }
    }
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
            if (entries[0].isIntersecting && canLoadMore && !loading) {
                loadMore()
            }
            },
            { threshold: 0.1, rootMargin: "200px" }
        )

        const el = loaderRef.current
        if (el) observer.observe(el)

        return () => {
            if (el) observer.unobserve(el)
        }
    }, [canLoadMore, loading, initialOrderBy, initialSortOrder])
    
    useEffect(() => {
        setEpisodes(initialEpisodes)
        setPage(1)
    }, [initialOrderBy, initialSortOrder])
    
    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mx-4">
                {episodes.map((ep, i) => {
                    const thumbnails = JSON.parse(ep.thumbnails)
                    return (
                        <div key={ep.id}>
                            <Link key={ep.id} href={"/episode/"+ep.id}>
                                <Image
                                priority
                                height={640}
                                width={640}
                                title={ep.title}
                                alt={`${ep.title} thumbnail`}
                                src={thumbnails[0].url}
                                className="h-auto w-80 border-2 border-white/80 rounded-2xl"
                                />
                            </Link>
                        </div>
                    )
                })}
            </div>
            <div ref={loaderRef} className="h-10 flex justify-center items-center">
                    <Image priority alt="rat king" height={64} width={64} className="w-16 h-full mx-4" src="/images/pixel rat.png"/>
                    {canLoadMore ? "Loading..." : ""}
            </div>
        </>
    )
}