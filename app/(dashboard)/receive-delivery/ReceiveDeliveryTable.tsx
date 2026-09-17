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
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 shadow-lg">
        No approved deliveries are available.
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4">Chemical Name</th>
              <th className="p-4">Chemical Formula</th>
              <th className="p-4">Chemical Provider</th>
              <th className="p-4">Requested By</th>
              <th className="p-4">Received By</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/60 text-sm">
            {orders.map((order) => {
              const isReceived = order.status === "received";
              const isLoading = loadingId === order._id;
              const message = messages[order._id];

              return (
                <tr
                  key={order._id}
                  className="hover:bg-slate-700/30 transition"
                >
                  <td className="p-4 font-semibold text-white">
                    {order.chemicalName}
                  </td>

                  <td className="p-4 font-mono text-emerald-400">
                    {order.chemicalFormula}
                  </td>

                  <td className="p-4 text-slate-300">{order.providerName}</td>

                  <td className="p-4 text-slate-300">{order.requestedBy}</td>

                  <td className="p-4 text-slate-300">
                    {order.receivedBy || "Not received"}
                  </td>

                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => handleReceive(order._id)}
                      disabled={isReceived || isLoading}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs"
                    >
                      {isReceived
                        ? "Delivery received"
                        : isLoading
                          ? "Processing..."
                          : "Receive delivery"}
                    </button>

                    {message && (
                      <p className="mt-2 text-xs text-emerald-400">{message}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
