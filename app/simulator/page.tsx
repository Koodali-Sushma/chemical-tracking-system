import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import ScientistAccess from "@/db/models/ScientistAccess";
import SignOutButton from "@/components/SignOutButton";
import SimulatorClient from "@/components/SimulatorClient";

export default async function SimulatorPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  const email = session?.user?.email;

  if (!session || (role !== "scientist" && role !== "lab_technician")) {
    redirect("/login");
  }

  await dbConnect();

  let query = {};

  // If the user is a scientist, restrict chemicals based on their access list
  if (role === "scientist" && email) {
    const accessRecord = await ScientistAccess.findOne({
      scientistEmail: email.toLowerCase().trim(),
    }).lean();
    const allowedFormulas = accessRecord
      ? accessRecord.chemicalFormulas
          .map((formula: string) => formula.trim())
          .filter(Boolean)
      : [];
    query = { formula: { $in: allowedFormulas } };
  }

  const chemicals = await Chemical.find(query).lean();
  console.log("Chemicals fetched for user:", chemicals);
  const serializedChemicals = chemicals.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    formula: c.formula,
    nodeStock: c.nodeStock,
    mainStock: c.mainStock,
    maxCapacity: 5,
  }));

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Laboratory Simulator</h1>

          <p className="text-sm text-gray-600 capitalize">
            Role: {role.replace("_", " ")} | User:{" "}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
            {(session.user as any)?.name || email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <SimulatorClient chemicals={serializedChemicals} role={role} />
    </main>
  );
}
