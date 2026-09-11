"use client";

import React, { useEffect, useState, useRef } from "react";

interface ChemicalItem {
  _id: string;
  name: string;
  formula: string;
  nodeStock: number;
  mainStock: number;
  maxCapacity?: number;
}

interface SimulatorClientProps {
  chemicals: ChemicalItem[];
  role: string;
}
const formatLiters = (value: number) => Number(value.toFixed(3)).toString();

export default function SimulatorClient({
  chemicals,
  role,
}: SimulatorClientProps) {
  const [stockLevels, setStockLevels] = useState<{ [key: string]: number }>(
    Object.fromEntries(chemicals.map((c) => [c._id, c.nodeStock ?? 0])),
  );

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        window.location.reload();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const [cupContentMls, setCupContentMls] = useState<{ [key: string]: number }>(
    Object.fromEntries(chemicals.map((c) => [c._id, 0])),
  );

  const [targetVolume, setTargetVolume] = useState<number>(10);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [dispensingChemId, setDispensingChemId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeChemical = chemicals[activeIndex] || chemicals[0];

  const currentStockLiters = activeChemical
    ? (stockLevels[activeChemical._id] ?? activeChemical.nodeStock ?? 0)
    : 0;

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const itemWidth = scrollContainerRef.current.offsetWidth;
      const index = Math.round(scrollLeft / itemWidth);
      if (index >= 0 && index < chemicals.length) {
        setActiveIndex(index);
      }
    }
  };

  const triggerDispense = async () => {
    if (!activeChemical) return;
    const chemId = activeChemical._id;
    const dispenseAmountL = targetVolume / 1000;

    if (currentStockLiters < dispenseAmountL) {
      alert("Insufficient node stock for this volume!");
      return;
    }

    setDispensingChemId(chemId);

    try {
      const response = await fetch("/api/simulator/dispense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chemicalId: chemId,
          amount: dispenseAmountL,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Dispense failed");
      }

      setStockLevels((prev) => ({
        ...prev,
        [chemId]: result.nodeStock,
      }));

      setCupContentMls((prev) => ({
        ...prev,
        [chemId]: Math.min(50, (prev[chemId] || 0) + targetVolume),
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Dispense failed");
    } finally {
      setDispensingChemId(null);
    }
  };
  const triggerRefill = async () => {
    if (!activeChemical) return;

    const chemId = activeChemical._id;
    setDispensingChemId(chemId);

    try {
      const response = await fetch("/api/simulator/refill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chemicalId: chemId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Refill failed");
      }

      setStockLevels((previous) => ({
        ...previous,
        [chemId]: result.nodeStock,
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Refill failed");
    } finally {
      setDispensingChemId(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-700 flex flex-col items-center max-w-xl mx-auto">
      {/* Main Single Card Wrapper */}
      <div className="w-full bg-slate-800/80 rounded-3xl border border-slate-700 p-6 flex flex-col items-center shadow-xl relative">
        {/* Scroll Buttons Placed on Either Side of the Horizontal Scroll Panel */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-[-18px] top-[42%] -translate-y-1/2 w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-200 transition cursor-pointer shadow-xl z-30"
          aria-label="Scroll Left"
        >
          ‹
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-[-18px] top-[42%] -translate-y-1/2 w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-200 transition cursor-pointer shadow-xl z-30"
          aria-label="Scroll Right"
        >
          ›
        </button>

        {/* Scrollable Unit containing only the bottles and cups */}
        {chemicals.length > 0 && (
          <div className="w-full relative mb-6">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto pb-2 pt-2 scrollbar-none snap-x snap-mandatory focus:outline-none w-full"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {chemicals.map((chem) => {
                const chemMaxCapacity = chem.maxCapacity || 5.0;
                const chemStockLiters =
                  stockLevels[chem._id] ?? chem.nodeStock ?? 0;
                const cupContentMl = cupContentMls[chem._id] || 0;
                const isThisDispensing = dispensingChemId === chem._id;

                const bottlePercentage = Math.min(
                  100,
                  Math.max(0, (chemStockLiters / chemMaxCapacity) * 100),
                );
                const rawCupPercentage = (cupContentMl / 50) * 100;
                const cupPercentage =
                  cupContentMl > 0 ? Math.max(12, rawCupPercentage) : 0;

                return (
                  <div
                    key={chem._id}
                    className="flex-shrink-0 w-full flex flex-col items-center snap-center"
                  >
                    {/* Rig Simulation Area */}
                    <div className="flex items-end justify-center space-x-1 relative w-full h-64 bg-slate-950/50 rounded-2xl border border-slate-700/60 p-6">
                      {/* Current Stock Badge */}
                      <div className="absolute top-4 left-4 bg-slate-800/90 border border-slate-600 text-emerald-300 font-extrabold text-xs px-2.5 py-1.5 rounded-xl shadow-md z-30">
                        Stock: {formatLiters(chemStockLiters)}L /{" "}
                        {formatLiters(chemMaxCapacity)}L
                      </div>

                      {/* Cylinder Container Area */}
                      <div className="relative flex flex-col items-center">
                        {/* Cylinder Lid / Cap */}
                        <div className="flex flex-col items-center z-20 mb-[-2px]">
                          <div className="w-5 h-2 bg-slate-400 rounded-t-md"></div>
                          <div className="w-24 h-3.5 bg-slate-500 rounded-md shadow-md border-t border-slate-400"></div>
                        </div>

                        {/* Side Tap Spout */}
                        <div className="absolute right-[-24px] bottom-10 w-10 h-4 bg-slate-400 rounded-r-lg z-20 flex items-center justify-end pr-1 shadow-md border border-slate-500">
                          <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                        </div>

                        {/* Flowing Chemical Droplets Stream */}
                        {isThisDispensing && (
                          <div
                            className="absolute right-[-16px] bottom-2 w-2 h-10 rounded-full z-30 shadow-[0_0_10px_#6ee7b7]"
                            style={{
                              background:
                                "repeating-linear-gradient(to bottom, #6ee7b7 0px, #6ee7b7 7px, rgba(110, 231, 183, 0.25) 7px, rgba(110, 231, 183, 0.25) 14px)",
                              animation: "dropFlow 2s linear infinite",
                            }}
                          />
                        )}

                        {/* Cylinder Body */}
                        <div
                          className="relative w-32 h-48 bg-slate-800/40 rounded-b-2xl border-x-[6px] border-b-[6px] border-slate-500 overflow-hidden flex flex-col justify-end shadow-inner z-10"
                          style={{
                            borderTopLeftRadius: "1.5rem",
                            borderTopRightRadius: "1.5rem",
                          }}
                        >
                          <div
                            className="w-full bg-emerald-300/80 transition-all duration-500 relative flex items-center justify-center"
                            style={{ height: `${bottlePercentage}%` }}
                          >
                            <div className="absolute top-0 w-full h-2 bg-white/40"></div>
                          </div>

                          {/* Name Board Plaque */}
                          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white/95 text-slate-900 py-1 px-1 rounded-md text-center shadow border border-slate-300 pointer-events-none z-30">
                            <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                              Compound
                            </span>
                            <span className="text-[11px] font-black tracking-tight">
                              {chem.name} ({chem.formula})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Smaller Glass Cup Container */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-8 bg-slate-200/10 rounded-b-lg border-x-2 border-b-2 border-slate-400 overflow-hidden flex flex-col justify-end shadow-inner backdrop-blur-sm">
                          <div className="absolute left-1 top-1 w-0.5 h-4 bg-white/20 rounded-full"></div>
                          <div
                            className="w-full bg-emerald-300/90 transition-all duration-500 relative flex items-center justify-center"
                            style={{ height: `${cupPercentage}%` }}
                          >
                            <span className="absolute bottom-0.5 text-slate-950 font-bold text-[8px] bg-white/90 px-0.5 rounded scale-90">
                              {cupContentMl.toFixed(1)} ml
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Volume Slider placed just above the single dispense button */}
        <div className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-inner mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 font-medium">
              Target Dispense Volume
            </span>
            <span className="text-emerald-400 font-bold">
              {targetVolume} ml
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="50"
            step="0.5"
            value={targetVolume}
            onChange={(e) => setTargetVolume(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        {/* Single Global Dispense Button */}
        {role === "scientist" && activeChemical && currentStockLiters <= 0 && (
          <p className="mb-3 text-sm font-semibold text-red-400">
            No stock available
          </p>
        )}
        {role === "lab_technician" &&
          activeChemical &&
          currentStockLiters < 1 &&
          activeChemical.mainStock > 0 && (
            <p className="mb-3 text-sm font-semibold text-yellow-600">
              Node stock is low. Refill required.
            </p>
          )}
        {role === "scientist" && (
          <button
            onClick={triggerDispense}
            disabled={
              dispensingChemId !== null ||
              !activeChemical ||
              currentStockLiters <= 0 ||
              currentStockLiters < targetVolume / 1000
            }
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition active:scale-[0.98] cursor-pointer"
          >
            {dispensingChemId !== null
              ? "Dispensing..."
              : `Dispense ${activeChemical ? activeChemical.name : "Compound"}`}
          </button>
        )}
        {role === "lab_technician" && activeChemical && (
          <button
            onClick={triggerRefill}
            disabled={
              dispensingChemId !== null ||
              currentStockLiters >= 5 ||
              activeChemical.mainStock <= 0
            }
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition cursor-pointer"
          >
            {dispensingChemId !== null ? "Refilling..." : "Refill Node"}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes dropFlow {
          0% {
            background-position-y: 0px;
          }
          100% {
            background-position-y: 20px;
          }
        }
      `}</style>
    </div>
  );
}
