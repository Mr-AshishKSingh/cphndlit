"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadDocument } from "@/lib/actions/documents";
import { UploadCloud } from "lucide-react";

export function DocumentUploadForm({ employeeId }: { employeeId: string }) {
  const initialState: { error?: string } = {};
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="flex-1 min-w-[200px]">
        <label className="label">Upload document</label>
        <input type="file" name="file" required className="input file:mr-3 file:btn-secondary file:!py-1" />
      </div>
      <button type="submit" disabled={pending} className="btn-secondary">
        <UploadCloud className="h-4 w-4" /> {pending ? "Uploading..." : "Upload"}
      </button>
      {state.error && <p className="text-sm text-red-600 basis-full">{state.error}</p>}
    </form>
  );
}
