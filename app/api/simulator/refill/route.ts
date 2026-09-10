import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import RefillLog from "@/db/models/RefillLog";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as { role?: string; email?: string } | undefined;
    const technicianEmail = user?.email?.toLowerCase().trim();

    if (!user || user.role !== "lab_technician" || !technicianEmail) {
      return NextResponse.json(
        { error: "Only lab technicians can refill chemicals." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const chemicalId = String(body.chemicalId || "");

    if (!chemicalId) {
      return NextResponse.json(
        { error: "A chemical ID is required." },
        { status: 400 },
      );
    }

    await dbConnect();

    const currentChemical = await Chemical.findById(chemicalId);

    if (!currentChemical) {
      return NextResponse.json(
        { error: "Chemical not found." },
        { status: 404 },
      );
    }

    if (currentChemical.nodeStock >= 5) {
      return NextResponse.json(
        { error: "The node is already full." },
        { status: 400 },
      );
    }

    // Check if main stock is completely empty
    if (currentChemical.mainStock <= 0) {
      return NextResponse.json(
        { error: "Insufficient main stock for refill." },
        { status: 400 },
      );
    }

    // Calculate ideal amount to reach 5L
    const idealRefillAmount = 5 - currentChemical.nodeStock;

    // Take whatever main stock is available (partial refill if main stock < ideal amount)
    const refillAmount = Math.min(currentChemical.mainStock, idealRefillAmount);
    const newrizioneNodeStock = currentChemical.nodeStock + refillAmount;

    const chemical = await Chemical.findOneAndUpdate(
      {
        _id: chemicalId,
        nodeStock: currentChemical.nodeStock,
        mainStock: currentChemical.mainStock,
      },
      {
        $inc: { mainStock: -refillAmount },
        $set: { nodeStock: newrizioneNodeStock },
      },
      {
        new: true,
      },
    );

    if (!chemical) {
      return NextResponse.json(
        { error: "Refill failed because the stock changed." },
        { status: 409 },
      );
    }

    // Record the event in the dedicated RefillLog collection
    await RefillLog.create({
      chemicalFormula: chemical.formula,
      technicianEmail: technicianEmail,
      amountRefilled: refillAmount,
    });

    return NextResponse.json({
      success: true,
      message: `Node refilled by ${refillAmount}L successfully.`,
      nodeStock: chemical.nodeStock,
      mainStock: chemical.mainStock,
    });
  } catch (error) {
    console.error("Refill error:", error);

    return NextResponse.json(
      { error: "Failed to refill chemical." },
      { status: 500 },
    );
  }
}
