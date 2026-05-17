"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
};

export default function TagInput({ value, onChange, suggestions }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = input.trim() === ""
    ? suggestions.filter((s) => !value.includes(s))
    : suggestions.filter(
        (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
      );

  function addTag(name: string) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
    setOpen(false);
  }

  function removeTag(name: string) {
    onChange(value.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 rounded-md border border-stone-300 px-3 py-2 focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-500 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-stone-400 hover:text-stone-700 leading-none"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Ajouter des tags..." : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-stone-700 placeholder:text-stone-400 outline-none"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-stone-200 bg-white shadow-md">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => addTag(s)}
              className="cursor-pointer px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
