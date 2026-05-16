"use client";

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";

export default function SearchBar({ onFocus, onBlur, onSearch }) {
  const [query, setQuery] = useState("");
  const router = useRouter()

  function handleBlur() {
    if (!query) {
      onBlur()
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
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
      placeholder="🔎Search for quotes"
      className="w-full h-full rounded-lg border-1 md:border-2 p-2 backdrop-blur-sm"
    />
  );
}