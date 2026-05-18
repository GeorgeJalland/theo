import QuoteBlockSkeleton from "./QuoteBlockSkeleton"

export default function QuoteListSkeleton({ clones }) {
    return  (
        <div className="flex flex-col w-full items-center gap-8">
            {Array.from({ length: clones }).map((_, i) => (
                <QuoteBlockSkeleton key={i} />
            ))}
        </div>
    )
}