import React, { useState, useEffect } from "react";
import { Input } from "./Input";

export const CurrencyInput = React.forwardRef(({ value, onChange, placeholder, ...props }, ref) => {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === undefined || value === null || value === "") {
      setDisplayValue("");
    } else if (Number(value) !== Number(displayValue.replace(/,/g, ""))) {
      // Only format if the values actually differ to avoid cursor jumping issues while typing
      setDisplayValue(Number(value).toLocaleString("en-US"));
    }
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Strip everything except numbers (assuming ETB usually has whole numbers, but we'll allow decimals just in case)
    let rawValue = inputValue.replace(/[^0-9.]/g, "");
    
    // Prevent multiple decimals
    const parts = rawValue.split(".");
    if (parts.length > 2) {
      rawValue = parts[0] + "." + parts.slice(1).join("");
    }

    if (rawValue) {
      const splitParts = rawValue.split(".");
      // Only format the integer part
      const formattedInt = Number(splitParts[0]).toLocaleString("en-US");
      const formattedFinal = splitParts.length > 1 ? `${formattedInt}.${splitParts[1]}` : formattedInt;
      
      setDisplayValue(formattedFinal);
      
      // Pass the raw numeric value up to react-hook-form
      onChange(Number(rawValue));
    } else {
      setDisplayValue("");
      onChange(""); // Clear the value
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder || "0"}
      ref={ref}
      {...props}
    />
  );
});

CurrencyInput.displayName = "CurrencyInput";
