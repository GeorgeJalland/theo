import "./globals.css"
import Link from "next/link"

import MenuDropdown from "../components/MenuDropdown"
import Panel from "@/components/Panel"
import BootstrapCookie from "@/components/BootstrapCookie"

export const metadata = {
  title: {
    default: "Theo Von Quotes",
    template: "%s | Theo Von Quotes",
  },
  icons: {
    icon: "/images/favicon.png",
  },
  openGraph: {
  title: "%s | Theo Von Quotes",
  },

  twitter: {
    card: "summary",
    title: "%s | Theo Von Quotes"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BootstrapCookie />
        <header className="w-full z-100 flex mb-6 items-end justify-between">
          <Panel className="ml-2">
            <Link href="/">
            <h1 id="theoh1" className="text-5xl tracking-tight">[Theo Von Quotes]</h1>
            </Link>
          </Panel>
          <MenuDropdown/>
        </header>
        <main className="w-full h-full items-center max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}