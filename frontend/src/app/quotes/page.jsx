import { Suspense } from "react"
import Image from "next/image"

import Filters from "../../components/Filters"
import QuoteListSkeleton from "../../components/QuoteListSkeleton"
import QuoteListServer from "../../components/QuoteListServer"
import RatDivider from "../../components/RatDivider"
import Panel from "@/components/Panel"
import { buildPageMeta } from "@/lib/utils.js";

const DEFAULT_SORT = "trending"
const DEFAULT_SORT_ORDER = "desc"

export const metadata = buildPageMeta({
  title: "Quotes",
  description:
    "Browse and search Theo Von quotes. Sort by trending, newest, or most liked. Updated regularly with his funniest and most popular quotes.",
  path: "/quotes",
});

export default async function Quotes({ searchParams }) {
  const params = await searchParams

  const filters = {
    search: params.search?.trim() || null,
    sort: params.search?.trim()
      ? DEFAULT_SORT
      : params.sort ?? DEFAULT_SORT,
    sortOrder: params.sortOrder ?? DEFAULT_SORT_ORDER
  }

  return (
    <>
      <Panel className="flex-col mb-4">
        <h2 className="text-6xl font-bold">[Quotes]</h2>
        <h3>Quotes by Comedian Theo Von</h3>
      </Panel>
      <Filters searchParams={params} currentFilters={filters} />
      <RatDivider/>
      <Suspense fallback={<QuoteListSkeleton clones={10} />}>
        <QuoteListServer filters={filters} />
      </Suspense>
    </>
  )
}