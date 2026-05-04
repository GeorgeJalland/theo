import Leaderboard from "@/components/Leaderboard"
import { fetchQuotes } from "@/lib/api"
import { notFound } from "next/navigation"

export default async function LeaderboardPage({ params }) {
  const { orderBy, page } = await params

  const data = await fetchQuotes(orderBy, page, 10)

  if (!data) {
    notFound()
  }

  return (
    <Leaderboard
      initialData={data}
      initialOrderBy={orderBy}
      initialPage={Number(page)}
    />
  )
}