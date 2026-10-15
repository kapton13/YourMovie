import type { Metadata } from "next";
import { Recommendations } from "@/components/recs/Recommendations";

export const metadata: Metadata = { title: "Рекомендації — YourMovie" };

export default function RecommendationsPage() {
  return <Recommendations />;
}
