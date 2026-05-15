"use client"

import { useRouter } from "next/navigation"
import { Fragment } from "react"

import Panel from "@/components/Panel"

export default function SortBar({ onSort, options, currentSort, currentSortOrder, onFocus, isCompact }) {
  const router = useRouter()

  return (
    <Panel className="p-1">
      {options.map((item, i) => {
        const isActive = item.requestArg === currentSort
        const isDescending = currentSortOrder === "desc"

        return (
          <Fragment key={item.title}>
            <button
              key={item.title}
              onClick={() => onSort(item.requestArg, isActive && isDescending ? "asc" : "desc")}
              onFocus={onFocus}
              className={isActive ? "" : "text-gray-400 hover:text-gray-700"}
            >
              {isActive && (isDescending ? "▾ ": "▴ ")}{item.title}
            </button>
            { i < options.length -1 && <div key={i} className="w-px h-8 bg-white/30 self-center" />}
          </Fragment>
        )
      })}
    </Panel>
  )
}