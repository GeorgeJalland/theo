import { cookies } from "next/headers";
import { cache } from "react";

import { fetchQuote, fetchSimilarQuotes } from "@/lib/api"
import { notFound } from "next/navigation"
import Link from "next/link";

import Panel from "@/components/Panel";
import QuoteBlock from "@/components/quotes/QuoteBlock"
import { buildPageMeta } from "@/lib/utils.js";

export const getQuote = cache(async (id, cookieString=null) => {
  return fetchQuote(id, cookieString);
});

export async function generateMetadata({ params }) {
    const { id } = await params
    const quote = await getQuote(id);

    const title = `"${quote.text.slice(0, 60)}..."`;
    const description = `${quote.text} - Published on ${quote.episode_publish_date?.split("T")[0] || "Unknown Date"}`;
    const path = `/quote/${id}`;

    return buildPageMeta({
      title: title,
      description: description,
      path: path,
    });
}

const LIMIT = 3;

export default async function Page({ params }) {
  const { id } = await params
  const cookieStore = await cookies();

  const [quote, similarQuotes] = await Promise.all([
    getQuote(id, cookieStore.toString()),
    fetchSimilarQuotes(id, LIMIT, cookieStore.toString()),
  ]);

  if (!quote) {
    notFound()
  }

  return (
    <div className="flex w-full h-[80%] items-center justify-center mt-20 flex-col gap-10">
      <QuoteBlock key={quote.id} quote={quote} />
      <h2 className="text-4xl mt-20">You might also like...</h2>
      <div className="flex flex-col items-center w-full">
        {similarQuotes.map((quote) => (
          <QuoteBlock key={quote.id} quote={quote} className="scale-80 opacity-80 hover:opacity-100 transition-opacity duration-100" />
        ))}
      </div>
      <Panel className="mb-5">
        <Link href="/quotes">
            <h2 className="text-4xl">[More Quotes]</h2>
        </Link>
      </Panel>
    </div>
  )
}