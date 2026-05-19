"use client";

import { useRouter  } from "next/navigation"
import { useEffect, useState, useRef } from "react";

export default function SearchBar({ page, placeholder, onFocus, onBlur, searchParams }) {
  const [query, setQuery] = useState(searchParams?.search || "");
  const router = useRouter()
  const didMount = useRef(false)

  function handleBlur() {
    if (!query) {
      onBlur && onBlur()
    }
  }

  function handleSearch(value) {
    const params = new URLSearchParams()

    if (value?.trim()) {
      params.set("search", value)
    }

    router.push(`/${page}?${params.toString()}`)
  }

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setQuery(searchParams?.search || "")
  }, [searchParams?.search])

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