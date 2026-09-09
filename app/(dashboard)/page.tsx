import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";

export default async function InventoryPage() {
  // check for authentication first before rendering the page
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

  // Connect to the database and fetch chemicals
  await dbConnect();

  const chemicals = await Chemical.find({});

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chemical Inventory</h1>

      <p className="mb-6 text-gray-700 mt-5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
        Welcome, {(session.user as any)?.name}! Here is the list of chemicals in
        the inventory:
      </p>
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
        <table className="w-full text-center border-collapse">
          <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm uppercase">
            <tr>
              <th className="p-4 font-semibold border-r border-gray-200">
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
          <tbody className="divide-y divide-gray-200 text-sm">
            {chemicals.map((chem) => (
              <tr
                key={chem._id.toString()}
                className="hover:bg-gray-50 transition"
              >
                <td className="p-4 font-medium text-gray-900 border-r border-gray-200">
                  {chem.name}{" "}
                  <span className="text-gray-500 font-normal">
                    ({chem.formula})
                  </span>
                </td>
                <td
                  className={`p-4 font-medium border-r border-gray-200 ${chem.mainStock < 5 ? "text-red-600 font-semibold" : "text-gray-600"}`}
                >
                  {chem.mainStock} {chem.unit}
                </td>
                <td
                  className={`p-4 font-medium border-r border-gray-200 ${chem.nodeStock < 1 ? "text-red-600 font-semibold" : "text-gray-600"}`}
                >
                  {chem.nodeStock} {chem.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
