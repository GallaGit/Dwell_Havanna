import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revisión editorial",
  alternates: { canonical: "/admin/review" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div lang="es">{children}</div>;
}
