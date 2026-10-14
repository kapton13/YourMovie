import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileView } from "@/components/profile/ProfileView";

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: PageProps<"/u/[nickname]">): Promise<Metadata> {
  return { title: `${decode((await params).nickname)} — профіль на YourMovie` };
}

export default function UserPage({ params }: PageProps<"/u/[nickname]">) {
  return (
    <Suspense fallback={null}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: Pick<PageProps<"/u/[nickname]">, "params">) {
  const nickname = decode((await params).nickname).normalize("NFC");
  return <ProfileView key={nickname} nickname={nickname} />;
}
