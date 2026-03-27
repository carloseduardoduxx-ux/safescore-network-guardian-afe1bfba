export interface OpenPort {
  port: number;
  service: string;
  protocol: string;
  status: "open" | "filtered" | "closed";
  risk: "critical" | "high" | "medium" | "low";
  description: string;
}

export interface ExposedEmail {
  email: string;
  source: string;
  breachCount: number;
  lastSeen: string;
  risk: "critical" | "high" | "medium" | "low";
}

export interface Vulnerability {
  id: string;
  title: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  cvss: number;
  description: string;
  affected: string;
  status: "open" | "mitigated" | "in_progress";
}

export interface ScanResult {
  overallScore: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  openPorts: OpenPort[];
  exposedEmails: ExposedEmail[];
  vulnerabilities: Vulnerability[];
  scanDate: string;
  targetNetwork: string;
}

export const mockScanData: ScanResult = {
  overallScore: 42,
  totalVulnerabilities: 23,
  criticalCount: 4,
  highCount: 7,
  mediumCount: 8,
  lowCount: 4,
  scanDate: "2026-03-27T14:32:00Z",
  targetNetwork: "192.168.1.0/24",
  openPorts: [
    { port: 21, service: "FTP", protocol: "TCP", status: "open", risk: "critical", description: "Servidor FTP sem criptografia ativa" },
    { port: 22, service: "SSH", protocol: "TCP", status: "open", risk: "low", description: "SSH com autenticação por chave" },
    { port: 23, service: "Telnet", protocol: "TCP", status: "open", risk: "critical", description: "Telnet ativo - protocolo não seguro" },
    { port: 80, service: "HTTP", protocol: "TCP", status: "open", risk: "medium", description: "Servidor web sem HTTPS" },
    { port: 443, service: "HTTPS", protocol: "TCP", status: "open", risk: "low", description: "HTTPS com certificado válido" },
    { port: 445, service: "SMB", protocol: "TCP", status: "open", risk: "high", description: "SMB exposto - risco de ransomware" },
    { port: 1433, service: "MSSQL", protocol: "TCP", status: "open", risk: "critical", description: "SQL Server exposto à rede" },
    { port: 3306, service: "MySQL", protocol: "TCP", status: "open", risk: "high", description: "MySQL acessível externamente" },
    { port: 3389, service: "RDP", protocol: "TCP", status: "open", risk: "high", description: "Remote Desktop sem MFA" },
    { port: 5432, service: "PostgreSQL", protocol: "TCP", status: "filtered", risk: "medium", description: "PostgreSQL com acesso filtrado" },
    { port: 8080, service: "HTTP-Proxy", protocol: "TCP", status: "open", risk: "medium", description: "Proxy HTTP sem autenticação" },
    { port: 8443, service: "HTTPS-Alt", protocol: "TCP", status: "open", risk: "low", description: "Porta alternativa HTTPS" },
  ],
  exposedEmails: [
    { email: "admin@empresa.com.br", source: "LinkedIn Data Breach 2024", breachCount: 5, lastSeen: "2025-12-15", risk: "critical" },
    { email: "ti@empresa.com.br", source: "Pastebin Dump", breachCount: 3, lastSeen: "2026-01-20", risk: "high" },
    { email: "financeiro@empresa.com.br", source: "Dark Web Forum", breachCount: 2, lastSeen: "2025-11-08", risk: "critical" },
    { email: "rh@empresa.com.br", source: "Credential Stuffing List", breachCount: 1, lastSeen: "2026-02-10", risk: "medium" },
    { email: "suporte@empresa.com.br", source: "Phishing Campaign DB", breachCount: 4, lastSeen: "2026-03-01", risk: "high" },
    { email: "vendas@empresa.com.br", source: "Combo List", breachCount: 2, lastSeen: "2025-09-22", risk: "medium" },
  ],
  vulnerabilities: [
    { id: "CVE-2025-1234", title: "SQL Injection no Portal Web", category: "Aplicação Web", severity: "critical", cvss: 9.8, description: "Injeção SQL no formulário de login", affected: "Portal Web (porta 80)", status: "open" },
    { id: "CVE-2025-5678", title: "SMB v1 Habilitado", category: "Rede", severity: "critical", cvss: 9.3, description: "Protocolo SMBv1 vulnerável a EternalBlue", affected: "Servidor de Arquivos", status: "open" },
    { id: "CVE-2025-9012", title: "RDP sem Autenticação Multi-Fator", category: "Acesso Remoto", severity: "high", cvss: 8.1, description: "RDP exposto sem MFA habilitado", affected: "Estações de trabalho", status: "in_progress" },
    { id: "CVE-2025-3456", title: "Certificado SSL Expirado", category: "Criptografia", severity: "medium", cvss: 5.4, description: "Certificado SSL expirado em subdomínio", affected: "intranet.empresa.com", status: "open" },
    { id: "CVE-2025-7890", title: "Credenciais Padrão no Roteador", category: "Infraestrutura", severity: "critical", cvss: 9.0, description: "Roteador principal com senha padrão de fábrica", affected: "Gateway principal", status: "open" },
    { id: "CVE-2025-2345", title: "XSS Refletido", category: "Aplicação Web", severity: "high", cvss: 7.5, description: "Cross-Site Scripting no campo de busca", affected: "Portal Web", status: "open" },
    { id: "CVE-2025-6789", title: "Backup sem Criptografia", category: "Dados", severity: "high", cvss: 7.8, description: "Backups armazenados sem criptografia", affected: "Servidor de Backup", status: "in_progress" },
    { id: "CVE-2025-0123", title: "DNS Zone Transfer", category: "Rede", severity: "medium", cvss: 5.0, description: "Transferência de zona DNS permitida", affected: "Servidor DNS", status: "open" },
  ],
};

export const categoryScores = [
  { category: "Rede", score: 35 },
  { category: "Aplicação", score: 28 },
  { category: "Acesso", score: 52 },
  { category: "Dados", score: 45 },
  { category: "Infra", score: 38 },
  { category: "Criptografia", score: 60 },
];

export const scanHistory = [
  { date: "Jan", score: 55 },
  { date: "Fev", score: 48 },
  { date: "Mar", score: 52 },
  { date: "Abr", score: 45 },
  { date: "Mai", score: 42 },
];

export const severityDistribution = [
  { name: "Crítico", value: 4, fill: "hsl(0, 85%, 55%)" },
  { name: "Alto", value: 7, fill: "hsl(25, 95%, 55%)" },
  { name: "Médio", value: 8, fill: "hsl(40, 95%, 55%)" },
  { name: "Baixo", value: 4, fill: "hsl(155, 80%, 45%)" },
];
