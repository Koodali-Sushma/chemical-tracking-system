import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import Chemical from "@/db/models/Chemical";
import ChemicalProvider from "@/db/models/ChemicalProvider";
import ChemicalOrderRequest from "@/db/models/ChemicalOrderRequest";
import SignOutButton from "@/components/SignOutButton";
import ChemicalOrderTable from "./ChemicalOrderTable";

export default async function ChemicalOrdersPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  const userEmail = session?.user?.email?.toLowerCase().trim();

  if (!session || role !== "lab_technician") {
    redirect("/login");
  }

  await dbConnect();

  const lowStockChemicals = await Chemical.find({
    mainStock: { $lt: 5 },
  }).lean();

  const activeProviders = await ChemicalProvider.find({ active: true }).lean();

  const existingOrders = await ChemicalOrderRequest.find({
    requestedBy: userEmail,
    status: { $in: ["pending", "approved", "received", "rejected"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const orderStatusMap: Record<
    string,
    "pending" | "approved" | "received" | "rejected" | "none"
  > = {};

  existingOrders.forEach((order) => {
    if (!orderStatusMap[order.chemicalFormula]) {
      orderStatusMap[order.chemicalFormula] = order.status;
    }
  });

  const serializedChemicals = lowStockChemicals.map((chem) => {
    const matchingProvider = activeProviders.find((provider) =>
      provider.chemicalFormulas.includes(chem.formula),
    );

    return {
      _id: chem._id.toString(),
      name: chem.name,
      formula: chem.formula,
      mainStock: chem.mainStock,
      providerId: matchingProvider ? matchingProvider._id.toString() : "",
      providerName: matchingProvider ? matchingProvider.name : "",
      providerEmail: matchingProvider ? matchingProvider.email : "",
      orderStatus: orderStatusMap[chem.formula] ?? "none",
    };
  });

  return (
    <main className="p-8 max-w-6xl mx-auto text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Chemical Order Requests</h1>
          <p className="text-sm text-slate-400 capitalize">
            Manage low-stock orders for verified laboratory suppliers
          </p>
        </div>
        <SignOutButton />
      </div>

      <ChemicalOrderTable chemicals={serializedChemicals} />
    </main>
  );
}
