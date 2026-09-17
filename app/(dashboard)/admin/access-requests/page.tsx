import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import AccessRequest from "@/db/models/AccessRequest";
import AdminAccessTable from "./AdminAccessTable";
import Chemical from "@/db/models/Chemical";
import User from "@/db/models/User";

export default async function AdminAccessRequestsPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    redirect("/");
  }

  await dbConnect();

  const [requestsRaw, chemicals, users] = await Promise.all([
    AccessRequest.find({}).sort({ createdAt: -1 }).lean(),
    Chemical.find({}).lean(),
    User.find({}).lean(),
  ]);

  const chemicalMap = new Map(chemicals.map((c) => [c.formula, c.name]));
  const userMap = new Map(
    users.map((u) => [u.email?.toLowerCase().trim(), u.name || u.email]),
  );

  const requests = requestsRaw.map((req) => {
    const normalizedEmail = req.userEmail.toLowerCase().trim();
    return {
      _id: req._id.toString(),
      userEmail: req.userEmail,
      scientistName: userMap.get(normalizedEmail) || req.userEmail,
      chemicalName: chemicalMap.get(req.formula) || "Unknown Chemical",
      formula: req.formula,
      status: req.status,
      createdAt: new Date(req.createdAt).toLocaleString(),
    };
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Manage Access Requests
        </h1>
        <p className="text-sm text-gray-600">
          Review pending chemical access requests submitted by scientists.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center text-gray-500">
          No access requests found.
        </div>
      ) : (
        <AdminAccessTable requests={requests} />
      )}
    </div>
  );
}
