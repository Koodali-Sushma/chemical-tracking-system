import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import DispenseLog from "@/db/DispenseLog";
import ScientistAccess from "@/db/models/ScientistAccess";

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
    const accessRecord = await ScientistAccess.findOne({
      scientistEmail: userEmail,
    }).lean();
    const allowedFormulas = accessRecord?.chemicalFormulas ?? [];

    const chemical = await Chemical.findOneAndUpdate(
      {
        _id: chemicalId,
        nodeStock: { $gte: amount },
        formula: { $in: allowedFormulas },
      },
      { $inc: { nodeStock: -amount } },
      { new: true },
    );

    if (!chemical) {
      return NextResponse.json(
        { error: "Chemical not found or insufficient node stock." },
        { status: 400 },
      );
    }

    await DispenseLog.create({
      chemicalFormula: chemical.formula,
      scientistEmail: userEmail,
      amountDrawn: amount,
    });

    return NextResponse.json({
      success: true,
      message: "Chemical dispensed successfully.",
      nodeStock: chemical.nodeStock,
      mainStock: chemical.mainStock,
    });
  } catch (error) {
    console.error("Dispense error:", error);

    return NextResponse.json(
      { error: "Failed to dispense chemical." },
      { status: 500 },
    );
  }
}
