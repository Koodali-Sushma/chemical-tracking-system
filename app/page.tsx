import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";

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
      <div className="flex justify-end mb-4">
        <Link
          href="/simulator"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Simulator
        </Link>
        <SignOutButton />
      </div>
      <p className="mb-6 text-gray-700 mt-5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
        Welcome, {(session.user as any)?.name}! Here is the list of chemicals in
        the inventory:
      </p>
      <ul className="space-y-4">
        {chemicals.map((chem) => (
          <li
            key={chem._id.toString()}
            className="p-4 border rounded-lg shadow-sm"
          >
            <h2 className="font-semibold text-lg">
              {chem.name} ({chem.formula})
            </h2>
            State:{" "}
            <span className="px-2.5 py-0.5 text-s italic font-medium bg-gray-200 rounded-full capitalize w-20 text-center">
              {chem.state}
            </span>
            <p className="text-gray-600">
              Main-Stock: {chem.mainStock} {chem.unit}
            </p>
            <p className="text-gray-600">
              Node-Stock: {chem.nodeStock} {chem.unit}
            </p>
            <p className="text-gray-600">{chem.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
