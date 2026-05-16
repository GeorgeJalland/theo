import Panel from "@/components/Panel";

import { buildPageMeta } from "@/lib/utils.js";

export const metadata = buildPageMeta({
    title: "Clips",
    description:
        "Coming soon, watch this space...",
    path: "/clips",
});


export default function Clips({}) {
    return (
        <Panel className="mt-60">
            <h1 className="text-6xl">Coming Soon...</h1>
        </Panel>
    )
}