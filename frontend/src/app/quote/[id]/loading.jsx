import QuoteBlockSkeleton from "../../../components/QuoteBlockSkeleton"

export const dynamic = "force-dynamic";


export default function Loading({}) {
    return (
        <div className="flex md:w-[80%] h-[80%] items-center justify-center">
                    <QuoteBlockSkeleton />
        </div>
    )
}