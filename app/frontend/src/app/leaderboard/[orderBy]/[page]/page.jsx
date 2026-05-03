import Leaderboard from "@/components/Leaderboard"
import { fetchQuotes } from "@/lib/api"

export default async function LeaderboardPage({ params }) {
  const { orderBy, page } = await params

  const data = await fetchQuotes(orderBy, page, 10)

  return (
    <Leaderboard
      initialData={data}
      initialOrderBy={orderBy}
      initialPage={Number(page)}
    />
  )
}