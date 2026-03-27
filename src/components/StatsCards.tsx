import { AlertTriangle, Shield, Wifi, Mail } from "lucide-react";
import type { ScanResult } from "@/data/mockScanData";

interface StatsCardsProps {
  data: ScanResult;
}

const StatsCards = ({ data }: StatsCardsProps) => {
  const stats = [
    {
      label: "Vulnerabilidades",
      value: data.totalVulnerabilities,
      icon: AlertTriangle,
      accent: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
    {
      label: "Portas Abertas",
      value: data.openPorts.filter((p) => p.status === "open").length,
      icon: Wifi,
      accent: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    },
    {
      label: "Emails Expostos",
      value: data.exposedEmails.length,
      icon: Mail,
      accent: "text-secondary",
      bg: "bg-secondary/10",
      border: "border-secondary/20",
    },
    {
      label: "Itens Críticos",
      value: data.criticalCount,
      icon: Shield,
      accent: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-card border ${stat.border} rounded-lg p-4 animate-fade-in`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-md ${stat.bg}`}>
              <stat.icon size={18} className={stat.accent} />
            </div>
            <span className={`text-2xl font-bold font-mono ${stat.accent}`}>
              {stat.value}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
