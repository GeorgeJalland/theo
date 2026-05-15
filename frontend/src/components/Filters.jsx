"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"
import SearchBar from "./SearchBar";
import SortBar from "./SortBar";
import { completeSoftNavigation } from "next/dist/client/components/segment-cache/navigation";

const focuses = Object.freeze({
    SORT: "sort",
    SEARCH: "search"
})

const sortOptions = [
  { title: "Trending", requestArg: "trending"},
  { title: "New", requestArg: "new"},
  { title: "Likes", requestArg: "likes"},
]

export default function Filters({ searchParams, currentFilters, handleSearch }) {
    const hasSearch = currentFilters?.search != null

    const [focus, setFocus] = useState(hasSearch ? focuses.SEARCH : focuses.SORT)
    const router = useRouter()

    useEffect(() => {
        setFocus(hasSearch ? focuses.SEARCH : focuses.SORT)
    }, [currentFilters])


    function handleSearch(value) {
        const params = new URLSearchParams(searchParams)
    
        if (value) {
          params.set("search", value)
        } else {
          params.delete("search")
        }
    
        router.push(`/quotes?${params.toString()}`)
    }

    function handleSort(sort, sortOrder) {
        const params = new URLSearchParams(searchParams)
        params.delete("search")
        params.set("sort", sort)
        if (sortOrder) {
            params.set("sortOrder", sortOrder)
        }
        router.push(`/quotes?${params.toString()}`)
    }

    return (
        <div className="relative w-full flex items-center justify-between p-3 mb-2">
            <SortBar
                onSort={handleSort}
                options={sortOptions}
                currentSort={currentFilters.sort}
                currentSortOrder={currentFilters?.sortOrder}
                onFocus={() => setFocus(focuses.SORT)}
                isCompact={focus === focuses.SEARCH}
            />
            <div className={`${focus === focuses.SEARCH ? "w-[65%]" : "w-[40%]"} transition-all duration-300`}>
                <SearchBar onFocus={() => setFocus(focuses.SEARCH)} onBlur={() => setFocus(focuses.SORT)} onSearch={handleSearch}/>
            </div>
        </div>
    )
}