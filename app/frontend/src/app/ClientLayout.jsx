"use client"

import Link from "next/link"
import { useState } from "react"

export default function ClientLayout({ children }) {
  const [selected, setSelected] = useState("qotd")

  return (
    <>
      <header>
        <h1 id="theoh1">[Theo Von Quotes]</h1>

        <nav id="menu">
          <Link
            href="/quote"
            className={"menuItem " + (selected === "qotd" ? "selected" : "")}
            onClick={() => setSelected("qotd")}
          >
            [QUOTE OF THE DAY]
          </Link>

          <span> | </span>

          <Link
            href="/leaderboard"
            className={"menuItem " + (selected === "leaderboard" ? "selected" : "")}
            onClick={() => setSelected("leaderboard")}
          >
            [LEADERBOARD]
          </Link>
        </nav>
      </header>
      <main>
        {children}
      </main>
    </>
  )
}