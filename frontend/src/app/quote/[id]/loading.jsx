import QuoteBlockSkeleton from "../../../components/QuoteBlockSkeleton"

export const dynamic = "force-dynamic";


export default function Loading({}) {
    return (
        <div className="flex w-[90%] h-[80%] items-center justify-center md:mt-20 mt-40 flex-col gap-20">
                    <QuoteBlockSkeleton />
        </div>
    )
}