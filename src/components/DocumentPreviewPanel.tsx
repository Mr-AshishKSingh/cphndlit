"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Download, FileWarning, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { useTaskPreview, type PreviewAttachment } from "@/components/TaskPreviewContext";
import { reviewTaskAttachment } from "@/lib/actions/taskSubmissions";

type PreviewKind = "image" | "pdf" | "text" | "spreadsheet" | "docx" | "unsupported";

function getPreviewKind(name: string, fileType: string): PreviewKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (fileType.startsWith("image/")) return "image";
  if (fileType === "application/pdf" || ext === "pdf") return "pdf";
  if (ext === "docx" || fileType.includes("wordprocessingml")) return "docx";
  if (ext === "xlsx" || ext === "xls" || ext === "csv" || fileType.includes("spreadsheetml") || fileType === "application/vnd.ms-excel" || fileType === "text/csv") {
    return "spreadsheet";
  }
  if (
    ["txt", "md", "log", "json", "js", "ts", "tsx", "jsx", "css", "html", "xml", "yaml", "yml"].includes(ext) ||
    fileType.startsWith("text/") ||
    fileType === "application/json"
  ) {
    return "text";
  }
  return "unsupported";
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center p-8 text-center">{children}</div>;
}

function LoadingState() {
  return (
    <Centered>
      <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
    </Centered>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Centered>
      <div className="text-sm text-slate-500">
        <FileWarning className="h-6 w-6 mx-auto mb-2 text-slate-300" />
        {message}
      </div>
    </Centered>
  );
}

function ImagePreview({ url }: { url: string }) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const [state, setState] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file");
        return res.text();
      })
      .then((text) => !cancelled && setState({ loading: false, text }))
      .catch(() => !cancelled && setState({ loading: false, error: "Couldn't load this file." }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} />;
  return (
    <pre className="p-4 text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">{state.text}</pre>
  );
}

function SpreadsheetPreview({ url }: { url: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    sheets?: { name: string; rows: string[][] }[];
    error?: string;
  }>({ loading: true });
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const XLSX = await import("xlsx");
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheets = workbook.SheetNames.map((name) => ({
          name,
          rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, blankrows: false, defval: "" }) as string[][],
        }));
        if (!cancelled) setState({ loading: false, sheets });
      } catch {
        if (!cancelled) setState({ loading: false, error: "Couldn't read this spreadsheet." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} />;
  const sheets = state.sheets ?? [];
  const rows = sheets[activeSheet]?.rows ?? [];

  return (
    <div className="h-full flex flex-col">
      {sheets.length > 1 && (
        <div className="flex gap-1 px-3 pt-2 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActiveSheet(i)}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-t-lg whitespace-nowrap",
                i === activeSheet ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto bg-white">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">This sheet is empty.</p>
        ) : (
          <table className="text-xs border-collapse w-full">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-slate-50" : undefined}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={clsx(
                        "border border-slate-200 px-2.5 py-1.5 whitespace-nowrap",
                        i === 0 ? "font-semibold text-slate-700" : "text-slate-600"
                      )}
                    >
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DocxPreview({ url }: { url: string }) {
  const [state, setState] = useState<{ loading: boolean; html?: string; error?: string }>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mammoth = (await import("mammoth")).default;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setState({ loading: false, html: result.value });
      } catch {
        if (!cancelled) setState({ loading: false, error: "Couldn't read this document." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} />;
  return (
    <div className="p-6 bg-white h-full overflow-auto">
      <div
        className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700"
        dangerouslySetInnerHTML={{ __html: state.html ?? "" }}
      />
    </div>
  );
}

function UnsupportedPreview({ url, name }: { url: string; name: string }) {
  return (
    <Centered>
      <div>
        <FileWarning className="h-6 w-6 mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-500 mb-3">Preview isn&apos;t available for this file type.</p>
        <a href={url} target="_blank" rel="noreferrer" className="btn-secondary">
          <Download className="h-4 w-4" /> Download {name}
        </a>
      </div>
    </Centered>
  );
}

function AttachmentReviewBar({
  attachmentId,
  taskId,
  isAdmin,
  reviewStatus,
  reviewNote,
  onReviewed,
}: {
  attachmentId: string;
  taskId: string;
  isAdmin: boolean;
  reviewStatus: string | null;
  reviewNote: string | null;
  onReviewed: (patch: { reviewStatus: string; reviewNote: string | null }) => void;
}) {
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(decision: "APPROVED" | "CHANGES_REQUESTED") {
    setError(null);
    if (decision === "CHANGES_REQUESTED" && !note.trim()) {
      setShowNoteInput(true);
      setError("Explain what needs to be fixed on this file.");
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("attachmentId", attachmentId);
    formData.set("taskId", taskId);
    formData.set("decision", decision);
    formData.set("note", note.trim());
    const result = await reviewTaskAttachment({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowNoteInput(false);
    setNote("");
    onReviewed({ reviewStatus: decision, reviewNote: decision === "CHANGES_REQUESTED" ? note.trim() : null });
    router.refresh();
  }

  if (!isAdmin) {
    if (!reviewStatus) return null;
    return (
      <div
        className={clsx(
          "px-4 py-2.5 text-xs border-b shrink-0 flex items-start gap-1.5",
          reviewStatus === "APPROVED" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"
        )}
      >
        {reviewStatus === "APPROVED" ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> This file has been approved.
          </>
        ) : (
          <>
            <RotateCcw className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Changes requested{reviewNote ? `: ${reviewNote}` : ""}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 border-b border-slate-100 shrink-0 space-y-2">
      {reviewStatus && (
        <p className={clsx("text-xs", reviewStatus === "APPROVED" ? "text-emerald-600" : "text-amber-600")}>
          Currently marked: {reviewStatus === "APPROVED" ? "Approved" : `Changes requested${reviewNote ? ` — ${reviewNote}` : ""}`}
        </p>
      )}
      {showNoteInput && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What needs to be fixed on this file?"
          className="input !text-xs"
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("APPROVED")}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Approve this file
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => (showNoteInput ? submit("CHANGES_REQUESTED") : setShowNoteInput(true))}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {showNoteInput ? "Submit note" : "Flag this file"}
        </button>
      </div>
    </div>
  );
}

export function DocumentPreviewPanel({
  attachment,
  taskId,
  isAdmin,
  onClose,
}: {
  attachment: PreviewAttachment;
  taskId: string;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const kind = getPreviewKind(attachment.name, attachment.fileType);
  const fileUrl = `/api/task-attachments/${attachment.id}`;
  const { updatePreview } = useTaskPreview();

  return (
    <div className="card h-full flex flex-col overflow-hidden !p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <p className="text-sm font-medium text-slate-900 truncate">{attachment.name}</p>
        <div className="flex items-center gap-1 shrink-0">
          <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-ghost !px-2" title="Download">
            <Download className="h-4 w-4" />
          </a>
          <button onClick={onClose} className="btn-ghost !px-2" title="Close preview">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <AttachmentReviewBar
        attachmentId={attachment.id}
        taskId={taskId}
        isAdmin={isAdmin}
        reviewStatus={attachment.reviewStatus}
        reviewNote={attachment.reviewNote}
        onReviewed={updatePreview}
      />
      <div className="flex-1 min-h-0 overflow-hidden bg-slate-50">
        {kind === "image" && <ImagePreview key={fileUrl} url={fileUrl} />}
        {kind === "pdf" && <iframe key={fileUrl} src={fileUrl} className="w-full h-full border-0" title={attachment.name} />}
        {kind === "text" && <TextPreview key={fileUrl} url={fileUrl} />}
        {kind === "spreadsheet" && <SpreadsheetPreview key={fileUrl} url={fileUrl} />}
        {kind === "docx" && <DocxPreview key={fileUrl} url={fileUrl} />}
        {kind === "unsupported" && <UnsupportedPreview url={fileUrl} name={attachment.name} />}
      </div>
    </div>
  );
}
