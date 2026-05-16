import "./globals.css"
import Link from "next/link"

import MenuDropdown from "../components/MenuDropdown"
import Panel from "@/components/Panel"
import BootstrapCookie from "@/components/BootstrapCookie"

export const metadata = {
  title: "Theo Von Quotes",
  description:
    "Theo Von's best quotes, like and share your favourites! Our leaderboard feature let's you view the most liked, shared and newest quotes from Theo Von.",
  icons: {
    icon: "/images/favicon.png",
  },
  alternates: {
    canonical: "https://theo-von.com",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BootstrapCookie />
        <header className="w-full z-100 flex mb-6 items-end justify-between">
          <Panel className="ml-2">
            <Link href="/quotes">
            <h1 id="theoh1" className="text-5xl tracking-tight">[Theo Von Quotes]</h1>
            </Link>
          </Panel>
          {/* <div className="flex items-center justify-center leading-none"> */}
            {/* <div className="flex flex-col items-end justify-start leading-none">
              <div>[Quotes]</div>
              <div>Served: 1000</div>
              <div>Count: 500</div>
            </div> */}
            {/* <Image priority height={400} width={400} src="/images/favicon.png" alt="theos head" className="w-25 h-full z-1"/> */}
          {/* </div> */}
          <MenuDropdown/>
        </header>
        <main className="w-full h-full items-center">
          {children}
        </main>
      </body>
    </html>
  )
}