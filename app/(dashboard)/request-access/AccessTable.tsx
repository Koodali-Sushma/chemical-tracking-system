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
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm uppercase">
          <tr>
            <th className="p-4 font-semibold border-r border-gray-200">
              Chemical
            </th>
            <th className="p-4 font-semibold text-center">Access Request</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {chemicals.map((chem) => {
            const hasAccess = ownedSet.has(chem.formula);
            const status = requestMap.get(chem.formula);
            const isPending = status === "pending";
            const isLoading = loadingFormula === chem.formula;

            return (
              <tr key={chem._id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-900 border-r border-gray-200">
                  {chem.name}{" "}
                  <span className="text-gray-500 font-normal">
                    ({chem.formula})
                  </span>
                </td>
                <td className="p-4 text-center">
                  {hasAccess ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Access Granted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAction(chem.formula, isPending)}
                      disabled={isLoading}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition disabled:opacity-50 ${
                        isPending
                          ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
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
  );
}
