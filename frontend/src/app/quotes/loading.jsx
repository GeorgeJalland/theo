import Filters from "../../components/Filters"
import QuoteListSkeleton from "../../components/QuoteListSkeleton"

export const dynamic = "force-dynamic";

export default function Loading() {
    return  (
        <>
            <Filters currentFilters={{sort: "created_at"}}></Filters>
            <QuoteListSkeleton clones={20} />
        </>
    )
}