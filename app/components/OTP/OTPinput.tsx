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

  const handleChange = (index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    const next = value.split("");
    next[index] = digit;

    const newValue = next.join("").slice(0, length);
    onChange(newValue);

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        const next = value.split("");
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    onChange(pasted);

    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        width: "100%",
      }}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          className="otp-input"
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          style={{
            display: "block",
            width: "48px",
            height: "52px",
            minWidth: "48px",
            border: "2px solid #64748b",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            color: "#111827",
            fontSize: "22px",
            fontWeight: 700,
            textAlign: "center",
            outline: "none",
            padding: 0,
            opacity: 1,
            WebkitTextFillColor: "#111827",
            caretColor: "#2563eb",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(37, 99, 235, 0.2)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#64748b";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      ))}
    </div>
  );
}
