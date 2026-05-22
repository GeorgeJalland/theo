import Filters from "../../components/Filters"
import QuoteListSkeleton from "../../components/quotes/QuoteListSkeleton"
import Panel from "@/components/Panel"

export default function Loading() {
    return  (
        <>
            <Panel className="flex-col mb-4">
                <h2 className="text-6xl font-bold">[Quotes]</h2>
                <h3>Quotes by Comedian Theo Von</h3>
            </Panel>
            <Filters currentFilters={{sort: "created_at"}}></Filters>
            <QuoteListSkeleton clones={20} />
        </>
    )
}