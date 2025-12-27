import React from "react";

export default function GradeRow({ options, value, onChange }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex gap-2 min-w-max">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={[
                "px-3 py-2 rounded-lg text-xs border whitespace-nowrap transition",
                active
                  ? "!bg-yellow-300 !text-slate-900 !border-yellow-300"
                  : "bg-white/5 text-white border-white/10 hover:bg-white/10",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
