import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Eye, FileDown, Building2, ArrowUpDown, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck, ShieldAlert, Shield,
} from "lucide-react";
import { generatePdfReport } from "@/lib/generatePdf";
import type { ScanResult } from "@/data/mockScanData";

interface CompanyScan {
  id: string;
  company_name: string;
  it_responsible: string;
  email: string;
  scan_score: number | null;
  total_vulnerabilities: number | null;
  critical_count: number | null;
  high_count: number | null;
  open_ports_count: number | null;
  exposed_emails_count: number | null;
  scan_data: ScanResult | null;
  created_at: string;
}

type SortField = "company_name" | "scan_score" | "total_vulnerabilities" | "created_at";
type SortDir = "asc" | "desc";
type RiskFilter = "all" | "critical" | "high" | "medium" | "low";

const ITEMS_PER_PAGE = 10;

const getRiskLevel = (score: number | null) => {
  if (score === null) return { label: "N/A", color: "text-muted-foreground", bg: "bg-muted" };
  if (score >= 80) return { label: "Crítico", color: "text-destructive", bg: "bg-destructive/10" };
  if (score >= 60) return { label: "Alto", color: "text-warning", bg: "bg-warning/10" };
  if (score >= 40) return { label: "Médio", color: "text-yellow-400", bg: "bg-yellow-400/10" };
  return { label: "Baixo", color: "text-success", bg: "bg-success/10" };
};

const Admin = () => {
  const [scans, setScans] = useState<CompanyScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchScans = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_scans")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setScans(data as unknown as CompanyScan[]);
      }
      setLoading(false);
    };
    fetchScans();
  }, []);

  const filtered = scans
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.company_name.toLowerCase().includes(q) ||
        s.it_responsible.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      let matchRisk = true;
      if (riskFilter !== "all") {
        const risk = getRiskLevel(s.scan_score);
        const map: Record<string, string> = { critical: "Crítico", high: "Alto", medium: "Médio", low: "Baixo" };
        matchRisk = risk.label === map[riskFilter];
      }
      return matchSearch && matchRisk;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "company_name") return a.company_name.localeCompare(b.company_name) * dir;
      if (sortField === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      const av = (a[sortField] ?? 0) as number;
      const bv = (b[sortField] ?? 0) as number;
      return (av - bv) * dir;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  const handleExportPdf = (scan: CompanyScan) => {
    if (!scan.scan_data) return;
    generatePdfReport(
      scan.company_name,
      scan.it_responsible,
      scan.email,
      scan.scan_data,
      scan.created_at,
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <Building2 size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Painel Administrativo</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {filtered.length} empresa{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, responsável ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-card border-border"
            />
          </div>
          <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v as RiskFilter); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48 bg-card border-border">
              <SelectValue placeholder="Nível de risco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="high">Alto</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="low">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm font-mono">
              Carregando...
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ShieldCheck size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-mono">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>
                    <button onClick={() => toggleSort("company_name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Empresa <ArrowUpDown size={12} />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Responsável TI</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("scan_score")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Score <ArrowUpDown size={12} />
                    </button>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Risco</TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("total_vulnerabilities")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Vulns <ArrowUpDown size={12} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Data <ArrowUpDown size={12} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((scan) => {
                  const risk = getRiskLevel(scan.scan_score);
                  return (
                    <TableRow key={scan.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{scan.company_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{scan.it_responsible}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs font-mono">{scan.email}</TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-foreground">{scan.scan_score ?? "—"}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${risk.bg} ${risk.color}`}>
                          {risk.label === "Crítico" && <ShieldAlert size={12} />}
                          {risk.label === "Alto" && <AlertTriangle size={12} />}
                          {risk.label === "Baixo" && <ShieldCheck size={12} />}
                          {risk.label === "Médio" && <Shield size={12} />}
                          {risk.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{scan.total_vulnerabilities ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(scan.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/report/${scan.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Eye size={15} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleExportPdf(scan)}
                            disabled={!scan.scan_data}
                          >
                            <FileDown size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground font-mono">
              <span>Página {page} de {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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

export default Admin;
