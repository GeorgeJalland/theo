import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchQuotes, searchQuotes } from "@/lib/api";
import InfiniteQuoteList from "./InfiniteQuoteList";

const QUOTE_LIMIT = 20;
const PAGE = 1;
const DEFAULT_SORT = "created_at";

export default async function QuoteListServer({ filters }) {
    const cookieStore = await cookies();
    const quotes = filters.search
        ? await searchQuotes(filters.search, PAGE, QUOTE_LIMIT, cookieStore.toString())
        : await fetchQuotes(filters.sort, filters.sortOrder, PAGE, QUOTE_LIMIT, filters?.episodeId, cookieStore.toString());

    return (
        <InfiniteQuoteList
            initialQuotes={quotes.items}
            totalPages={quotes.pages}
            totalQuotes={quotes.total}
            filters={filters}
        />
    );
}