import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import DispenseLog from "@/db/DispenseLog";
import { formatNumber } from "@/lib/formatNumber";

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
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Chemical Formula</th>
                  <th className="p-4">Amount Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {serializedLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-700/30 transition"
                  >
                    <td className="p-4 text-slate-300 text-xs font-mono whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-4 font-mono text-emerald-400">
                      {log.chemicalFormula}
                    </td>
                    <td className="p-4 font-bold text-slate-200">
                      {formatNumber(log.amountDrawn)} L
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
