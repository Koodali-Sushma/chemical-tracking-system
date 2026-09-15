"use server";

import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import ChemicalProvider from "@/db/models/ChemicalProvider";
import ChemicalOrderRequest from "@/db/models/ChemicalOrderRequest";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export async function createChemicalOrder(
  chemicalId: string,
  providerId: string,
  requestedAmount: number,
) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  const email = session?.user?.email;

  if (!session || role !== "lab_technician") {
    throw new Error(
      "Unauthorized: Only lab technicians can create chemical orders.",
    );
  }

  if (!email) {
    throw new Error("Unauthorized: User email is missing.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  await dbConnect();

  // Find the chemical by _id
  const chemical = await Chemical.findById(chemicalId);
  if (!chemical) {
    throw new Error("Chemical not found.");
  }

  // Server-side validation: Confirm mainStock < 5
  if (chemical.mainStock >= 5) {
    throw new Error("Order creation failed: Main stock must be less than 5.");
  }

  // Find the provider using _id and active: true
  const provider = await ChemicalProvider.findOne({
    _id: new mongoose.Types.ObjectId(providerId),
    active: true,
  });

  if (!provider) {
    throw new Error("Active chemical provider not found.");
  }

  // Confirm the provider supports the chemical formula
  if (!provider.chemicalFormulas.includes(chemical.formula)) {
    throw new Error("Selected provider does not supply this chemical formula.");
  }

  // Check for an existing pending order for this chemical formula
  const existingPendingOrder = await ChemicalOrderRequest.findOne({
    chemicalFormula: chemical.formula,
    status: "pending",
  });

  if (existingPendingOrder) {
    throw new Error(
      "A pending order request already exists for this chemical.",
    );
  }

  // Create the new ChemicalOrderRequest with status pending
  await ChemicalOrderRequest.create({
    chemicalFormula: chemical.formula,
    chemicalName: chemical.name,
    providerId: provider._id,
    providerName: provider.name,
    requestedBy: normalizedEmail,
    requestedAmount,
    status: "pending",
    createdAt: new Date(),
  });

  // Revalidate required paths
  revalidatePath("/chemical-orders");
  revalidatePath("/notifications");
  revalidatePath("/admin/chemical-orders");

  return { success: true };
}
export async function approveChemicalOrder(orderId: string) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    throw new Error(
      "Unauthorized: Only administrators can approve chemical orders.",
    );
  }

  await dbConnect();

  const updatedOrder = await ChemicalOrderRequest.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(orderId),
      status: "pending",
    },
    {
      $set: {
        status: "approved",
        reviewedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!updatedOrder) {
    throw new Error("Order request not found or has already been resolved.");
  }

  revalidatePath("/chemical-orders");
  revalidatePath("/admin/chemical-orders");

  return { success: true };
}

export async function rejectChemicalOrder(orderId: string) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    throw new Error(
      "Unauthorized: Only administrators can reject chemical orders.",
    );
  }

  await dbConnect();

  const updatedOrder = await ChemicalOrderRequest.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(orderId),
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        reviewedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!updatedOrder) {
    throw new Error("Order request not found or has already been resolved.");
  }

  revalidatePath("/chemical-orders");
  revalidatePath("/admin/chemical-orders");

  return { success: true };
}
export async function receiveChemicalOrder(orderId: string) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || (role !== "admin" && role !== "lab_technician")) {
    throw new Error(
      "Unauthorized: Only admins or lab technicians can receive chemical deliveries.",
    );
  }

  await dbConnect();

  // Find and update only if status is currently "approved"
  const order = await ChemicalOrderRequest.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(orderId),
      status: "approved",
    },
    {
      $set: {
        status: "received",
        receivedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!order) {
    throw new Error(
      "Order not found or must be in 'approved' status before it can be received.",
    );
  }

  // Find the corresponding chemical and increase its mainStock by requestedAmount
  const chemical = await Chemical.findOne({ formula: order.chemicalFormula });
  if (!chemical) {
    throw new Error("Associated chemical record not found for this order.");
  }

  chemical.mainStock = parseFloat(
    (chemical.mainStock + order.requestedAmount).toFixed(3),
  );
  await chemical.save();

  // Revalidate relevant pages/views
  revalidatePath("/chemical-orders");
  revalidatePath("/admin/chemical-orders");
  revalidatePath("/notifications");

  return { success: true };
}
