import React from "react";
import { Search } from "lucide-react";
import { Input } from "./Input";

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  size = "sm",
  ...props
}) => {
  return (
    <Input
      type="text"
      leftIcon={Search}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size={size}
      className={className}
      {...props}
    />
  );
};
