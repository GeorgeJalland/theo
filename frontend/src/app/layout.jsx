import "./globals.css"
import ClientLayout from "./ClientLayout"

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}