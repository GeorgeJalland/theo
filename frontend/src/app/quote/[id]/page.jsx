import QuoteBlock from "@/components/QuoteBlock"
import { fetchQuote, fetchQuotesServedCount } from "@/lib/api"
import { notFound } from "next/navigation"

export default async function QOTDPage({ params }) {
  const { id } = await params

  const [quote, servedData] = await Promise.all([
    fetchQuote(id),
    fetchQuotesServedCount(),
  ])

  if (!quote) notFound()

  return (
    <QuoteBlock
      {...quote}
      quotesServed={servedData.quotes_served}
    />
  )
}