import { redirect } from "next/navigation"
import { fetchQuote } from "@/lib/api"
import { notFound } from "next/navigation"

export default async function QuoteIndexPage() {
  const quote = await fetchQuote() // TODO: rethink this 

  console.log("Fetched quote:", quote)

  if (!quote) notFound()

  redirect(`/quote/${quote.id}`)
}
