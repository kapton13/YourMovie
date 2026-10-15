import type { Metadata } from "next";
import { Recommendations } from "@/components/recs/Recommendations";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.recs.metaTitle };
}

export default function RecommendationsPage() {
  return <Recommendations />;
}
