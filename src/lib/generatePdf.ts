import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ScanResult } from "@/data/mockScanData";

const riskLabels: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

export function generatePdfReport(
  companyName: string,
  itResponsible: string,
  email: string,
  scanData: ScanResult,
  createdAt: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 200, 100);
  doc.text("SafeScore", 14, y);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("by Compueletro", 14, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Gerado em: ${new Date(createdAt).toLocaleDateString("pt-BR")}`,
    pageWidth - 14,
    y,
    { align: "right" }
  );

  y += 16;
  doc.setDrawColor(0, 200, 100);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  // Company Info
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Dados da Empresa", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Empresa: ${companyName}`, 14, y);
  y += 6;
  doc.text(`Responsável TI: ${itResponsible}`, 14, y);
  y += 6;
  doc.text(`Email: ${email}`, 14, y);
  y += 6;
  doc.text(`Rede Alvo: ${scanData.targetNetwork}`, 14, y);
  y += 12;

  // Score
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Score de Segurança", 14, y);
  y += 8;
  const scoreColor = scanData.overallScore <= 30 ? [220, 50, 50] : scanData.overallScore <= 50 ? [230, 140, 30] : scanData.overallScore <= 70 ? [230, 200, 50] : [0, 180, 90];
  doc.setFontSize(36);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${scanData.overallScore}/100`, 14, y + 10);
  y += 20;

  // Summary stats
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total de Vulnerabilidades: ${scanData.totalVulnerabilities}`, 14, y);
  doc.text(`Críticas: ${scanData.criticalCount}  |  Altas: ${scanData.highCount}  |  Médias: ${scanData.mediumCount}  |  Baixas: ${scanData.lowCount}`, 14, y + 6);
  y += 16;

  // Open Ports table
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Portas Abertas", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Porta", "Serviço", "Protocolo", "Status", "Risco", "Descrição"]],
    body: scanData.openPorts.map((p) => [
      p.port.toString(),
      p.service,
      p.protocol,
      p.status,
      riskLabels[p.risk],
      p.description,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 160, 80], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 255, 245] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Emails Expostos
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Emails Corporativos Expostos", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Email", "Fonte", "Vazamentos", "Última Vez", "Risco"]],
    body: scanData.exposedEmails.map((e) => [
      e.email,
      e.source,
      e.breachCount.toString(),
      e.lastSeen,
      riskLabels[e.risk],
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 120, 200], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 248, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Vulnerabilities
  if (y > 200) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Vulnerabilidades Detectadas", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["CVE", "Título", "Severidade", "CVSS", "Status", "Afetado"]],
    body: scanData.vulnerabilities.map((v) => [
      v.id,
      v.title,
      riskLabels[v.severity],
      v.cvss.toString(),
      v.status === "open" ? "Aberto" : v.status === "in_progress" ? "Em Progresso" : "Mitigado",
      v.affected,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [200, 50, 50], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [255, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `SafeScore - Compueletro | Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`SafeScore_${companyName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
