"use client";

import { useState } from "react";
import {
  requestChemicalAccess,
  cancelChemicalAccess,
} from "@/app/(dashboard)/actions/access";

interface Chemical {
  _id: string;
  name: string;
  formula: string;
}

interface RequestItem {
  formula: string;
  status: string;
}

export default function AccessTable({
  chemicals,
  userRequests,
  activeFormulas,
}: {
  chemicals: Chemical[];
  userRequests: RequestItem[];
  activeFormulas: string[];
}) {
  const [loadingFormula, setLoadingFormula] = useState<string | null>(null);

  // Map existing requests for fast lookup by formula
  const requestMap = new Map(
    userRequests.map((req) => [req.formula, req.status]),
  );
  const ownedSet = new Set(activeFormulas);

  const handleAction = async (formula: string, isRequested: boolean) => {
    setLoadingFormula(formula);
    try {
      if (isRequested) {
        await cancelChemicalAccess(formula);
      } else {
        await requestChemicalAccess(formula);
      }
    } catch (error) {
      console.error("Failed to update access request:", error);
    } finally {
      setLoadingFormula(null);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="p-4">Chemical</th>
              <th className="p-4 text-center">Access Request</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 text-sm">
            {chemicals.map((chem) => {
              const hasAccess = ownedSet.has(chem.formula);
              const status = requestMap.get(chem.formula);
              const isPending = status === "pending";
              const isLoading = loadingFormula === chem.formula;

              return (
                <tr key={chem._id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4 font-semibold text-white">
                    {chem.name}{" "}
                    <span className="text-slate-400 font-normal">
                      ({chem.formula})
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {hasAccess ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold">
                        Access Granted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAction(chem.formula, isPending)}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow transition active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                          isPending
                            ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                            : "bg-emerald-500 text-slate-950 hover:bg-emerald-600"
                        }`}
                      >
                        {isLoading
                          ? "Processing..."
                          : isPending
                            ? "Cancel Request"
                            : "Request Access"}
                      </button>
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
