import { Activity, Calendar, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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
import { mockScanData } from "@/data/mockScanData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 md:px-6 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Scan Info Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono bg-card/50 border border-border rounded-lg px-4 py-3">
          <span className="flex items-center gap-1.5">
            <Activity size={12} className="text-primary" />
            Scan ativo
          </span>
          <span className="flex items-center gap-1.5">
            <Target size={12} />
            Rede: {mockScanData.targetNetwork}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date(mockScanData.scanDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Score + Stats */}
        <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="flex flex-col items-center bg-card border border-border rounded-lg p-6">
            <h2 className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-4">
              Score de Segurança
            </h2>
            <ScoreGauge score={mockScanData.overallScore} />
          </div>
          <div className="space-y-4">
            <StatsCards data={mockScanData} />
            <div className="grid md:grid-cols-2 gap-4">
              <SeverityPieChart />
              <ScoreHistoryChart />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-4">
          <CategoryBarChart />
          <CategoryRadarChart />
        </div>

        {/* Ports + Emails */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <OpenPortsTable ports={mockScanData.openPorts} />
          <EmailExposure emails={mockScanData.exposedEmails} />
        </div>

        {/* Vulnerabilities */}
        <VulnerabilityList vulnerabilities={mockScanData.vulnerabilities} />

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

export default Index;
