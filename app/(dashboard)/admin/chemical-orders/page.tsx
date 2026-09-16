import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import ChemicalOrderRequest from "@/db/models/ChemicalOrderRequest";
import SignOutButton from "@/components/SignOutButton";
import AdminOrderTable from "./AdminOrderTable";

export default async function AdminChemicalOrdersPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || role !== "admin") {
    redirect("/login");
  }

  await dbConnect();

  const orders = await ChemicalOrderRequest.find({})
    .sort({ createdAt: -1 })
    .lean();

  const serializedOrders = orders.map((order) => ({
    _id: order._id.toString(),
    chemicalFormula: order.chemicalFormula,
    chemicalName: order.chemicalName,
    providerId: order.providerId.toString(),
    providerName: order.providerName,
    requestedBy: order.requestedBy,
    requestedAmount: order.requestedAmount,
    status: order.status as "pending" | "approved" | "rejected" | "received",
    emailStatus: order.emailStatus,
    emailError: order.emailError || "",
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "",
  }));

  return (
    <main className="p-8 max-w-7xl mx-auto text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Chemical Order Approvals</h1>
          <p className="text-sm text-slate-400">
            Review, approve, or reject chemical order requests submitted by lab
            technicians.
          </p>
        </div>
        <SignOutButton />
      </div>

      <AdminOrderTable orders={serializedOrders} />
    </main>
  );
}
