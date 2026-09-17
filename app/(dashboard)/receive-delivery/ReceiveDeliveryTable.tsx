"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { receiveChemicalOrder } from "@/app/(dashboard)/actions/chemicalOrders";

interface ReceiveDeliveryOrder {
  _id: string;
  chemicalName: string;
  chemicalFormula: string;
  providerName: string;
  requestedBy: string;
  receivedBy: string;
  requestedAmount: number;
  status: "approved" | "received";
}

export default function ReceiveDeliveryTable({
  orders,
}: {
  orders: ReceiveDeliveryOrder[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function handleReceive(orderId: string) {
    setLoadingId(orderId);
    setMessages((current) => ({
      ...current,
      [orderId]: "",
    }));

    try {
      await receiveChemicalOrder(orderId);

      setMessages((current) => ({
        ...current,
        [orderId]: "Delivery received successfully.",
      }));

      router.refresh();
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [orderId]:
          error instanceof Error
            ? error.message
            : "Failed to receive delivery.",
      }));
    } finally {
      setLoadingId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow">
        No approved deliveries are available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
      <table className="w-full border-collapse text-left">
        <thead className="border-b bg-gray-100 text-sm uppercase text-gray-600">
          <tr>
            <th className="p-4">Chemical Name</th>
            <th className="p-4">Chemical Formula</th>
            <th className="p-4">Chemical Provider</th>
            <th className="p-4">Requested By</th>
            <th className="p-4">Received By</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 text-sm">
          {orders.map((order) => {
            const isReceived = order.status === "received";
            const isLoading = loadingId === order._id;
            const message = messages[order._id];

            return (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">
                  {order.chemicalName}
                </td>

                <td className="p-4 font-mono text-gray-700">
                  {order.chemicalFormula}
                </td>

                <td className="p-4 text-gray-700">{order.providerName}</td>

                <td className="p-4 text-gray-700">{order.requestedBy}</td>

                <td className="p-4 text-gray-700">
                  {order.receivedBy || "Not received"}
                </td>

                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => handleReceive(order._id)}
                    disabled={isReceived || isLoading}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isReceived
                      ? "Delivery received"
                      : isLoading
                        ? "Processing..."
                        : "Receive delivery"}
                  </button>

                  {message && (
                    <p className="mt-2 text-xs text-green-600">{message}</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
