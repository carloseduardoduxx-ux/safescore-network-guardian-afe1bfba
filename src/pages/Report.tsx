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
import { FileDown, ArrowLeft, Loader2, Building2, User, Mail } from "lucide-react";
import type { ScanResult } from "@/data/mockScanData";
import { generatePdfReport } from "@/lib/generatePdf";

interface CompanyScan {
  id: string;
  company_name: string;
  it_responsible: string;
  email: string;
  scan_score: number;
  scan_data: ScanResult;
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
        <div className="bg-card border border-border rounded-lg p-4 grid sm:grid-cols-3 gap-4">
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
        </div>

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
