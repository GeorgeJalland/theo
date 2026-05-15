export default function QuoteBlockSkeleton() {
  return (
        <div className="quoteBlock">
            <div className="quoteContainer">
            <div className="w-full p-4 rounded animate-pulse space-y-3">
                <div className="h-4 bg-gray-500 w-7/8 rounded" />
                <div className="h-4 bg-gray-500 w-1/2 rounded" />
                <div className="flex justify-between">
                    <div className="flex w-[50%] gap-2 items-center">
                        <div className="h-4 bg-gray-500 w-10 rounded" />
                        <div className="h-4 bg-gray-500 w-10 rounded" />
                    </div>
                    <div className="flex justify-end w-[50%]">
                        <div className="h-4 bg-gray-500 w-1/2 rounded" />
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}