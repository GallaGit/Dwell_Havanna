import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with an invitation to contribute or to open the editorial desk.",
  alternates: { canonical: "/iniciar-sesion" },
  robots: { index: false, follow: false },
};

export default function SignInLayout({ children }: LayoutProps<"/iniciar-sesion">) {
  return children;
}
