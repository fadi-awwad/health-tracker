import { requireUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
