import type { Metadata } from "next";
import { MyAnime } from "@/components/my/MyAnime";

export const metadata: Metadata = { title: "Мої аніме — YourMovie" };

export default function MyPage() {
  return <MyAnime />;
}
