"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SimulatorClient({
  chemicals,
  role,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chemicals: any[];
  role: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(chemicals[0]?._id || "");
  const [amount, setAmount] = useState(0.5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedChemical = chemicals.find((c) => c._id === selectedId);

  const handleDispense = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/simulator/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chemicalId: selectedId,
          amount: Number(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(
        `Successfully dispensed ${amount}L. Remaining node stock: ${data.nodeStock}L`,
      );
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefill = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/simulator/refill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chemicalId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(
        `Node successfully refilled to 5L! Main stock left: ${data.mainStock}L`,
      );
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (chemicals.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border text-center text-gray-600">
        <p>No chemicals available or assigned to your account.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border space-y-6">
      {message && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm">
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Chemical
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          {chemicals.map((chem) => (
            <option key={chem._id} value={chem._id}>
              {chem.name} ({chem.formula}) — Node: {chem.nodeStock}L / 5L
            </option>
          ))}
        </select>
      </div>

      {selectedChemical && (
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border text-sm">
          <div>
            <span className="block text-gray-500">Node (Bottle) Level</span>
            <span
              className={`text-lg font-bold ${selectedChemical.nodeStock < 1 ? "text-red-600" : "text-green-600"}`}
            >
              {selectedChemical.nodeStock}L / 5L
            </span>
            {selectedChemical.nodeStock < 1 && (
              <span className="block text-xs text-red-500 mt-1 font-semibold">
                ⚠️ Stock below 1L! Needs Refill.
              </span>
            )}
          </div>
          <div>
            <span className="block text-gray-500">Main Stock Pool</span>
            <span className="text-lg font-bold text-gray-800">
              {selectedChemical.mainStock}L / 20L
            </span>
          </div>
        </div>
      )}

      {role === "scientist" && (
        <div className="space-y-4 pt-4 border-t">
          <h2 className="font-semibold text-lg">
            Scientist Action: Dispense Chemical
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Draw (Liters)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max={selectedChemical?.nodeStock || 5}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            onClick={handleDispense}
            disabled={
              loading || !selectedChemical || selectedChemical.nodeStock <= 0
            }
            className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Dispense Chemical"}
          </button>
        </div>
      )}

      {role === "lab_technician" && (
        <div className="space-y-4 pt-4 border-t">
          <h2 className="font-semibold text-lg">
            Lab Technician Action: Node Maintenance
          </h2>
          <p className="text-sm text-gray-600">
            Refill the 5L bottle node from the main stock pool when the node
            level drops below 1L.
          </p>
          <button
            onClick={handleRefill}
            disabled={
              loading || !selectedChemical || selectedChemical.nodeStock >= 5
            }
            className="w-full py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Refilling..." : "Refill Node to 5L"}
          </button>
        </div>
      )}
    </div>
  );
}
