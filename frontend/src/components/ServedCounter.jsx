"use client"

import { useRef, useState } from "react"

export default function ServedCounter({ quotesServed }) {
    const servedRef = useRef(null)

    return (
        <div className="quotesServed">
            <div>Served:</div>
            <div data-anim="served" ref={servedRef}>
                {quotesServed}
            </div>
        </div>
    )
}