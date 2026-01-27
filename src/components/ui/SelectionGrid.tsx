"use client";

import { cn } from "@/lib/utils";
import type { SelectionOption } from "@/lib/types";

interface SelectionGridProps {
  options: SelectionOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  columns?: 2 | 3;
  label?: string;
}

export function SelectionGrid({
  options,
  selectedValue,
  onSelect,
  columns = 3,
  label,
}: SelectionGridProps) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div
        className={cn(
          "grid gap-3",
          columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
        )}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          return (
            <button
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.value)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                isSelected
                  ? "border-green-600 bg-green-50 text-green-800 shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50"
              )}
            >
              <span className="font-semibold">{option.label}</span>
              {option.description && (
                <span className="mt-1 text-sm text-gray-500">
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
