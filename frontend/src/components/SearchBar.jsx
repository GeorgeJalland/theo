"use client";

import { useRouter, useSearchParams  } from "next/navigation"
import { useEffect, useState, useRef } from "react";

export default function SearchBar({ page, placeholder, onFocus, onBlur }) {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""

  const [query, setQuery] = useState(initialSearch);
  const router = useRouter()

  function handleBlur() {
    if (!query) {
      onBlur && onBlur()
    }
  }

  function handleSearch(value) {
    const params = new URLSearchParams(searchParams)

    if (value?.trim()) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    router.push(`/${page}?${params.toString()}`)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={onFocus}
      onBlur={handleBlur}
      placeholder={placeholder || "🔎Search..."}
      className="w-full h-full rounded-lg border-1 md:border-2 p-2 backdrop-blur-sm"
    />
  );
}