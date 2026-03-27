import { Mail, AlertTriangle } from "lucide-react";
import type { ExposedEmail } from "@/data/mockScanData";

interface EmailExposureProps {
  emails: ExposedEmail[];
}

const riskColors: Record<string, string> = {
  critical: "border-destructive/30 bg-destructive/5",
  high: "border-warning/30 bg-warning/5",
  medium: "border-secondary/30 bg-secondary/5",
  low: "border-success/30 bg-success/5",
};

const riskBadge: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-secondary/20 text-secondary",
  low: "bg-success/20 text-success",
};

const EmailExposure = ({ emails }: EmailExposureProps) => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Mail size={16} className="text-secondary" />
          Emails Corporativos Expostos
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Emails encontrados em vazamentos de dados
        </p>
      </div>
      <div className="p-4 space-y-3">
        {emails.map((item) => (
          <div key={item.email} className={`border rounded-lg p-3 ${riskColors[item.risk]} transition-all hover:scale-[1.01]`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-sm text-foreground truncate">{item.email}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {item.source}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${riskBadge[item.risk]}`}>
                  {item.breachCount} vazamento{item.breachCount > 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {item.lastSeen}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailExposure;
