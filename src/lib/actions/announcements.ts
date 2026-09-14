"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function createAnnouncement(_prevState: { error?: string }, formData: FormData) {
  const session = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";

  if (!title || !body) {
    return { error: "Title and message are required." };
  }

  await prisma.announcement.create({
    data: { title, body, pinned, authorId: session.userId },
  });

  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteAnnouncement(id: string) {
  await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
}
