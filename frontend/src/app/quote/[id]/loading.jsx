import QuoteBlockSkeleton from "../../../components/quotes/QuoteBlockSkeleton"
import Panel from "@/components/Panel"

export default function Loading({}) {
    return (
        <div className="flex w-full h-[80%] items-center justify-center mt-20 flex-col gap-10">
            <QuoteBlockSkeleton />
            <h2 className="text-4xl mt-20">You might also like...</h2>
            <div className="flex flex-col items-center w-full">
                {[1,2,3].map((x) => (
                    <QuoteBlockSkeleton key={x} className="scale-80 opacity-80 hover:opacity-100 transition-opacity duration-100" />
                ))}
            </div>
            <Panel className="mb-5">
                <h2 className="text-4xl">[More Quotes]</h2>
            </Panel>
        </div>
    )
}