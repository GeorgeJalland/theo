import QuoteBlock from "@/components/QuoteBlock"
import { fetchQuote, fetchQuotesServedCount } from "@/lib/api"

export default async function QOTDPage({ params }) {
  const { id } = await params

  const quote = await fetchQuote(id)
  const {quotes_served } = await fetchQuotesServedCount()

  return (
    <QuoteBlock
      quote={quote}
      quotesServed={quotes_served}
    />
  )
}
