"use client";

interface ListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

export function ListEditor({
  items,
  onChange,
  label,
  placeholder = "",
  multiline = false,
}: ListEditorProps) {
  function updateItem(index: number, value: string) {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[var(--cyber-accent)]">
        {label}
      </span>

      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="font-mono text-[11px] text-[var(--cyber-muted)] pt-2 min-w-[24px] text-right">
            {String(i + 1).padStart(2, "0")}
          </span>

          {multiline ? (
            <textarea
              className="cyber-textarea flex-1"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={placeholder}
              rows={3}
            />
          ) : (
            <input
              type="text"
              className="cyber-input flex-1"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={placeholder}
            />
          )}

          <button
            type="button"
            className="cyber-btn-sm danger mt-1"
            onClick={() => removeItem(i)}
          >
            DEL
          </button>
        </div>
      ))}

      <button type="button" className="cyber-btn-sm accent self-start" onClick={addItem}>
        + ADD
      </button>
    </div>
  );
}
