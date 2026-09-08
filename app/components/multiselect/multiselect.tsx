"use client";

import React from "react";
import { Check, ChevronDown } from "@gravity-ui/icons";

type Option = {
  id: string;
  label: string;
};

type MultiSelectProps = {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  maxHeight?: number;
};

export default function MultiSelect({
  label,
  placeholder = "Select...",
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  maxHeight = 210,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dropdownPosition, setDropdownPosition] = React.useState<"top" | "bottom">("bottom");
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listboxRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const allSelected = options.length > 0 && options.every((opt) => value.includes(opt.id));
  const someSelected = value.length > 0 && !allSelected;

  const displayText = React.useMemo(() => {
    if (loading) return "Loading...";
    if (value.length === 0) return placeholder;
    if (allSelected) return "All selected";

    const selectedLabels = value
      .map((id) => options.find((o) => o.id === id)?.label)
      .filter(Boolean);

    if (selectedLabels.length < 2) return selectedLabels.join(" + ");
    return `${selectedLabels.length} selected`;
  }, [value, options, placeholder, loading, allSelected]);

  const calculatePosition = React.useCallback(() => {
    if (!buttonRef.current || !open) return;
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const optionHeight = 44;
    const headerHeight = 56;
    const footerHeight = 50;
    const padding = 16;

    let estimatedHeight = filteredOptions.length * optionHeight + headerHeight + padding;
    if (value.length > 0) estimatedHeight += footerHeight;

    const actualHeight = Math.min(estimatedHeight, maxHeight);

    const neededSpace = actualHeight + 16; 
    const canFitBelow = spaceBelow >= neededSpace;
    const canFitAbove = spaceAbove >= neededSpace;

    if (canFitBelow) {
      setDropdownPosition("bottom");
    } else if (canFitAbove) {
      setDropdownPosition("top");
    } else {
      setDropdownPosition(spaceBelow >= spaceAbove ? "bottom" : "top");
    }
  }, [open, filteredOptions.length, value.length, maxHeight]);

  React.useLayoutEffect(() => {
    if (open) {
      calculatePosition();
    }
  }, [open, calculatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const handleUpdate = () => calculatePosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [open, calculatePosition]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        return;
      }

      if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        e.preventDefault();
        const option = filteredOptions[focusedIndex];
        if (option) toggleOption(option.id);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredOptions, focusedIndex]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  React.useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  const toggleOption = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  };

  const clearAll = () => {
    onChange([]);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  const toggleOpen = () => {
    if (!disabled && !loading) {
      setOpen((prev) => !prev);
      if (!open) {
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    }
  };

  const getMaxHeight = () => {
    if (!buttonRef.current) return maxHeight;
    const rect = buttonRef.current.getBoundingClientRect();
    const available = dropdownPosition === "bottom"
      ? window.innerHeight - rect.bottom - 16
      : rect.top - 16;
    return Math.min(maxHeight, Math.max(100, available));
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0 flex-1">
      {label && <label className="mb-2 block text-sm font-medium">{label}</label>}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || loading}
        onClick={toggleOpen}
        className={[
          "flex h-9 w-full items-center justify-between",
          "rounded-xl border border-default-200",
          "bg-default-50 dark:bg-default-900",
          "px-4 text-left text-sm",
          "transition-all duration-200",
          "hover:border-default-400",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          disabled || loading ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        <span className={value.length === 0 ? "text-default-400" : "text-default-foreground"}>
          {displayText}
        </span>
        <ChevronDown className={["size-4 transition-transform duration-200", open ? "rotate-180" : ""].join(" ")} />
      </button>

      {open && !disabled && !loading && (
        <div
          ref={dropdownRef}
          className={[
            "absolute left-0 right-0 z-50",
            "overflow-hidden rounded-xl",
            "border border-default-200",
            "bg-background",
            "shadow-lg",
            "animate-in fade-in zoom-in-95 duration-150",
            dropdownPosition === "top"
              ? "bottom-full mb-2 origin-bottom"
              : "top-full mt-2 origin-top",
          ].join(" ")}
          style={{ maxHeight: getMaxHeight(), display: "flex", flexDirection: "column" }}
        >
          {options.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className={[
                "flex w-full items-center gap-3 border-b border-default-200 px-3 py-2.5",
                "text-left text-sm font-medium transition-colors duration-150",
                "hover:bg-default-100 dark:hover:bg-default-800",
                "cursor-pointer"
              ].join(" ")}
            >
              <span
                className={[
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                  allSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : someSelected
                    ? "border-primary bg-primary/20"
                    : "border-default-300",
                ].join(" ")}
              >
                {allSelected && <Check className="size-3.5" />}
                {someSelected && <span className="h-0.5 w-2.5 rounded-full bg-primary" />}
              </span>
              <span className="flex-1">{allSelected ? "Deselect all" : "Select all"}</span>
              <span className="text-xs text-default-400">
                {value.length}/{options.length}
              </span>
            </button>
          )}

          <div ref={listboxRef} className="flex-1 overflow-y-auto p-1" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-default-400">
                {searchTerm ? "No matches" : "No options"}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const selected = value.includes(option.id);
                const focused = focusedIndex === index;

                return (
                  <button
                    key={option.id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggleOption(option.id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={[
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm",
                      "transition-all duration-150",
                      focused ? "bg-default-100 dark:bg-default-800" : "",
                      selected ? "bg-default-100 dark:bg-default-800" : "",
                      "hover:bg-default-100 dark:hover:bg-default-800",
                      "cursor-pointer"
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-default-300",
                      ].join(" ")}
                    >
                      {selected && <Check className="size-3.5" />}
                    </span>
                    <span className="flex-1">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {value.length > 0 && (
            <div className="flex items-center justify-between border-t border-default-200 px-3 py-2">
              <span className="text-xs text-default-500">{value.length} selected</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-danger hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}