import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./Button";

export const BackButton = ({ className = "", fallback, ...props }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Navigate back one step
    navigate(-1);
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={handleBack}
      className={`rounded-xl border-border/60 shadow-sm bg-surface/50 hover:bg-main ${className}`}
      title="Go back"
      aria-label="Go back"
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
};
