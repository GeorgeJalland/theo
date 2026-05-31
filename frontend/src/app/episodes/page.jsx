import { notFound } from "next/navigation"

import { buildPageMeta } from "@/lib/utils.js";
import { fetchEpisodes, searchEpisodes } from "../../lib/api"
import SearchBar from "../../components/SearchBar";
import InfiniteEpisodeList from "../../components/episodes/InfiniteEpisodeList";
import Panel from "@/components/Panel";

const LIMIT = 20;
const PAGE = 1;
const DEFAULT_SORT = "publish_date";
const DEFAULT_ORDER = "desc"

export const dynamic = "force-dynamic";

export const metadata = buildPageMeta({
  title: "Episodes",
  description:
    "Browse and search Theo Von This Past Weekend podcast episodes. Updated regularly with new episodes.",
  path: "/episodes",
});


export default async function Episodes({ searchParams }) {
    const params = await searchParams

    const results = params?.search ? await searchEpisodes(params.search, PAGE, LIMIT) : await fetchEpisodes(DEFAULT_SORT, DEFAULT_ORDER, PAGE, LIMIT)

    const episodes = results.items

    return (
        <>
            <Panel className="flex-col mb-4">
                <h2 className="text-6xl font-bold">[Episodes]</h2>
                <h3>This Past Weekend Podcast Episodes</h3>
            </Panel>
            <div className="w-[90%] flex items-center justify-center mb-4">
                <SearchBar page="episodes" placeholder="🔎Search for episodes..." searchParams={params} />
            </div>
            <InfiniteEpisodeList 
            initialEpisodes={episodes}
            pages={results.pages}
            total={results.total}
            initialOrderBy={DEFAULT_SORT}
            initialSortOrder={DEFAULT_ORDER}
            searchTerm={params?.search}
            />
        </>
    )
}