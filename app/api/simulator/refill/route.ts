import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as { role?: string } | undefined;

    if (!user || user.role !== "lab_technician") {
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

    const refillAmount = 5 - currentChemical.nodeStock;

    if (currentChemical.mainStock < refillAmount) {
      return NextResponse.json(
        { error: "Insufficient main stock for refill." },
        { status: 400 },
      );
    }

    const chemical = await Chemical.findOneAndUpdate(
      {
        _id: chemicalId,
        nodeStock: currentChemical.nodeStock,
        mainStock: { $gte: refillAmount },
      },
      {
        $inc: { mainStock: -refillAmount },
        $set: { nodeStock: 5 },
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

    return NextResponse.json({
      success: true,
      message: "Node refilled successfully.",
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
