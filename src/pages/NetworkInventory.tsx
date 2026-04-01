import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Monitor, Server, Wifi, Router, Printer, Smartphone, Search,
  ShieldAlert, ShieldCheck, Shield, AlertTriangle, Download,
  HardDrive, Terminal, Bug, ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import { toast } from "sonner";

interface NetworkDevice {
  id: string;
  ip_address: string;
  mac_address: string | null;
  hostname: string | null;
  os_detected: string | null;
  os_version: string | null;
  device_type: string | null;
  open_ports: any[];
  vulnerabilities: any[];
  risk_level: string;
  status: string;
  created_at: string;
  company_name: string;
}

interface NetworkScan {
  id: string;
  company_name: string;
  total_devices: number;
  total_vulnerabilities: number;
  critical_devices: number;
  scan_status: string;
  agent_version: string | null;
  network_range: string | null;
  created_at: string;
}

const deviceIcons: Record<string, React.ReactNode> = {
  workstation: <Monitor size={16} />,
  server: <Server size={16} />,
  router: <Router size={16} />,
  printer: <Printer size={16} />,
  iot: <Smartphone size={16} />,
  network: <Wifi size={16} />,
  proxy: <HardDrive size={16} />,
  endpoint: <Terminal size={16} />,
  unknown: <HardDrive size={16} />,
};

const riskColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const riskIcons: Record<string, React.ReactNode> = {
  critical: <ShieldAlert size={14} />,
  high: <AlertTriangle size={14} />,
  medium: <Shield size={14} />,
  low: <ShieldCheck size={14} />,
};

const NetworkInventory = () => {
  const { scanId } = useParams();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [networkScans, setNetworkScans] = useState<NetworkScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [scanId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch network scans
    let scansQuery = supabase.from("network_scans").select("*").order("created_at", { ascending: false });
    if (scanId) scansQuery = scansQuery.eq("scan_id", scanId);
    const { data: scansData } = await scansQuery;
    if (scansData) setNetworkScans(scansData as unknown as NetworkScan[]);

    // Fetch devices
    let devicesQuery = supabase.from("network_devices").select("*").order("risk_level", { ascending: true });
    if (scanId) devicesQuery = devicesQuery.eq("scan_id", scanId);
    const { data: devicesData } = await devicesQuery;
    if (devicesData) {
      // Sort: critical first
      const order = ["critical", "high", "medium", "low"];
      const sorted = (devicesData as unknown as NetworkDevice[]).sort(
        (a, b) => order.indexOf(a.risk_level) - order.indexOf(b.risk_level)
      );
      setDevices(sorted);
    }

    setLoading(false);
  };

  const filtered = devices.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.ip_address.includes(q) ||
      (d.hostname || "").toLowerCase().includes(q) ||
      (d.os_detected || "").toLowerCase().includes(q) ||
      (d.company_name || "").toLowerCase().includes(q);
    const matchRisk = riskFilter === "all" || d.risk_level === riskFilter;
    const matchType = typeFilter === "all" || d.device_type === typeFilter;
    return matchSearch && matchRisk && matchType;
  });

  const stats = {
    total: devices.length,
    critical: devices.filter((d) => d.risk_level === "critical").length,
    high: devices.filter((d) => d.risk_level === "high").length,
    medium: devices.filter((d) => d.risk_level === "medium").length,
    low: devices.filter((d) => d.risk_level === "low").length,
    totalVulns: devices.reduce((a, d) => a + (d.vulnerabilities?.length || 0), 0),
  };

  const handleCopyCommand = () => {
    const cmd = `sudo python3 safescore-agent.py --company "Nome da Empresa" --range 192.168.1.0/24`;
    navigator.clipboard.writeText(cmd);
    toast.success("Comando copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Wifi size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Inventário de Rede</h2>
              <p className="text-xs text-muted-foreground font-mono">
                Dispositivos detectados pelo agente local
              </p>
            </div>
          </div>
          <a href="/safescore-agent.py" download>
            <Button variant="outline" size="sm" className="gap-2">
              <Download size={14} />
              Baixar Agente
            </Button>
          </a>
        </div>

        {/* Agent Instructions */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Terminal size={16} className="text-primary" />
            Como usar o Agente Local
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              <p className="font-semibold text-foreground text-sm">⚡ Opção 1 — Executável pronto (recomendado)</p>
              <p>Baixe o <code className="bg-muted px-1 rounded font-mono">SafeScoreAgent.exe</code> direto da página de Releases — não precisa instalar Python.</p>
              <div className="flex items-center gap-2">
                <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                  → Acessar Releases no GitHub
                </a>
              </div>
              <p className="text-[10px] text-muted-foreground">* Atualize o link acima com a URL do seu repositório GitHub.</p>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-2 mt-2">
              <p className="font-semibold text-foreground text-sm">🐍 Opção 2 — Script Python</p>
              <p className="font-mono">1. Baixe <code className="bg-muted px-1 rounded">safescore-agent.py</code></p>
              <p className="font-mono">2. Instale: <code className="bg-muted px-1 rounded">pip install requests</code></p>
              <p className="font-mono">3. Execute como administrador:</p>
              <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                <code className="flex-1 text-foreground font-mono text-xs">
                  sudo python3 safescore-agent.py --company "Nome da Empresa" --range 192.168.1.0/24
                </code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyCommand}>
                  <Copy size={12} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {devices.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Dispositivos</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-destructive">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">Crítico</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-orange-400">{stats.high}</p>
              <p className="text-xs text-muted-foreground">Alto</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-yellow-400">{stats.medium}</p>
              <p className="text-xs text-muted-foreground">Médio</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-emerald-400">{stats.low}</p>
              <p className="text-xs text-muted-foreground">Baixo</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{stats.totalVulns}</p>
              <p className="text-xs text-muted-foreground">Vulnerabilidades</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por IP, hostname, SO ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border">
              <SelectValue placeholder="Risco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="high">Alto</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="low">Baixo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="workstation">Estação</SelectItem>
              <SelectItem value="server">Servidor</SelectItem>
              <SelectItem value="router">Roteador</SelectItem>
              <SelectItem value="printer">Impressora</SelectItem>
              <SelectItem value="iot">IoT</SelectItem>
              <SelectItem value="network">Rede</SelectItem>
              <SelectItem value="unknown">Desconhecido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Devices Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-mono">
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Wifi size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-mono">
                {devices.length === 0
                  ? "Nenhum dispositivo encontrado. Execute o agente local para iniciar."
                  : "Nenhum dispositivo corresponde aos filtros."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>SO</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Portas</TableHead>
                  <TableHead>Vulns</TableHead>
                  <TableHead>Risco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((device) => (
                  <>
                    <TableRow
                      key={device.id}
                      className="border-border cursor-pointer hover:bg-muted/30"
                      onClick={() => setExpandedDevice(expandedDevice === device.id ? null : device.id)}
                    >
                      <TableCell className="w-8">
                        {expandedDevice === device.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{device.ip_address}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{device.hostname || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{device.os_detected || "Desconhecido"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {deviceIcons[device.device_type || "unknown"]}
                          {device.device_type || "unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{device.open_ports?.length || 0}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {device.vulnerabilities?.length > 0 ? (
                          <span className="flex items-center gap-1 text-destructive">
                            <Bug size={12} />
                            {device.vulnerabilities.length}
                          </span>
                        ) : "0"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${riskColors[device.risk_level] || riskColors.low}`}>
                          {riskIcons[device.risk_level]}
                          {device.risk_level}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details */}
                    {expandedDevice === device.id && (
                      <TableRow key={`${device.id}-details`} className="border-border bg-muted/20">
                        <TableCell colSpan={8} className="p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Open Ports */}
                            <div>
                              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                                <Terminal size={12} /> Portas Abertas
                              </h4>
                              {device.open_ports?.length > 0 ? (
                                <div className="space-y-1">
                                  {device.open_ports.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-xs bg-background rounded p-2">
                                      <span className="font-mono text-foreground">
                                        {p.port}/{p.service || "unknown"}
                                      </span>
                                      <Badge variant="outline" className={`text-[10px] ${
                                        p.risk === "critical" ? "border-destructive text-destructive" :
                                        p.risk === "high" ? "border-orange-500 text-orange-400" :
                                        p.risk === "medium" ? "border-yellow-500 text-yellow-400" :
                                        "border-emerald-500 text-emerald-400"
                                      }`}>
                                        {p.risk}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Nenhuma porta aberta detectada</p>
                              )}
                            </div>

                            {/* Vulnerabilities */}
                            <div>
                              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                                <Bug size={12} /> Vulnerabilidades
                              </h4>
                              {device.vulnerabilities?.length > 0 ? (
                                <div className="space-y-2">
                                  {device.vulnerabilities.map((v: any, i: number) => (
                                    <div key={i} className="bg-background rounded p-2 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-foreground">{v.title}</span>
                                        <Badge variant="outline" className={`text-[10px] ${
                                          v.severity === "critical" ? "border-destructive text-destructive" :
                                          v.severity === "high" ? "border-orange-500 text-orange-400" :
                                          "border-yellow-500 text-yellow-400"
                                        }`}>
                                          {v.severity}
                                        </Badge>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground">{v.description}</p>
                                      {v.recommendation && (
                                        <p className="text-[10px] text-primary">💡 {v.recommendation}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <ShieldCheck size={12} className="text-emerald-400" />
                                  Nenhuma vulnerabilidade detectada
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Device Info */}
                          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                            <div><span className="text-foreground font-medium">MAC:</span> {device.mac_address || "N/A"}</div>
                            <div><span className="text-foreground font-medium">SO:</span> {device.os_version || device.os_detected || "N/A"}</div>
                            <div><span className="text-foreground font-medium">Status:</span> {device.status}</div>
                            <div><span className="text-foreground font-medium">Empresa:</span> {device.company_name}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Recent Network Scans */}
        {networkScans.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Histórico de Scans de Rede</h3>
            <div className="space-y-2">
              {networkScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between bg-muted/30 rounded p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <Wifi size={14} className="text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{scan.company_name}</p>
                      <p className="text-muted-foreground font-mono">{scan.network_range || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground font-mono">
                    <span>{scan.total_devices} devices</span>
                    <span>{scan.total_vulnerabilities} vulns</span>
                    <span>{new Date(scan.created_at).toLocaleDateString("pt-BR")}</span>
                    <Badge variant="outline" className={
                      scan.scan_status === "completed" ? "text-emerald-400 border-emerald-500/30" : "text-yellow-400 border-yellow-500/30"
                    }>
                      {scan.scan_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">
            SafeScore v1.0 — Desenvolvido por{" "}
            <span className="text-primary font-semibold">Compueletro</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default NetworkInventory;
