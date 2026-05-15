"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"

import QuoteBlock from "@/components/QuoteBlock"
import { fetchQuotes, searchQuotes } from "@/lib/api"
import QuoteSkeleton from "./QuoteBlockSkeleton"

const QUOTE_LIMIT = 20

export default function InfiniteQuoteList({
  initialQuotes,
  totalPages,
  totalQuotes,
  filters
}) {
    const [quotes, setQuotes] = useState(initialQuotes)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)

    const loaderRef = useRef(null)
    const canLoadMore = page < totalPages

    const loadMore = useCallback(async () => {
        if (loading || !canLoadMore) return

        setLoading(true)

        try {
            const nextPage = page + 1

            const res = filters.search
                ? await searchQuotes(filters.sort, nextPage, QUOTE_LIMIT)
                : await fetchQuotes(filters.sort, filters.sortOrder, nextPage, QUOTE_LIMIT)

            setQuotes(prev => [...prev, ...res.items])
            setPage(nextPage)
        } finally {
            setLoading(false)
        }
    }, [loading, canLoadMore, page, filters])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && canLoadMore && !loading) {
                    loadMore()
                }
            },
            {
                rootMargin: "200px", // MUCH smoother than threshold 1.0
            }
        )

        const el = loaderRef.current
        if (el) observer.observe(el)

        return () => observer.disconnect()
    }, [canLoadMore, loading, loadMore])

    useEffect(() => {
        setQuotes(initialQuotes)
        setPage(1)
    }, [filters])

    return (
    <div className="flex flex-col items-center w-full gap-8">
        {quotes.map((quote, index) => (
                <QuoteBlock key={quote.id} quote={quote} index={filters?.sortOrder === "asc" ? totalQuotes - index : index+1} />
        ))}
        {loading && (
            Array.from({ length: 10 }).map((_, i) => (
                <QuoteSkeleton key={i} />
            ))
        )}
        <div ref={loaderRef} className="h-10 flex justify-center items-center">
            <Image alt="rat king" height={64} width={64} className="w-16 h-full mx-4" src="/images/pixel rat.png"/>
            {canLoadMore ? "Loading..." : ""}
        </div>
    </div>
    )
}