import { cookies } from "next/headers";
import { signOutAction } from "@/lib/sign-out";
import { shouldOfferSignOut } from "@/lib/session-end";

export async function SignOutButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const store = await cookies();
  if (!shouldOfferSignOut(store.getAll())) return null;

  return (
    <form action={signOutAction} className={className}>
      <button type="submit" className="text-sm underline underline-offset-4 hover:opacity-70">
        {label}
      </button>
    </form>
  );
}
