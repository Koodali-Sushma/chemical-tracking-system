"use server";
import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import AccessRequest from "@/db/models/AccessRequest";
import { revalidatePath } from "next/cache";
import ScientistAccess from "@/db/models/ScientistAccess";

export async function requestChemicalAccess(formula: string) {
  const session = await auth();
  const email = session?.user?.email;

  if (!session || !email) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();

  const existingAccess = await ScientistAccess.findOne({
    scientistEmail: normalizedEmail,
    chemicalFormulas: formula,
  });

  if (existingAccess) {
    throw new Error("You already have access to this chemical.");
  }

  await AccessRequest.findOneAndUpdate(
    { userEmail: email.toLowerCase().trim(), formula },
    { status: "pending", createdAt: new Date() },
    { upsert: true, new: true },
  );

  revalidatePath("/request-access");
}

export async function cancelChemicalAccess(formula: string) {
  const session = await auth();
  const email = session?.user?.email;

  if (!session || !email) {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  await AccessRequest.deleteOne({
    userEmail: email.toLowerCase().trim(),
    formula,
  });

  revalidatePath("/request-access");
}
