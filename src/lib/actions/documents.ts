"use server";

import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function uploadDocument(_prevState: { error?: string }, formData: FormData) {
  const session = await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");
  const file = formData.get("file") as File | null;

  if (!employeeId || !file || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File must be under 10MB." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`employees/${employeeId}/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await prisma.document.create({
    data: {
      employeeId,
      name: file.name,
      url: blob.url,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      uploadedById: session.userId,
    },
  });

  revalidatePath(`/employees/${employeeId}`);
  return {};
}

export async function deleteDocument(documentId: string, employeeId: string) {
  await requireAdmin();
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;
  try {
    await del(doc.url);
  } catch {
    // blob already missing, ignore
  }
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath(`/employees/${employeeId}`);
}
