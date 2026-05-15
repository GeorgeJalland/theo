import Image from "next/image"
import Link from "next/link";
import { Suspense } from "react";

import { fetchEpisode } from "../../../lib/api"
import { timeAgo } from "../../../lib/utils";
import QuoteBlock from "@/components/QuoteBlock"
import QuoteListServer from "../../../components/QuoteListServer";
import QuoteListSkeleton from "../../../components/QuoteListSkeleton"
import Panel from "@/components/Panel";

export default async function Episode({params}){
    const { id } = await params

    const filters = {
        search: null,
        sort: "new",
        sortOrder: "desc",
        episodeId: id
    }

    const episode = await fetchEpisode(id)

    if (!episode) {
        notFound()
    }

    const thumbnails = await JSON.parse(episode.thumbnails)
    
    return (
        <>
            <div className="w-full flex items-center justify-start gap-8 mb-6 px-8">
                <Image
                    priority
                    height={640}
                    width={640}
                    title={episode.title}
                    alt={`${episode} thumbnail`}
                    src={thumbnails[0].url}
                    className="h-100 w-100 border-2 border-white/80 rounded-2xl"
                />
                <div className="text-left">
                    <h1 className="text-4xl">{episode.title}</h1>
                    <h2>{episode.publish_date.split("T")[0]} ({timeAgo(episode.publish_date)} ago)</h2>
                    <div className="flex gap-4 items-center">
                        <Link href={episode.spotify_url} target="_blank" rel="noopener noreferrer" title="open spotify episode">
                            <Image priority height={64} width={64} src="/images/spotify_logo.png" alt="spotify logo" className="w-14 h-full"/>
                        </Link>
                        <Link href={episode.youtube_url} target="_blank" rel="noopener noreferrer" title="open youtube video">
                            <Image priority height={50} width={64} src="/images/youtube_icon.webp" alt="youtube logo" className="w-16 h-full"/>
                        </Link>
                    </div>
                </div>
            </div>
            <Panel className="mb-4">
                <span className="text-6xl">[Quotes]</span>
            </Panel>
            <Suspense fallback={<QuoteListSkeleton clones={10} />}>
                <QuoteListServer filters={filters} />
            </Suspense>
        </>
    )
}