import type { OpenPort } from "@/data/mockScanData";

interface OpenPortsTableProps {
  ports: OpenPort[];
}

const riskColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-secondary/20 text-secondary border-secondary/30",
  low: "bg-success/20 text-success border-success/30",
};

const riskLabels: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

const OpenPortsTable = ({ ports }: OpenPortsTableProps) => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          Portas Abertas Detectadas
        </h3>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {ports.length} portas escaneadas
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs font-mono uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Porta</th>
              <th className="px-4 py-3 text-left">Serviço</th>
              <th className="px-4 py-3 text-left">Protocolo</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Risco</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {ports.map((port) => (
              <tr key={port.port} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-primary">{port.port}</td>
                <td className="px-4 py-3 font-mono">{port.service}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{port.protocol}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-mono ${
                    port.status === "open" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${port.status === "open" ? "bg-destructive animate-pulse" : "bg-muted-foreground"}`} />
                    {port.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono ${riskColors[port.risk]}`}>
                    {riskLabels[port.risk]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{port.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OpenPortsTable;
