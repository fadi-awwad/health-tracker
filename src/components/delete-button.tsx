"use client";

import { useTransition } from "react";
import { deleteEntry } from "@/app/actions/entries";
import { useI18n } from "./i18n-provider";
import { TrashIcon } from "./icons";

export function DeleteButton({ kind, id }: { kind: Parameters<typeof deleteEntry>[0]; id: number }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={t("delete")}
      disabled={pending}
      className="rounded-full p-2 text-muted hover:text-danger disabled:opacity-40"
      onClick={() => {
        if (confirm(t("confirm_delete"))) start(() => deleteEntry(kind, id));
      }}
    >
      <TrashIcon width={18} height={18} />
    </button>
  );
}
