"use server";

import { getSession } from "@/lib/auth";
import { logActivity, describePath } from "@/lib/activity";

export async function logPageView(path: string) {
  const session = await getSession();
  if (!session) return;
  await logActivity({
    userId: session.userId,
    employeeId: session.employeeId,
    type: "PAGE_VIEW",
    description: `Viewed ${describePath(path)}`,
    path,
  });
}
