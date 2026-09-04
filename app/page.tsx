import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import SignOutButton from "@/components/SignOutButton";

export default async function InventoryPage() {
  await dbConnect();
  const chemicals = await Chemical.find({});

  const session = await auth();

  // If there is no session or the user is not an admin, redirect to login
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chemical Inventory</h1>
      <div className="flex justify-end mb-4">
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
              Stock: {chem.stockQuantity} {chem.unit}
            </p>
            <p className="text-gray-600">{chem.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
