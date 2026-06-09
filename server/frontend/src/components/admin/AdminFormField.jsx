import React from "react";

const inputClass = (hasError, readOnly = false) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
    hasError ? "border-red-500" : "border-slate-300"
  } ${readOnly ? "bg-slate-100 text-slate-600 cursor-not-allowed" : ""}`;

const AdminFormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  readOnly = false,
  as = "input",
  options = [],
  disabled = false,
  hint,
}) => {
  const fieldId = name || label;

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>

      {as === "select" ? (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled || readOnly}
          className={inputClass(error, readOnly)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className={inputClass(error, readOnly)}
        />
      )}

      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default AdminFormField;
