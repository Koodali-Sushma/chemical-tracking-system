"use client";

import { useState } from "react";
import {
  grantAccess,
  rejectAccess,
  revokeAccess,
} from "@/app/(dashboard)/actions/adminAccess";

interface RequestItem {
  _id: string;
  userEmail: string;
  scientistName: string;
  chemicalName: string;
  formula: string;
  status: string;
  createdAt: string;
}

export default function AdminAccessTable({
  requests,
}: {
  requests: RequestItem[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleGrant = async (id: string, email: string, formula: string) => {
    setLoadingId(id);
    try {
      await grantAccess(id, email, formula);
    } catch (error) {
      console.error("Failed to grant access:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      await rejectAccess(id);
    } catch (error) {
      console.error("Failed to reject access:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRevoke = async (email: string, formula: string, id: string) => {
    setLoadingId(id);
    try {
      await revokeAccess(email, formula);
    } catch (error) {
      console.error("Failed to revoke access:", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Scientist Name</th>
              <th className="p-4">Chemical Name</th>
              <th className="p-4">Chemical Formula</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-sm">
            {requests.map((req) => {
              const isLoading = loadingId === req._id;

              return (
                <tr key={req._id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4 text-slate-300 text-xs font-mono whitespace-nowrap">
                    {req.createdAt}
                  </td>
                  <td className="p-4 font-semibold text-white">
                    {req.scientistName}
                  </td>
                  <td className="p-4 font-semibold text-white">
                    {req.chemicalName}
                  </td>
                  <td className="p-4 font-mono text-emerald-400">
                    {req.formula}
                  </td>
                  <td className="p-4">
                    {/* Status Badge Column */}
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase ${
                        req.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : req.status === "rejected"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {/* Actions Column */}
                    {req.status === "pending" ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            handleGrant(req._id, req.userEmail, req.formula)
                          }
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs"
                        >
                          {isLoading ? "Saving..." : "Grant"}
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 disabled:opacity-50 text-red-400 font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs"
                        >
                          {isLoading ? "Saving..." : "Reject"}
                        </button>
                      </div>
                    ) : req.status === "approved" ? (
                      <button
                        onClick={() =>
                          handleRevoke(req.userEmail, req.formula, req._id)
                        }
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow transition active:scale-[0.98] cursor-pointer text-xs"
                      >
                        {isLoading ? "Processing..." : "Revoke Access"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        Resolved
                      </span>
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
