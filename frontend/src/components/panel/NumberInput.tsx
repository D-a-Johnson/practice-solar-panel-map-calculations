type NumberInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  step?: number;
};

export function NumberInput({
  label,
  value,
  onChange,
  min,
  step = 1,
}: NumberInputProps) {
  return (
    <label className="flex flex-col text-xs text-slate-600">
      {label}
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
      />
    </label>
  );
}
