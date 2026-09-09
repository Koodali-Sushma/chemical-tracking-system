import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical"; // Adjust to your actual chemical model path
import AccessRequest from "@/db/models/AccessRequest";
import ScientistAccess from "@/db/models/ScientistAccess";
import AccessTable from "./AccessTable";

export default async function RequestAccessPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!session || !email) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any)?.role;
  if (role !== "scientist" && role !== "admin") {
    redirect("/");
  }

  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();

  // Fetch all chemicals from the database
  const chemicalsRaw = await Chemical.find({}).lean();
  const chemicals = chemicalsRaw.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    formula: c.formula,
  }));

  // Fetch pending/rejected requests and active granted access
  const [userRequestsRaw, scientistAccessDoc] = await Promise.all([
    AccessRequest.find({ userEmail: normalizedEmail }).lean(),
    ScientistAccess.findOne({ scientistEmail: normalizedEmail }).lean(),
  ]);

  const userRequests = userRequestsRaw.map((r) => ({
    formula: r.formula,
    status: r.status,
  }));

  const activeFormulas = scientistAccessDoc?.chemicalFormulas || [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Request Chemical Access
        </h1>
        <p className="text-sm text-gray-600">
          Request authorization to dispense restricted compounds or view the
          status of pending requests.
        </p>
      </div>

      {chemicals.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center text-gray-500">
          No chemicals found in the database.
        </div>
      ) : (
        <AccessTable
          chemicals={chemicals}
          userRequests={userRequests}
          activeFormulas={activeFormulas}
        />
      )}
    </div>
  );
}
