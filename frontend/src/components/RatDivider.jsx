import Image from "next/image"

export default function RatDivider({}){
    return (
        <div className="flex w-full items-center justify-center mb-4">
            <div className="w-[42%] h-[1px] md:h-[2px] bg-white" />
            <Image priority alt="rat king" height={64} width={64} className="w-16 h-full mx-4" src="/images/pixel rat.png"/>
            <div className="w-[42%] h-[1px] md:h-[2px] bg-white" />
        </div>
    )
}