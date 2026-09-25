import type { Metadata } from "next";
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
  return children;
}
