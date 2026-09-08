"use client";

import React from "react";

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
}: OTPInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newValue =
      value.substring(0, index) + val + value.substring(index + 1);

    onChange(newValue);

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          maxLength={1}
          inputMode="numeric"
          className="
            h-12 w-12
            text-center text-lg font-semibold
            rounded-xl
            bg-white/5
            border border-white/10
            text-white
            focus:border-blue-500
            focus:ring-2 focus:ring-blue-500/30
            outline-none
            transition
          "
        />
      ))}
    </div>
  );
}
