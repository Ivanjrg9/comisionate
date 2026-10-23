import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-lg font-semibold tracking-tight sm:text-xl" aria-label="ComisionaTe, inicio">
      Comisiona<span className="text-amber">Te</span>
    </Link>
  );
}
