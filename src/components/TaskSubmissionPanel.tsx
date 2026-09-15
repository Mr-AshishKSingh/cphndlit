"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveSubmissionNotes, uploadTaskAttachment, deleteTaskAttachment } from "@/lib/actions/taskSubmissions";
import { formatDateTime } from "@/lib/format";
import { FileText, Image as ImageIcon, Download, Trash2, UploadCloud, CheckCircle2 } from "lucide-react";

type Attachment = {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskSubmissionPanel({
  taskId,
  initialNotes,
  submittedAt,
  attachments,
  canEdit,
}: {
  taskId: string;
  initialNotes: string | null;
  submittedAt: Date | null;
  attachments: Attachment[];
  canEdit: boolean;
}) {
  const notesInitialState: { error?: string; success?: boolean } = {};
  const [notesState, notesAction, notesPending] = useActionState(saveSubmissionNotes, notesInitialState);

  const uploadInitialState: { error?: string } = {};
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadTaskAttachment, uploadInitialState);
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const wasUploadPending = useRef(false);

  useEffect(() => {
    if (wasUploadPending.current && !uploadPending && !uploadState.error) {
      uploadFormRef.current?.reset();
    }
    wasUploadPending.current = uploadPending;
  }, [uploadPending, uploadState.error]);

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Task Submission</h3>
        {submittedAt && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Last updated {formatDateTime(submittedAt)}
          </span>
        )}
      </div>

      {canEdit ? (
        <form action={notesAction} className="space-y-2">
          <input type="hidden" name="taskId" value={taskId} />
          <label className="label">Write-up / results</label>
          <textarea
            name="notes"
            rows={5}
            defaultValue={initialNotes ?? ""}
            placeholder="Describe what you did, any findings, links, or notes about this task..."
            className="input"
          />
          {notesState.error && <p className="text-sm text-red-600">{notesState.error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={notesPending} className="btn-primary">
              {notesPending ? "Saving..." : "Save Write-up"}
            </button>
            {notesState.success && !notesPending && <span className="text-xs text-emerald-600">Saved</span>}
          </div>
        </form>
      ) : (
        <div>
          <p className="label">Write-up / results</p>
          {initialNotes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{initialNotes}</p>
          ) : (
            <p className="text-sm text-slate-400">Nothing submitted yet.</p>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 space-y-3">
        <p className="label">Attachments</p>

        {canEdit && (
          <form
            ref={uploadFormRef}
            action={uploadAction}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="taskId" value={taskId} />
            <div className="flex-1 min-w-[200px]">
              <input
                type="file"
                name="file"
                required
                className="input file:mr-3 file:btn-secondary file:!py-1"
              />
            </div>
            <button type="submit" disabled={uploadPending} className="btn-secondary">
              <UploadCloud className="h-4 w-4" /> {uploadPending ? "Uploading..." : "Upload"}
            </button>
            {uploadState.error && <p className="text-sm text-red-600 basis-full">{uploadState.error}</p>}
          </form>
        )}

        {attachments.length === 0 ? (
          <p className="text-sm text-slate-400">No files uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {attachments.map((a) => {
              const isImage = a.fileType.startsWith("image/");
              return (
                <li key={a.id} className="flex items-center justify-between py-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isImage ? (
                      <ImageIcon className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate">{a.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(a.fileSize)} · {formatDateTime(a.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/api/task-attachments/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost !px-2"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {canEdit && (
                      <form action={deleteTaskAttachment.bind(null, a.id, taskId)}>
                        <button type="submit" className="btn-ghost !px-2 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
