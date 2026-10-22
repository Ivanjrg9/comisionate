import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <Logo />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8">{children}</div>
    </main>
  );
}
