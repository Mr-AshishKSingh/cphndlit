"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { DocumentPreviewPanel } from "@/components/DocumentPreviewPanel";

export type PreviewAttachment = {
  id: string;
  name: string;
  fileType: string;
  reviewStatus: string | null;
  reviewNote: string | null;
};

type Ctx = {
  preview: PreviewAttachment | null;
  openPreview: (a: PreviewAttachment) => void;
  closePreview: () => void;
  updatePreview: (patch: Partial<PreviewAttachment>) => void;
};

const TaskPreviewCtx = createContext<Ctx | null>(null);

export function useTaskPreview() {
  const ctx = useContext(TaskPreviewCtx);
  if (!ctx) throw new Error("useTaskPreview must be used within TaskPreviewShell");
  return ctx;
}

export function TaskPreviewShell({
  taskId,
  isAdmin,
  children,
}: {
  taskId: string;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const [preview, setPreview] = useState<PreviewAttachment | null>(null);

  return (
    <TaskPreviewCtx.Provider
      value={{
        preview,
        openPreview: setPreview,
        closePreview: () => setPreview(null),
        updatePreview: (patch) => setPreview((p) => (p ? { ...p, ...patch } : p)),
      }}
    >
      <div className={clsx("flex gap-4 items-start", !preview && "max-w-2xl")}>
        <div className={clsx("min-w-0", preview ? "w-1/2" : "flex-1")}>{children}</div>
        {preview && (
          <div className="w-1/2 min-w-0 sticky top-20 h-[calc(100vh-6rem)]">
            <DocumentPreviewPanel
              attachment={preview}
              taskId={taskId}
              isAdmin={isAdmin}
              onClose={() => setPreview(null)}
            />
          </div>
        )}
      </div>
    </TaskPreviewCtx.Provider>
  );
}
