"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import type { FormState } from "@/app/actions/types";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/**
 * useActionState wired through onSubmit instead of <form action>, because
 * React resets a form after an action runs: a validation error would wipe
 * everything the user typed.
 */
export function useForm(action: Action) {
  const [state, dispatch, pending] = useActionState(action, null);
  const [, start] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}
