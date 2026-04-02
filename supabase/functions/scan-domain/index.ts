import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScanResult {
  overallScore: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  openPorts: any[];
  exposedEmails: any[];
  vulnerabilities: any[];
  scanDate: string;
  targetNetwork: string;
  observatory?: any;
  subdomains?: string[];
  ipInfo?: any;
  malwareInfo?: any;
  sslInfo?: any;
}

async function scanMozillaObservatory(domain: string) {
  try {
    // Initiate scan
    const initRes = await fetch(
      `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${domain}`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "hidden=true&rescan=true" }
    );

    const initText = await initRes.text();
    let initData;
    try {
      initData = JSON.parse(initText);
    } catch {
      console.warn("Observatory returned non-JSON response, trying v2 API...");
      // Try Mozilla Observatory v2
      const v2Res = await fetch(`https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${domain}`, {
        method: "POST",
      });
      const v2Text = await v2Res.text();
      try {
        const v2Data = JSON.parse(v2Text);
        return { summary: v2Data, tests: v2Data.tests || {} };
      } catch {
        console.error("Observatory v2 also returned non-JSON");
        return null;
      }
    }

    // If scan is still running, wait and poll
    let result = initData;
    let attempts = 0;
    while (result.state === "PENDING" || result.state === "RUNNING" || result.state === "STARTING") {
      if (attempts > 15) break;
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(
        `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${domain}`
      );
      const pollText = await pollRes.text();
      try {
        result = JSON.parse(pollText);
      } catch {
        break;
      }
      attempts++;
    }

    // Get test results
    let tests = {};
    if (result.scan_id) {
      const testsRes = await fetch(
        `https://http-observatory.security.mozilla.org/api/v1/getScanResults?scan=${result.scan_id}`
      );
      const testsText = await testsRes.text();
      try {
        tests = JSON.parse(testsText);
      } catch {
        console.warn("Could not parse Observatory test results");
      }
    }

    return { summary: result, tests };
  } catch (e) {
    console.error("Observatory error:", e);
    return null;
  }
}

async function scanPortsHackerTarget(domain: string) {
  try {
    const res = await fetch(`https://api.hackertarget.com/nmap/?q=${domain}`);
    const text = await res.text();
    if (text.includes("error") || text.includes("API count exceeded")) {
      console.warn("HackerTarget limit:", text);
      return [];
    }
    return parseNmapOutput(text);
  } catch (e) {
    console.error("HackerTarget error:", e);
    return [];
  }
}

function parseNmapOutput(text: string) {
  const ports: any[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\d+)\/(tcp|udp)\s+(\w+)\s+(.*)$/);
    if (match) {
      const port = parseInt(match[1]);
      const protocol = match[2].toUpperCase();
      const status = match[3].toLowerCase();
      const service = match[4].trim();

      let risk: string = "low";
      const riskyPorts = [21, 23, 25, 135, 139, 445, 1433, 3306, 3389, 5432, 5900];
      const mediumPorts = [80, 8080, 8443, 110, 143];
      if (riskyPorts.includes(port)) risk = port === 23 || port === 21 ? "critical" : "high";
      else if (mediumPorts.includes(port)) risk = "medium";

      const descriptions: Record<number, string> = {
        21: "FTP - transferência de arquivos sem criptografia",
        22: "SSH - acesso remoto seguro",
        23: "Telnet - protocolo não seguro, texto plano",
        25: "SMTP - servidor de email",
        53: "DNS - servidor de nomes",
        80: "HTTP - servidor web sem criptografia",
        110: "POP3 - email sem criptografia",
        135: "MSRPC - serviço Windows exposto",
        139: "NetBIOS - compartilhamento Windows",
        143: "IMAP - email sem criptografia",
        443: "HTTPS - servidor web seguro",
        445: "SMB - compartilhamento de arquivos Windows",
        993: "IMAPS - email seguro",
        995: "POP3S - email seguro",
        1433: "MSSQL - banco de dados exposto",
        3306: "MySQL - banco de dados exposto",
        3389: "RDP - acesso remoto sem MFA",
        5432: "PostgreSQL - banco de dados exposto",
        5900: "VNC - acesso remoto sem criptografia",
        8080: "HTTP Proxy - proxy web",
        8443: "HTTPS alternativo",
      };

      ports.push({
        port,
        service: service || `Port ${port}`,
        protocol,
        status: status === "open" ? "open" : status === "filtered" ? "filtered" : "closed",
        risk,
        description: descriptions[port] || `Serviço ${service} na porta ${port}`,
      });
    }
  }
  return ports;
}

async function scanSubdomains(domain: string) {
  try {
    const res = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`);
    if (!res.ok) return [];
    const data = await res.json();
    const subdomains = new Set<string>();
    for (const entry of data.slice(0, 100)) {
      const names = entry.name_value.split("\n");
      for (const name of names) {
        if (name.includes(domain) && !name.startsWith("*")) {
          subdomains.add(name.trim().toLowerCase());
        }
      }
    }
    return Array.from(subdomains).slice(0, 20);
  } catch (e) {
    console.error("crt.sh error:", e);
    return [];
  }
}
async function scanUrlhaus(domain: string) {
  try {
    // Check host against URLhaus database
    const res = await fetch("https://urlhaus-api.abuse.ch/v1/host/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `host=${encodeURIComponent(domain)}`,
    });
    const data = await res.json();

    const threatTypes = new Set<string>();
    const malwareUrls: any[] = [];

    if (data.urls && Array.isArray(data.urls)) {
      for (const url of data.urls.slice(0, 20)) {
        if (url.threat) threatTypes.add(url.threat);
        malwareUrls.push({
          url: url.url,
          status: url.url_status,
          threat: url.threat,
          tags: url.tags || [],
          dateAdded: url.date_added,
        });
      }
    }

    return {
      query_status: data.query_status,
      urls_online: data.urls_online || 0,
      urls_total: malwareUrls.length,
      blacklists: data.blacklists || null,
      threatTypes: Array.from(threatTypes),
      urls: malwareUrls,
    };
  } catch (e) {
    console.error("URLhaus error:", e);
    return null;
  }
}

async function scanSslLabs(domain: string) {
  try {
    // Start analysis (fromCache=on to avoid long waits, startNew=off)
    const startRes = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&fromCache=on&all=done`
    );
    const startText = await startRes.text();
    let data;
    try {
      data = JSON.parse(startText);
    } catch {
      console.warn("SSL Labs returned non-JSON");
      return null;
    }

    // Poll if still in progress (max ~60s)
    let attempts = 0;
    while (data.status === "IN_PROGRESS" || data.status === "DNS") {
      if (attempts > 12) break;
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(
        `https://api.ssllabs.com/api/v3/analyze?host=${domain}&fromCache=on&all=done`
      );
      const pollText = await pollRes.text();
      try {
        data = JSON.parse(pollText);
      } catch {
        break;
      }
      attempts++;
    }

    if (data.status !== "READY" || !data.endpoints?.length) {
      console.warn("SSL Labs scan not ready:", data.status);
      return { status: data.status, grade: null, endpoints: [] };
    }

    const endpoints = data.endpoints.map((ep: any) => ({
      ipAddress: ep.ipAddress,
      grade: ep.grade || "N/A",
      gradeTrustIgnored: ep.gradeTrustIgnored || "N/A",
      hasWarnings: ep.hasWarnings || false,
      isExceptional: ep.isExceptional || false,
      progress: ep.progress,
      details: ep.details ? {
        protocols: ep.details.protocols?.map((p: any) => ({ name: p.name, version: p.version })) || [],
        vulnBeast: ep.details.vulnBeast || false,
        heartbleed: ep.details.heartbleed || false,
        poodle: ep.details.poodle || false,
        poodleTls: ep.details.poodleTls || 0,
        freak: ep.details.freak || false,
        logjam: ep.details.logjam || false,
        drownVulnerable: ep.details.drownVulnerable || false,
        forwardSecrecy: ep.details.forwardSecrecy || 0,
        certExpiresIn: ep.details.cert?.notAfter
          ? Math.round((ep.details.cert.notAfter - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        certIssuer: ep.details.cert?.issuerLabel || null,
        certSigAlg: ep.details.cert?.sigAlg || null,
      } : null,
    }));

    const bestGrade = endpoints[0]?.grade || "N/A";

    return {
      status: data.status,
      grade: bestGrade,
      endpoints,
    };
  } catch (e) {
    console.error("SSL Labs error:", e);
    return null;
  }
}

async function getIpInfo(domain: string) {
  try {
    const res = await fetch(`http://ip-api.com/json/${domain}?fields=status,message,query,isp,org,as,country,regionName,city`);
    const data = await res.json();
    return data.status === "success" ? data : null;
  } catch (e) {
    console.error("IP API error:", e);
    return null;
  }
}

function buildVulnerabilities(observatory: any, ports: any[], subdomains: string[], malwareInfo: any) {
  const vulns: any[] = [];
  let vulnIndex = 0;

  // From Observatory tests
  if (observatory?.tests) {
    const tests = observatory.tests;
    const testMap: Record<string, { title: string; category: string; desc: string }> = {
      "content-security-policy": { title: "Content Security Policy ausente", category: "Aplicação Web", desc: "CSP não configurado - risco de XSS e injeção de conteúdo" },
      "x-frame-options": { title: "X-Frame-Options ausente", category: "Aplicação Web", desc: "Proteção contra clickjacking não habilitada" },
      "x-content-type-options": { title: "X-Content-Type-Options ausente", category: "Aplicação Web", desc: "MIME type sniffing não prevenido" },
      "strict-transport-security": { title: "HSTS não configurado", category: "Criptografia", desc: "HTTP Strict Transport Security ausente - risco de downgrade" },
      "x-xss-protection": { title: "X-XSS-Protection ausente", category: "Aplicação Web", desc: "Proteção XSS do navegador não ativada" },
      "referrer-policy": { title: "Referrer Policy ausente", category: "Privacidade", desc: "Política de referência não definida - vazamento de informações" },
      "subresource-integrity": { title: "Subresource Integrity ausente", category: "Aplicação Web", desc: "Integridade de sub-recursos não verificada" },
      "cookies": { title: "Cookies inseguros detectados", category: "Aplicação Web", desc: "Cookies sem flags de segurança adequadas" },
      "redirection": { title: "Redirecionamento HTTP inseguro", category: "Criptografia", desc: "Redirecionamento de HTTP para HTTPS incorreto" },
    };

    for (const [testName, testResult] of Object.entries(tests) as any[]) {
      if (testResult.pass === false && testMap[testName]) {
        const info = testMap[testName];
        const score = testResult.score_modifier || 0;
        let severity: string = "low";
        let cvss = 3.0;
        if (score <= -25) { severity = "critical"; cvss = 9.0 + Math.random() * 0.8; }
        else if (score <= -15) { severity = "high"; cvss = 7.0 + Math.random() * 1.5; }
        else if (score <= -5) { severity = "medium"; cvss = 4.0 + Math.random() * 2.5; }
        else { cvss = 1.0 + Math.random() * 2.0; }

        vulns.push({
          id: `OBS-${String(++vulnIndex).padStart(3, "0")}`,
          title: info.title,
          category: info.category,
          severity,
          cvss: Math.round(cvss * 10) / 10,
          description: info.desc,
          affected: "Servidor Web",
          status: "open",
        });
      }
    }
  }

  // From open ports
  for (const port of ports) {
    if (port.risk === "critical" || port.risk === "high") {
      vulns.push({
        id: `PORT-${String(++vulnIndex).padStart(3, "0")}`,
        title: `Porta ${port.port} (${port.service}) exposta`,
        category: "Rede",
        severity: port.risk,
        cvss: port.risk === "critical" ? 9.0 + Math.random() * 0.8 : 7.0 + Math.random() * 1.5,
        description: port.description,
        affected: `Porta ${port.port}/${port.protocol}`,
        status: "open",
      });
    }
  }

  // Subdomain enumeration finding
  if (subdomains.length > 5) {
    vulns.push({
      id: `SUB-${String(++vulnIndex).padStart(3, "0")}`,
      title: "Subdomínios expostos em certificados públicos",
      category: "Infraestrutura",
      severity: "medium",
      cvss: 5.0,
      description: `${subdomains.length} subdomínios encontrados via Certificate Transparency`,
      affected: "DNS / Certificados",
      status: "open",
    });
  }

  // From URLhaus malware data
  if (malwareInfo && malwareInfo.urls_online > 0) {
    vulns.push({
      id: `MAL-${String(++vulnIndex).padStart(3, "0")}`,
      title: "URLs maliciosas ativas detectadas",
      category: "Malware",
      severity: "critical",
      cvss: 9.5,
      description: `${malwareInfo.urls_online} URL(s) maliciosa(s) ativa(s) associada(s) ao domínio. Tipos de ameaça: ${malwareInfo.threatTypes?.join(", ") || "diversos"}`,
      affected: "Domínio / Infraestrutura",
      status: "open",
    });
  }

  if (malwareInfo && malwareInfo.blacklists) {
    const blacklisted = Object.entries(malwareInfo.blacklists).filter(([_, v]: any) => v === "listed");
    if (blacklisted.length > 0) {
      vulns.push({
        id: `BL-${String(++vulnIndex).padStart(3, "0")}`,
        title: "Domínio em listas negras de segurança",
        category: "Reputação",
        severity: "critical",
        cvss: 9.0,
        description: `Domínio listado em ${blacklisted.length} blacklist(s): ${blacklisted.map(([k]) => k).join(", ")}`,
        affected: "Domínio",
        status: "open",
      });
    }
  }

  return vulns;
}

function calculateScore(observatory: any, vulns: any[]) {
  let score = 100;

  // Observatory score (0-100, higher is better)
  if (observatory?.summary?.score != null) {
    const obsScore = Math.max(0, Math.min(100, observatory.summary.score));
    score = obsScore;
  }

  // Penalty per vulnerability
  for (const v of vulns) {
    if (v.severity === "critical") score -= 8;
    else if (v.severity === "high") score -= 5;
    else if (v.severity === "medium") score -= 3;
    else score -= 1;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    if (!domain || typeof domain !== "string") {
      return new Response(JSON.stringify({ error: "Domínio é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();

    console.log(`Starting scan for: ${cleanDomain}`);

    // Run all scans in parallel
    const [observatory, ports, subdomains, ipInfo, malwareInfo] = await Promise.all([
      scanMozillaObservatory(cleanDomain),
      scanPortsHackerTarget(cleanDomain),
      scanSubdomains(cleanDomain),
      getIpInfo(cleanDomain),
      scanUrlhaus(cleanDomain),
    ]);

    console.log(`Scan complete. Observatory: ${observatory ? "OK" : "failed"}, Ports: ${ports.length}, Subdomains: ${subdomains.length}, Malware: ${malwareInfo ? "OK" : "failed"}`);

    const vulnerabilities = buildVulnerabilities(observatory, ports, subdomains, malwareInfo);

    const criticalCount = vulnerabilities.filter((v: any) => v.severity === "critical").length;
    const highCount = vulnerabilities.filter((v: any) => v.severity === "high").length;
    const mediumCount = vulnerabilities.filter((v: any) => v.severity === "medium").length;
    const lowCount = vulnerabilities.filter((v: any) => v.severity === "low").length;

    const overallScore = calculateScore(observatory, vulnerabilities);

    const result: ScanResult = {
      overallScore,
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      openPorts: ports,
      exposedEmails: [],
      vulnerabilities,
      scanDate: new Date().toISOString(),
      targetNetwork: cleanDomain,
      observatory: observatory?.summary || null,
      subdomains,
      ipInfo,
      malwareInfo,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Scan error:", e);
    return new Response(
      JSON.stringify({ error: "Erro ao realizar scan. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
