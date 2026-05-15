import { notFound } from "next/navigation"
import { fetchEpisodes } from "../../lib/api"
import SearchBar from "../../components/SearchBar";
import InfiniteEpisodeList from "../../components/InfiniteEpisodeList";
import Panel from "@/components/Panel";

const LIMIT = 20;
const PAGE = 1;
const DEFAULT_SORT = "publish_date";
const DEFAULT_ORDER = "desc"

export const dynamic = "force-dynamic"; 

export default async function Episodes({}) {
    const results = await fetchEpisodes(DEFAULT_SORT, DEFAULT_ORDER, PAGE, LIMIT)

    const episodes = results.items

    return (
        <>
            <Panel className="flex-col mb-4">
                <h2 className="text-6xl font-bold">[Episodes]</h2>
                <h3>This Past Weekend Podcast Episodes</h3>
            </Panel>
            {/* <SearchBar onSearch={"hello"}/> */}
            <InfiniteEpisodeList 
            initialEpisodes={episodes}
            pages={results.pages}
            total={results.total}
            initialOrderBy={DEFAULT_SORT}
            initialSortOrder={DEFAULT_ORDER}
            />
        </>
    )
}