import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/db/connect";
import ChemicalOrderRequest from "@/db/models/ChemicalOrderRequest";
import ReceiveDeliveryTable from "./ReceiveDeliveryTable";

export default async function ReceiveDeliveryPage() {
  const session = await auth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;

  if (!session || role !== "lab_technician") {
    redirect("/login");
  }

  await dbConnect();

  const orders = await ChemicalOrderRequest.find({
    emailStatus: "sent",
    status: {
      $in: ["approved", "received"],
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  const serializedOrders = orders.map((order) => ({
    _id: order._id.toString(),
    chemicalName: order.chemicalName,
    chemicalFormula: order.chemicalFormula,
    providerName: order.providerName,
    requestedBy: order.requestedBy,
    receivedBy: order.receivedBy || "",
    status: order.status as "approved" | "received",
    requestedAmount: order.requestedAmount,
  }));

  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Receive Delivery</h1>
        <p className="text-sm text-gray-600">
          Receive approved chemical deliveries sent successfully to providers.
        </p>
      </div>

      <ReceiveDeliveryTable orders={serializedOrders} />
    </main>
  );
}
