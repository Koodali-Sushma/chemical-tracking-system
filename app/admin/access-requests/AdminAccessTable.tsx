"use client";

import { useState } from "react";
import { grantAccess, rejectAccess } from "@/app/actions/adminAccess";

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

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm uppercase">
          <tr>
            <th className="p-4 font-semibold border-r border-gray-200">
              Timestamp
            </th>
            <th className="p-4 font-semibold border-r border-gray-200">
              Scientist Name
            </th>
            <th className="p-4 font-semibold border-r border-gray-200">
              Chemical Name
            </th>
            <th className="p-4 font-semibold border-r border-gray-200">
              Chemical Formula
            </th>
            <th className="p-4 font-semibold border-r border-gray-200">
              Status
            </th>
            <th className="p-4 font-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {requests.map((req) => {
            const isLoading = loadingId === req._id;

            return (
              <tr key={req._id} className="hover:bg-gray-50 transition">
                <td className="p-4 text-gray-600 border-r border-gray-200 whitespace-nowrap">
                  {req.createdAt}
                </td>
                <td className="p-4 font-medium text-gray-900 border-r border-gray-200">
                  {req.scientistName}
                </td>
                <td className="p-4 font-medium text-gray-900 border-r border-gray-200">
                  {req.chemicalName}
                </td>
                <td className="p-4 font-medium text-gray-900 border-r border-gray-200">
                  {req.formula}
                </td>
                <td className="p-4 border-r border-gray-200">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase ${
                      req.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : req.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {req.status === "pending" ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          handleGrant(req._id, req.userEmail, req.formula)
                        }
                        disabled={isLoading}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {isLoading ? "Saving..." : "Grant"}
                      </button>
                      <button
                        onClick={() => handleReject(req._id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {isLoading ? "Saving..." : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
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
  );
}
