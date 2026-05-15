import { redirect } from "next/navigation"

export default function Home() {
  redirect("/quotes?sort=trending&sortOrder=desc");
}
