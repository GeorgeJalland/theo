"use client"

import { useEffect } from "react"

import { fetchBootstrap } from "@/lib/api"

export default function BootstrapCookie() {
    useEffect(() => {
        fetchBootstrap()
    }, [])

    return null
}