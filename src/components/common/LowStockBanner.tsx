import { AlertTriangle, X } from "lucide-react";
import { Alert, Button } from "@mantine/core";
import { useLowStockAlerts, useDismissAlert } from "@/hooks/useInventory";
import { Link } from "react-router-dom";

export function LowStockBanner() {
  const { data: alerts, isLoading } = useLowStockAlerts();
  const dismissMutation = useDismissAlert();

  if (isLoading || !alerts || alerts.length === 0) {
    return null;
  }

  const activeCount = alerts.length;

  return (
    <Alert
      color="yellow"
      mb="md"
      icon={<AlertTriangle size={20} />}
      withCloseButton
      onClose={() => {
        alerts.forEach((alert) => dismissMutation.mutate(alert.id));
      }}
    >
      <div>
        <strong style={{ color: "var(--mantine-color-yellow-7)" }}>
          {activeCount} item{activeCount > 1 ? "s" : ""} low on stock
        </strong>
        <p style={{ fontSize: 14, color: "var(--mantine-color-yellow-7)", marginTop: 4 }}>
          Review and restock to avoid disruptions.{" "}
          <Link
            to="/manage?filter=low_stock"
            style={{ textDecoration: "underline", fontWeight: 600, color: "var(--mantine-color-yellow-8)" }}
          >
            View items
          </Link>
        </p>
      </div>
    </Alert>
  );
}