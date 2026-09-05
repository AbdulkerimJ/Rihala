import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const GoToLink = ({ to, children, className = "" }) => {
  return (
    <Link 
      to={to} 
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 hover:underline transition-colors ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
};
