import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-xl font-extrabold tracking-tight" aria-label="ComisionaTe, inicio">
      Comisiona<span className="rounded bg-accent px-1 text-neutral-900">Te</span>
    </Link>
  );
}
