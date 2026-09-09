"use server";

import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import AccessRequest from "@/db/models/AccessRequest";
import ScientistAccess from "@/db/models/ScientistAccess";
import { revalidatePath } from "next/cache";

export async function grantAccess(
  requestId: string,
  userEmail: string,
  formula: string,
) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  const normalizedEmail = userEmail.toLowerCase().trim();

  // Add formula to scientistaccess collection (creates entry if missing, adds to array if present)
  await ScientistAccess.findOneAndUpdate(
    { scientistEmail: normalizedEmail },
    { $addToSet: { chemicalFormulas: formula } },
    { upsert: true, new: true },
  );

  // Update request status to approved
  await AccessRequest.findByIdAndUpdate(requestId, { status: "approved" });

  revalidatePath("/admin/access-requests");
}

export async function rejectAccess(requestId: string) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  // Update request status to rejected
  await AccessRequest.findByIdAndUpdate(requestId, { status: "rejected" });

  revalidatePath("/admin/access-requests");
}
