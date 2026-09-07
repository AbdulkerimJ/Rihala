import { formatDate } from "../../../utils/formatters";
import { Link } from "react-router-dom";
import { Phone, User } from "lucide-react";
import { InfoBlock, InfoRow } from "../../../components/ui/InfoBlock";

export const OrderCustomerCard = ({ order, canReadCustomers = false }) => {
  return (
    <InfoBlock title="Customer Information" className="group relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="space-y-3 relative z-10">
        <InfoRow
          label="Customer Name"
          value={
            <span className="font-semibold text-primary">
              {order?.customer?.name || order?.customerName}
            </span>
          }
        />
        <InfoRow
          label="Phone Number"
          value={
            order?.customerPhone || order?.customer?.phone ? (
              <a
                href={`tel:${order?.customerPhone || order?.customer?.phone}`}
                className="text-accent hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {order?.customerPhone || order?.customer?.phone}
              </a>
            ) : (
              "-"
            )
          }
        />
        <InfoRow
          label="Agreement Date"
          value={formatDate(order?.date || order?.createdAt)}
        />
        <InfoRow
          label="Expected Delivery"
          value={
            <span className="font-semibold text-primary">
              {formatDate(order?.expectedCompletionDate)}
            </span>
          }
        />
        
        {canReadCustomers && (
          <div className="pt-3 mt-1 border-t border-border/50">
            <Link
              to="/customers"
              className="text-xs text-accent hover:text-accent-hover font-semibold flex items-center justify-end gap-1.5 transition-shadow"
            >
              <User className="w-3.5 h-3.5 text-accent" /> View All Customers
            </Link>
          </div>
        )}
      </div>
    </InfoBlock>
  );
};
