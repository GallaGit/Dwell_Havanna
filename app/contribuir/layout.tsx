import type { Metadata } from "next";
import { SignOutButton } from "@/components/SignOutButton";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Contribute",
    description: "Verified contributors can send a photograph and its story for editorial review.",
    path: "/contribuir",
  }),
  robots: { index: false, follow: false },
};

export default function ContribuirLayout({ children }: LayoutProps<"/contribuir">) {
  return (
    <>
      <SignOutButton
        label="Sign out"
        className="mx-auto flex max-w-[1400px] justify-end px-5 pt-8 md:px-10"
      />
      {children}
    </>
  );
}
