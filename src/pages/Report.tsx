import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ScoreGauge from "@/components/ScoreGauge";
import StatsCards from "@/components/StatsCards";
import OpenPortsTable from "@/components/OpenPortsTable";
import EmailExposure from "@/components/EmailExposure";
import VulnerabilityList from "@/components/VulnerabilityList";
import {
  SeverityPieChart,
  ScoreHistoryChart,
  CategoryBarChart,
  CategoryRadarChart,
} from "@/components/Charts";
import { FileDown, ArrowLeft, Loader2, Building2, User, Mail, Globe, Server, Shield, Bug, AlertTriangle, Lock, CheckCircle } from "lucide-react";
import type { ScanResult } from "@/data/mockScanData";
import { generatePdfReport } from "@/lib/generatePdf";

interface CompanyScan {
  id: string;
  company_name: string;
  it_responsible: string;
  email: string;
  domain?: string;
  scan_score: number;
  scan_data: ScanResult & {
    observatory?: any;
    subdomains?: string[];
    ipInfo?: any;
  };
  created_at: string;
}

const Report = () => {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<CompanyScan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScan = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("company_scans")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setScan(data as unknown as CompanyScan);
      }
      setLoading(false);
    };
    fetchScan();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Relatório não encontrado.</p>
        <Link to="/register" className="text-primary underline text-sm">
          Voltar ao cadastro
        </Link>
      </div>
    );
  }

  const scanData = scan.scan_data;

  const handleExportPdf = () => {
    generatePdfReport(scan.company_name, scan.it_responsible, scan.email, scanData, scan.created_at);
  };

  return (
    <div className="min-h-screen bg-background" id="report-content">
      <Header />
      <main className="container max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Report Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/register" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-lg font-bold text-foreground">Relatório de Segurança</h2>
              <p className="text-xs text-muted-foreground font-mono">
                Gerado em{" "}
                {new Date(scan.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <FileDown size={16} />
            Exportar PDF
          </button>
        </div>

        {/* Company Info */}
        <div className="bg-card border border-border rounded-lg p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Empresa</p>
              <p className="text-sm font-medium text-foreground">{scan.company_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User size={16} className="text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Responsável TI</p>
              <p className="text-sm font-medium text-foreground">{scan.it_responsible}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Email</p>
              <p className="text-sm font-medium text-foreground">{scan.email}</p>
            </div>
          </div>
          {scan.domain && (
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Domínio</p>
                <p className="text-sm font-medium text-foreground">{scan.domain}</p>
              </div>
            </div>
          )}
        </div>

        {/* Observatory & IP Info */}
        {(scanData as any).observatory && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <Shield size={16} className="text-primary" />
                Mozilla Observatory
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade</span>
                  <span className="font-mono font-bold text-foreground">
                    {(scanData as any).observatory.grade || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-mono text-foreground">
                    {(scanData as any).observatory.score ?? "N/A"}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Testes passados</span>
                  <span className="font-mono text-foreground">
                    {(scanData as any).observatory.tests_passed ?? "N/A"}/{(scanData as any).observatory.tests_quantity ?? "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {(scanData as any).ipInfo && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Server size={16} className="text-primary" />
                  Informações do Servidor
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP</span>
                    <span className="font-mono text-foreground">{(scanData as any).ipInfo.query}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ISP</span>
                    <span className="font-mono text-foreground truncate ml-2">{(scanData as any).ipInfo.isp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Local</span>
                    <span className="font-mono text-foreground">
                      {(scanData as any).ipInfo.city}, {(scanData as any).ipInfo.country}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subdomains */}
        {(scanData as any).subdomains?.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Globe size={16} className="text-primary" />
              Subdomínios Encontrados ({(scanData as any).subdomains.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {(scanData as any).subdomains.map((sub: string) => (
                <span key={sub} className="text-xs font-mono bg-muted px-2 py-1 rounded border border-border text-muted-foreground">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SSL/TLS Info */}
        {(scanData as any).sslInfo && (scanData as any).sslInfo.grade && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Lock size={16} className="text-primary" />
              Análise SSL/TLS (SSL Labs)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Nota Geral</p>
                <p className={`text-2xl font-bold font-mono ${
                  (scanData as any).sslInfo.grade === "A+" || (scanData as any).sslInfo.grade === "A" ? "text-green-500" :
                  (scanData as any).sslInfo.grade === "B" ? "text-yellow-500" :
                  (scanData as any).sslInfo.grade === "C" ? "text-orange-500" :
                  "text-destructive"
                }`}>
                  {(scanData as any).sslInfo.grade}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Endpoints</p>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {(scanData as any).sslInfo.endpoints?.length || 0}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Status</p>
                <p className="text-sm font-mono text-foreground mt-1">
                  {(scanData as any).sslInfo.status || "N/A"}
                </p>
              </div>
            </div>

            {(scanData as any).sslInfo.endpoints?.map((ep: any, i: number) => (
              <div key={i} className="bg-muted/30 border border-border rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{ep.ipAddress}</span>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    ep.grade === "A+" || ep.grade === "A" ? "bg-green-500/20 text-green-500" :
                    ep.grade === "B" ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-destructive/20 text-destructive"
                  }`}>
                    {ep.grade}
                  </span>
                </div>
                {ep.details && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {ep.details.protocols?.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Protocolos</p>
                        <p className="font-mono text-foreground">{ep.details.protocols.map((p: any) => `${p.name} ${p.version}`).join(", ")}</p>
                      </div>
                    )}
                    {ep.details.certIssuer && (
                      <div>
                        <p className="text-muted-foreground">Emissor</p>
                        <p className="font-mono text-foreground truncate">{ep.details.certIssuer}</p>
                      </div>
                    )}
                    {ep.details.certExpiresIn != null && (
                      <div>
                        <p className="text-muted-foreground">Expira em</p>
                        <p className={`font-mono ${ep.details.certExpiresIn <= 30 ? "text-destructive" : "text-foreground"}`}>
                          {ep.details.certExpiresIn <= 0 ? "Expirado!" : `${ep.details.certExpiresIn} dias`}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-3 flex flex-wrap gap-2 mt-1">
                      {[
                        { label: "Heartbleed", val: ep.details.heartbleed },
                        { label: "POODLE", val: ep.details.poodle },
                        { label: "FREAK", val: ep.details.freak },
                        { label: "Logjam", val: ep.details.logjam },
                        { label: "DROWN", val: ep.details.drownVulnerable },
                      ].map((v) => (
                        <span key={v.label} className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          v.val ? "bg-destructive/20 text-destructive" : "bg-green-500/10 text-green-500"
                        }`}>
                          {v.val ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                          {v.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Malware Info */}
        {(scanData as any).malwareInfo && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Bug size={16} className="text-destructive" />
              Análise de Malware (URLhaus)
            </h3>
            {(scanData as any).malwareInfo.urls_online > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <AlertTriangle size={16} className="text-destructive shrink-0" />
                  <p className="text-sm text-foreground">
                    <strong>{(scanData as any).malwareInfo.urls_online}</strong> URL(s) maliciosa(s) ativa(s) detectada(s)
                  </p>
                </div>
                {(scanData as any).malwareInfo.urls?.length > 0 && (
                  <div className="space-y-2">
                    {(scanData as any).malwareInfo.urls.slice(0, 10).map((u: any, i: number) => (
                      <div key={i} className="flex items-start justify-between gap-2 bg-muted/50 rounded p-2 text-xs">
                        <span className="font-mono text-muted-foreground truncate flex-1">{u.url}</span>
                        <span className={`shrink-0 px-2 py-0.5 rounded font-mono ${
                          u.status === "online" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                        }`}>
                          {u.threat || u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-lg p-3">
                <Shield size={16} className="text-success shrink-0" />
                <p className="text-sm text-foreground">
                  Nenhuma URL maliciosa encontrada para este domínio
                </p>
              </div>
            )}
          </div>
        )}

        {/* Score + Stats */}
        <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="flex flex-col items-center bg-card border border-border rounded-lg p-6">
            <h2 className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-4">
              Score de Segurança
            </h2>
            <ScoreGauge score={scanData.overallScore} />
          </div>
          <div className="space-y-4">
            <StatsCards data={scanData} />
            <div className="grid md:grid-cols-2 gap-4">
              <SeverityPieChart />
              <ScoreHistoryChart />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <CategoryBarChart />
          <CategoryRadarChart />
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <OpenPortsTable ports={scanData.openPorts} />
          <EmailExposure emails={scanData.exposedEmails} />
        </div>

        <VulnerabilityList vulnerabilities={scanData.vulnerabilities} />

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

export default Report;
