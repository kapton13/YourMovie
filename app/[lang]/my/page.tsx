import type { Metadata } from "next";
import { MyAnime } from "@/components/my/MyAnime";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.my.metaTitle };
}

export default function MyPage() {
  return <MyAnime />;
}
