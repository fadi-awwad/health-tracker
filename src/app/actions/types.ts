import type { DictKey } from "@/lib/i18n";

/** Result of a form server action used with useActionState. */
export type FormState = { error?: DictKey; ok?: DictKey } | null;
