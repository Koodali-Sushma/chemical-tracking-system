import { NextResponse } from "next/server";
import dbConnect from "@/db/connect"; // adjust path to your connect file

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({
      success: true,
      message: "Database connected successfully!",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
//Navigating to http://localhost:3000/api/test-db in your browser
// will return the success JSON if the connection is active.
