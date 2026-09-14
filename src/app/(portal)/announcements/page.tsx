import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { deleteAnnouncement } from "@/lib/actions/announcements";
import { Pin, Trash2 } from "lucide-react";

export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!session) return null;
  const isAdmin = session.role === "ADMIN";

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { include: { employee: true } } },
  });

  return (
    <div>
      <PageHeader title="Announcements" description="Company-wide updates" />

      {isAdmin && <AnnouncementForm />}

      {announcements.length === 0 ? (
        <EmptyState title="No announcements yet" />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="h-4 w-4 text-indigo-600" />}
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                </div>
                {isAdmin && (
                  <form action={deleteAnnouncement.bind(null, a.id)}>
                    <button type="submit" className="btn-ghost !px-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{a.body}</p>
              <p className="text-xs text-slate-400 mt-3">
                {a.author.employee ? `${a.author.employee.firstName} ${a.author.employee.lastName}` : "CEO"} ·{" "}
                {formatDateTime(a.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
