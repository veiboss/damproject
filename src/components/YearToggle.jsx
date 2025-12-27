import React from "react";

export default function YearToggle({ value, onChange }) {
  const years = ["1", "2", "3", "4"];

  return (
    <div className="inline-flex rounded-xl bg-white/10 border border-white/10 overflow-hidden">
      {years.map((y) => {
        const active = value === y;
        return (
          <button
            key={y}
            onClick={() => onChange(y)}
            className={[
              "px-5 py-3 text-sm transition",
              active
                ? "!bg-yellow-300 !text-slate-900"
                : "bg-white/5 text-white hover:bg-white/10",
            ].join(" ")}
          >
            {y}학년
          </button>
        );
      })}
    </div>
  );
}
