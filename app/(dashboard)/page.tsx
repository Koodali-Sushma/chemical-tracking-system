import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import { formatNumber } from "@/lib/formatNumber";

export default async function InventoryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any)?.role;
  const allowedRoles = ["admin", "scientist", "lab_technician"];

  if (!allowedRoles.includes(role)) {
    redirect("/login");
  }

  await dbConnect();

  const chemicals = await Chemical.find({});

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chemical Inventory</h1>

      <p className="mb-6 text-gray-400 mt-5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
        Welcome, {(session.user as any)?.name}! Here is the list of chemicals in
        the inventory:
      </p>
      <div className=" bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-center border-collapse text-slate-100">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4  font-semibold border-r border-gray-200">
                Chemical
              </th>

              <th className="p-4 font-semibold border-r border-gray-200">
                Main Stock
              </th>
              <th className="p-4 font-semibold border-r border-gray-200">
                Node Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-sm">
            {chemicals.map((chem) => (
              <tr
                key={chem._id.toString()}
                className="hover:bg-slate-500 transition"
              >
                <td className="p-4 font-medium text-slate-100 border-r border-gray-200">
                  {chem.name}{" "}
                  <span className="p-4 font-mono text-emerald-400">
                    ({chem.formula})
                  </span>
                </td>
                <td
                  className={`p-4 font-medium border-r border-gray-200 ${chem.mainStock < 5 ? "text-red-400 font-semibold" : "text-slate-100"}`}
                >
                  {formatNumber(chem.mainStock)} {chem.unit}
                </td>
                <td
                  className={`p-4 font-medium border-r border-gray-200 ${chem.nodeStock < 1 ? "text-red-400 font-semibold" : "text-slate-100"}`}
                >
                  {formatNumber(chem.nodeStock)} {chem.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
