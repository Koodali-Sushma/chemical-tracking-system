"use client";

import React, { useState } from "react";
import {
  approveChemicalOrder,
  rejectChemicalOrder,
} from "@/app/(dashboard)/actions/chemicalOrders";

interface AdminOrderRow {
  _id: string;
  chemicalFormula: string;
  chemicalName: string;
  providerId: string;
  providerName: string;
  requestedBy: string;
  requestedAmount: number;
  status: "pending" | "approved" | "rejected" | "received";
  createdAt: string;
}

interface AdminOrderTableProps {
  orders: AdminOrderRow[];
}

export default function AdminOrderTable({ orders }: AdminOrderTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{
    [key: string]: { text: string; isError: boolean };
  }>({});

  const handleApprove = async (orderId: string) => {
    setLoadingId(orderId);
    setMessages((prev) => ({
      ...prev,
      [orderId]: { text: "", isError: false },
    }));

    try {
      await approveChemicalOrder(orderId);
      setMessages((prev) => ({
        ...prev,
        [orderId]: { text: "Order approved successfully.", isError: false },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Approval failed.";
      setMessages((prev) => ({
        ...prev,
        [orderId]: { text: errorMessage, isError: true },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setLoadingId(orderId);
    setMessages((prev) => ({
      ...prev,
      [orderId]: { text: "", isError: false },
    }));

    try {
      await rejectChemicalOrder(orderId);
      setMessages((prev) => ({
        ...prev,
        [orderId]: { text: "Order rejected.", isError: false },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Rejection failed.";
      setMessages((prev) => ({
        ...prev,
        [orderId]: { text: errorMessage, isError: true },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center text-slate-400 shadow-lg">
        No chemical order requests found in the system.
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4">Request Date</th>
              <th className="p-4">Chemical Name</th>
              <th className="p-4">Formula</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Requested By</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-sm">
            {orders.map((order) => {
              const isPending = order.status === "pending";
              const isLoading = loadingId === order._id;
              const message = messages[order._id];

              return (
                <tr
                  key={order._id}
                  className="hover:bg-slate-700/30 transition"
                >
                  <td className="p-4 text-slate-300 text-xs font-mono">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-semibold text-white">
                    {order.chemicalName}
                  </td>
                  <td className="p-4 font-mono text-emerald-400">
                    {order.chemicalFormula}
                  </td>
                  <td className="p-4 text-slate-300">{order.providerName}</td>
                  <td className="p-4 text-slate-300 text-xs">
                    {order.requestedBy}
                  </td>
                  <td className="p-4 font-bold text-slate-200">
                    {order.requestedAmount}L
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs uppercase tracking-wider ${
                        order.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : order.status === "approved"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : order.status === "received"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end space-y-1">
                      {isPending ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(order._id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs"
                          >
                            {isLoading ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(order._id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 disabled:opacity-50 text-red-400 font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs"
                          >
                            {isLoading ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Resolved
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
