"use client";
import { ToggleLeft, ToggleRight } from "lucide-react";

interface ToggleProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function Toggle({ active, onToggle, disabled }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {active
        ? <ToggleRight size={22} className="text-brand" />
        : <ToggleLeft size={22} className="text-dim" />}
    </button>
  );
}
