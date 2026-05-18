import Image from "next/image";
import Link from "next/link";

import Panel from "@/components/Panel"
import { isLessThanXWeeksOld } from "@/lib/utils.js";

export default function EpisodeCard({ episode, showDate=true }) {
    const thumbnails = JSON.parse(episode.thumbnails)

    return (
        <div className="relative flex flex-col items-center justify-center gap-1">
            <Link key={episode.id} href={"/episode/"+episode.id}>
                <Image
                priority
                height={640}
                width={640}
                title={episode.title}
                alt={`${episode.title} thumbnail`}
                src={thumbnails[0].url}
                className="h-auto w-80 border-2 border-white/80 rounded-2xl"
                />
            </Link>
            {showDate && (
                <div className="flex gap-2 items-center justify-center">
                    {isLessThanXWeeksOld(episode.publish_date, 2) && (
                        <div className="flex py-0 px-2 rounded-2xl border border-gray-700 bg-yellow-500">
                            <span  className="leading-tight text-black text-shadow-none text-2xl">New</span>
                        </div>
                    )}
                    <span className="leading-none">{episode.publish_date.split("T")[0]}</span>
                </div>
                )}
        </div>
    )
}