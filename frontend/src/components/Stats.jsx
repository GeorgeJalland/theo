import {
  fetchQuotesServedCount,
  fetchQuoteCount,
  fetchEpisodeCount,
  fetchLikeCount
} from "@/lib/api";

import FuzzyBlock from "@/components/FuzzyBlock";

export default async function Stats() {
  const quotesServed = await fetchQuotesServedCount();
  const quoteCount = await fetchQuoteCount();
  const episodeCount = await fetchEpisodeCount();
  const likeCount = await fetchLikeCount();

  return (
    <div className="w-full max-w-md">

      <FuzzyBlock>
        <div className="grid grid-cols-1 gap-4">
          
          <div className="flex justify-between">
            <span className="opacity-70">Quotes served</span>
            <span>{quotesServed}</span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-70">Total quotes</span>
            <span>{quoteCount}</span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-70">Episodes</span>
            <span>{episodeCount}</span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-70">Likes</span>
            <span>{likeCount}</span>
          </div>

        </div>
      </FuzzyBlock>
    </div>
  );
}