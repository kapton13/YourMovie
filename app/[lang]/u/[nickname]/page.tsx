import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[nickname]">): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: fmt(m.profile.metaTitle, { nickname: decode((await params).nickname) }) };
}

export default function UserPage({ params }: PageProps<"/[lang]/u/[nickname]">) {
  return (
    <Suspense fallback={null}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: Pick<PageProps<"/[lang]/u/[nickname]">, "params">) {
  const nickname = decode((await params).nickname).normalize("NFC");
  return <ProfileView key={nickname} nickname={nickname} />;
}
