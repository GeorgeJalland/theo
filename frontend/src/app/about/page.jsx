import Image from "next/image";

import Stats from "@/components/Stats";
import FuzzyBlock from "@/components/FuzzyBlock";
import TheoHead from "@/components/TheoHead";

export const dynamic = "force-dynamic"; 

export default async function AboutUs({}) {
    return (
        <>
            <div className="flex flex-col items-start justify-start gap-6 p-4 w-full">
                <div className="flex items-center justify-start w-full mt-4">
                        <h1 className="text-5xl">About</h1>
                </div>

                <FuzzyBlock>
                    <div className="flex flex-col gap-6 md:text-2xl text-4xl text-left w-full">
                        <p>
                            This is a fan-made project built and maintained by an independent developer.
                        </p>
                        <p>
                            The site collects and organises quotes attributed to Theo Von, 
                            primarily sourced from his podcast "This Past Weekend".
                        </p>
                    </div>
                </FuzzyBlock>

                <div className="flex items-center justify-start w-full mt-4">
                        <h1 className="text-5xl">Contact</h1>
                </div>

                <FuzzyBlock>
                    <div className="flex flex-col gap-6 md:text-2xl text-4xl text-left w-full">
                        <a href="mailto:contact@theo-von.com">
                        [contact@theo-von.com]
                        </a>
                    <p>
                        If you have corrections, suggestions, want to contribute, or general enquiries, you can reach me at the above address.
                    </p>
                    </div>
                </FuzzyBlock>

                <div className="flex items-center justify-start w-full mt-4">
                        <h1 className="text-5xl">Stats</h1>
                </div>

                <div className="flex flex-col gap-6 md:text-2xl text-4xl text-left w-full">
                    <Stats />
                </div>
            </div>
            <footer>
                <TheoHead />
            </footer>
        </>
    )
}