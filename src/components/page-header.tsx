import Link from "next/link";
import { BackIcon } from "./icons";

export function PageHeader({ title, back }: { title: string; back?: string }) {
  return (
    <header className="mb-4 flex items-center gap-2">
      {back && (
        <Link href={back} className="-ms-2 rounded-full p-2 text-muted" aria-label="Back">
          <BackIcon className="rtl:rotate-180" />
        </Link>
      )}
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
}
