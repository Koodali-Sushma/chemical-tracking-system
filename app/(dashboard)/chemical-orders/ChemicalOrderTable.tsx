"use client";

import { useState } from "react";
import { createChemicalOrder } from "@/app/(dashboard)/actions/chemicalOrders";
import { formatNumber } from "@/lib/formatNumber";

interface ChemicalOrderRow {
  _id: string;
  orderId?: string;
  name: string;
  formula: string;
  mainStock: number;
  providerId: string;
  providerName: string;
  providerEmail: string;
  orderStatus: "none" | "pending" | "approved" | "received" | "rejected";
}

interface ChemicalOrderTableProps {
  chemicals: ChemicalOrderRow[];
}

export default function ChemicalOrderTable({
  chemicals,
}: ChemicalOrderTableProps) {
  const [loadingChemId, setLoadingChemId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{
    [key: string]: { text: string; isError: boolean };
  }>({});

  const handleOrder = async (chem: ChemicalOrderRow) => {
    setLoadingChemId(chem._id);
    setMessages((prev) => ({
      ...prev,
      [chem._id]: { text: "", isError: false },
    }));

    try {
      const requestedAmount = 15;
      await createChemicalOrder(chem._id, chem.providerId, requestedAmount);
      setMessages((prev) => ({
        ...prev,
        [chem._id]: {
          text: "Order request created successfully.",
          isError: false,
        },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      setMessages((prev) => ({
        ...prev,
        [chem._id]: { text: errorMessage, isError: true },
      }));
    } finally {
      setLoadingChemId(null);
    }
  };

  if (chemicals.length === 0) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 shadow-lg">
        All chemical main stocks are currently at safe operating levels.
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
              <th className="p-4">Formula</th>
              <th className="p-4">Main Stock</th>
              <th className="p-4">Provider Name</th>
              <th className="p-4">Provider Email</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-sm">
            {chemicals.map((chem) => {
              const hasProvider = Boolean(chem.providerId);
              const isLoading = loadingChemId === chem._id;
              const message = messages[chem._id];
              const status = chem.orderStatus;

              return (
                <tr key={chem._id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4 font-semibold text-white">{chem.name}</td>
                  <td className="p-4 font-mono text-emerald-400">
                    {chem.formula}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-bold text-xs">
                      {formatNumber(chem.mainStock)}L
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">
                    {hasProvider ? (
                      chem.providerName
                    ) : (
                      <span className="text-amber-400 text-xs font-medium">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-300">
                    {hasProvider ? chem.providerEmail : "—"}
                  </td>
                  <td className="p-4 text-right">
                    {" "}
                    <div className="flex flex-col items-end space-y-1">
                      {hasProvider ? (
                        status === "pending" ? (
                          <p className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 font-bold rounded-xl text-xs cursor-not-allowed">
                            Order requested
                          </p>
                        ) : status === "approved" ? (
                          <p className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs">
                            Order approved
                          </p>
                        ) : status === "received" ? (
                          <p className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs cursor-not-allowed">
                            Order received
                          </p>
                        ) : (
                          <button
                            onClick={() => handleOrder(chem)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs"
                          >
                            {isLoading ? "Ordering..." : "Request order"}
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-red-400 font-semibold block max-w-[220px] text-right">
                          No active provider assigned!
                        </span>
                      )}

                      {message && message.text && (
                        <span
                          className={`text-xs font-medium ${
                            message.isError
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {message.text}
                        </span>
                      )}
                    </div>
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
