import { redirect } from "next/navigation"
import { fetchQuote } from "@/lib/api"

export default async function QuoteIndexPage() {
  const quote = await fetchQuote() // TODO: rethink this 

  redirect(`/quote/${quote.id}`)
}