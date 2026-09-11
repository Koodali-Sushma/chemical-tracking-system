import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import DispenseLog from "@/db/DispenseLog";
import ScientistAccess from "@/db/models/ScientistAccess";

class DispenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DispenseValidationError";
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as { role?: string; email?: string } | undefined;

    const userEmail = user?.email?.toLowerCase().trim();

    if (!session || !user || user.role !== "scientist") {
      return NextResponse.json(
        { error: "Only scientists can dispense chemicals." },
        { status: 403 },
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is missing." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const chemicalId = String(body.chemicalId || "");
    const amount = Number(body.amount);

    if (!chemicalId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "A valid chemical ID and amount are required." },
        { status: 400 },
      );
    }

    await dbConnect();

    const mongoSession = await mongoose.startSession();

    try {
      const updatedChemical = await mongoSession.withTransaction(async () => {
        const accessRecord = await ScientistAccess.findOne({
          scientistEmail: userEmail,
        })
          .session(mongoSession)
          .lean();

        const allowedFormulas = (accessRecord?.chemicalFormulas ?? [])
          .map((formula: string) => formula.trim())
          .filter(Boolean);

        const chemical = await Chemical.findOneAndUpdate(
          {
            _id: chemicalId,
            nodeStock: { $gte: amount },
            formula: { $in: allowedFormulas },
          },
          {
            $inc: { nodeStock: -amount },
          },
          {
            new: true,
            session: mongoSession,
          },
        );

        if (!chemical) {
          throw new DispenseValidationError(
            "Chemical not found, access is not approved, or there is insufficient node stock.",
          );
        }

        await DispenseLog.create(
          [
            {
              chemicalFormula: chemical.formula,
              scientistEmail: userEmail,
              amountDrawn: amount,
            },
          ],
          {
            session: mongoSession,
          },
        );

        return chemical;
      });

      return NextResponse.json({
        success: true,
        message: "Chemical dispensed successfully.",
        nodeStock: updatedChemical.nodeStock,
        mainStock: updatedChemical.mainStock,
      });
    } catch (error) {
      if (error instanceof DispenseValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      throw error;
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    console.error("Dispense error:", error);

    return NextResponse.json(
      { error: "Failed to dispense chemical." },
      { status: 500 },
    );
  }
}
