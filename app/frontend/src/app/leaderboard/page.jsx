import { redirect } from "next/navigation"

export default async function LeaderboardIndexPage() {
  redirect(`/leaderboard/likes/1`)
}