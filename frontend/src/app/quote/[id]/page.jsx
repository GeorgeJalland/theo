import { cookies } from "next/headers";
import { cache } from "react";

import { fetchQuote } from "@/lib/api"
import { notFound } from "next/navigation"
import Link from "next/link";

import Panel from "@/components/Panel";
import QuoteBlock from "@/components/QuoteBlock"
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

export default async function Page({ params }) {
  const { id } = await params
  const cookieStore = await cookies();

  let quote;

  try {
    quote = await getQuote(id, cookieStore.toString())
  } catch {
    console.log("throwing")
    notFound()
  }

  return (
    <div className="flex w-[90%] h-[80%] items-center justify-center md:mt-20 mt-40 flex-col gap-20">
      <QuoteBlock key={quote.id} quote={quote} />
        <Panel>
          <Link href="/quotes">
            <h2 className="text-4xl">[More Quotes]</h2>
          </Link>
        </Panel>
    </div>
  )
}