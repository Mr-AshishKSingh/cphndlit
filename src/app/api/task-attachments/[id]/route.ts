import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const attachment = await prisma.taskAttachment.findUnique({ where: { id }, include: { task: true } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session.employeeId === attachment.task.assignedToId;
  if (session.role !== "ADMIN" && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blobRes = await fetch(attachment.url);
  if (!blobRes.ok || !blobRes.body) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  return new NextResponse(blobRes.body, {
    headers: {
      "Content-Type": attachment.fileType,
      "Content-Disposition": `inline; filename="${attachment.name.replace(/"/g, "")}"`,
    },
  });
}
