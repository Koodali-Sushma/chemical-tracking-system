"use server";

import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import ChemicalProvider from "@/db/models/ChemicalProvider";
import ChemicalOrderRequest from "@/db/models/ChemicalOrderRequest";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { sendChemicalOrderEmail } from "@/lib/sendOrderEmail";

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
    emailStatus: "pending",
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  const adminEmail = session?.user?.email?.toLowerCase().trim();

  if (!session || role !== "admin") {
    throw new Error(
      "Unauthorized: Only administrators can approve chemical orders.",
    );
  }
  if (!adminEmail) {
    throw new Error("Admin email not found in session.");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID.");
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
        emailStatus: "pending",
        reviewedAt: new Date(),
        emailError: undefined,
      },
    },
    { new: true },
  );

  if (!updatedOrder) {
    throw new Error("Order request not found or has already been resolved.");
  }

  const provider = await ChemicalProvider.findOne({
    _id: updatedOrder.providerId,
    active: true,
  });

  if (!provider) {
    await ChemicalOrderRequest.findOneAndUpdate(
      {
        _id: updatedOrder._id,
        status: "approved",
      },
      {
        $set: {
          status: "pending",
          emailStatus: "failed",
          emailError: "Active provider was not found.",
        },
      },
    );
    throw new Error("Active provider not found for this order.");
  }
  try {
    await sendChemicalOrderEmail({
      providerEmail: provider.email,
      adminEmail,
      chemicalName: updatedOrder.chemicalName,
      chemicalFormula: updatedOrder.chemicalFormula,
      quantity: updatedOrder.requestedAmount,
    });
    await ChemicalOrderRequest.findOneAndUpdate(
      {
        _id: updatedOrder._id,
        status: "approved",
        emailStatus: "pending",
      },
      {
        $set: {
          emailStatus: "sent",
          emailSentAt: new Date(),
        },
        $unset: {
          emailError: "",
        },
      },
    );
  } catch (error) {
    const emailError =
      error instanceof Error ? error.message : "Email delivery failed.";

    await ChemicalOrderRequest.findOneAndUpdate(
      {
        _id: updatedOrder._id,
        status: "approved",
        emailStatus: "pending",
      },
      {
        $set: {
          status: "pending",
          emailStatus: "failed",
          emailError,
        },
      },
    );

    throw new Error(
      "Order was not approved because the provider email could not be sent.",
    );
  }

  revalidatePath("/chemical-orders");
  revalidatePath("/admin/chemical-orders");
  revalidatePath("/notifications");

  return { success: true };
}

export async function rejectChemicalOrder(orderId: string) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const receiverEmail = session?.user?.email?.toLowerCase().trim();

  if (!session || role !== "lab_technician") {
    throw new Error(
      "Unauthorized: Only lab technicians can receive deliveries.",
    );
  }

  if (!receiverEmail) {
    throw new Error("Logged-in technician email is missing.");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID.");
  }

  await dbConnect();

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const receivedOrder = await ChemicalOrderRequest.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(orderId),
        status: "approved",
        emailStatus: "sent",
      },
      {
        $set: {
          status: "received",
          receivedBy: receiverEmail,
          receivedAt: new Date(),
        },
      },
      {
        new: true,
        session: dbSession,
      },
    );

    if (!receivedOrder) {
      throw new Error(
        "Order was not found, email was not sent, or the order is not approved.",
      );
    }

    const chemical = await Chemical.findOne({
      formula: receivedOrder.chemicalFormula,
    }).session(dbSession);

    if (!chemical) {
      throw new Error("Chemical associated with this order was not found.");
    }

    chemical.mainStock = parseFloat(
      (chemical.mainStock + receivedOrder.requestedAmount).toFixed(3),
    );

    await chemical.save({ session: dbSession });

    await dbSession.commitTransaction();

    revalidatePath("/receive-delivery");
    revalidatePath("/chemical-orders");
    revalidatePath("/admin/chemical-orders");

    return { success: true };
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    await dbSession.endSession();
  }
}
