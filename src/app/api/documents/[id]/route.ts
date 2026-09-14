import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.employeeId === doc.employeeId;
  if (session.role !== "ADMIN" && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Blob storage URLs are unguessable but not access-controlled, so we fetch
  // server-side and stream the bytes through this authenticated route rather
  // than redirecting the client to the blob URL directly.
  const blobRes = await fetch(doc.url);
  if (!blobRes.ok || !blobRes.body) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  return new NextResponse(blobRes.body, {
    headers: {
      "Content-Type": doc.fileType,
      "Content-Disposition": `inline; filename="${doc.name.replace(/"/g, "")}"`,
    },
  });
}
