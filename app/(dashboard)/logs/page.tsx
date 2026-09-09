import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import DispenseLog from "@/db/DispenseLog";

export default async function UsageReportPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!session || !email) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any)?.role;
  const allowedRoles = ["admin", "scientist", "lab_technician"];

  if (!allowedRoles.includes(role)) {
    redirect("/login");
  }

  await dbConnect();

  const logs = await DispenseLog.find({
    scientistEmail: email.toLowerCase().trim(),
  })
    .sort({ timestamp: -1 })
    .lean();

  const serializedLogs = logs.map((log) => ({
    ...log,
    _id: log._id.toString(),
    timestamp: new Date(log.timestamp).toLocaleString(),
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usage Report</h1>
        <p className="text-sm text-gray-600">
          Showing chemical dispense history for:{" "}
          <span className="font-semibold">{email}</span>
        </p>
      </div>

      {serializedLogs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center text-gray-500">
          No dispense logs found for your account.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm uppercase">
              <tr>
                <th className="p-4 font-semibold border-r border-gray-200">
                  Timestamp
                </th>
                <th className="p-4 font-semibold border-r border-gray-200">
                  Chemical Formula
                </th>
                <th className="p-4 font-semibold border-r border-gray-200">
                  Amount Used
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {serializedLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-4 font-medium text-gray-900 border-r border-gray-200">
                    {log.chemicalFormula}
                  </td>
                  <td className="p-4 text-gray-700 font-medium border-r border-gray-200">
                    {log.amountDrawn} L
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
