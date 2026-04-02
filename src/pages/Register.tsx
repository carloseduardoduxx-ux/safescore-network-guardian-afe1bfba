import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, User, Mail, Shield, Loader2, Globe, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const SCAN_STEPS = [
  "Iniciando análise...",
  "Verificando headers de segurança (Mozilla Observatory)...",
  "Escaneando portas abertas (Nmap)...",
  "Buscando subdomínios (Certificate Transparency)...",
  "Verificando malware e URLs maliciosas (URLhaus)...",
  "Analisando certificado SSL/TLS (SSL Labs)...",
  "Coletando informações de IP...",
  "Consolidando resultados...",
];

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [form, setForm] = useState({
    companyName: "",
    itResponsible: "",
    email: "",
    domain: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.itResponsible.trim() || !form.email.trim() || !form.domain.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setScanStep(0);

    // Animate steps
    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 4000);

    try {
      // Call edge function for real scan
      const { data: scanData, error: scanError } = await supabase.functions.invoke("scan-domain", {
        body: { domain: form.domain.trim() },
      });

      clearInterval(stepInterval);

      if (scanError) throw scanError;
      if (scanData?.error) throw new Error(scanData.error);

      setScanStep(SCAN_STEPS.length - 1);

      // Store results
      const { data, error } = await supabase
        .from("company_scans")
        .insert({
          company_name: form.companyName.trim(),
          it_responsible: form.itResponsible.trim(),
          email: form.email.trim(),
          domain: form.domain.trim(),
          scan_score: scanData.overallScore,
          total_vulnerabilities: scanData.totalVulnerabilities,
          critical_count: scanData.criticalCount,
          high_count: scanData.highCount,
          medium_count: scanData.mediumCount,
          low_count: scanData.lowCount,
          open_ports_count: scanData.openPorts?.length || 0,
          exposed_emails_count: scanData.exposedEmails?.length || 0,
          scan_data: scanData as any,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Diagnóstico realizado com sucesso!");
      navigate(`/report/${data.id}`);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      toast.error(err.message || "Erro ao realizar diagnóstico. Tente novamente.");
    } finally {
      setLoading(false);
      setScanStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-xl mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-lg p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Diagnóstico de Segurança</h2>
              <p className="text-xs text-muted-foreground">Preencha os dados e o domínio para análise real</p>
            </div>
          </div>

          {loading && (
            <div className="mb-6 bg-muted/50 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-sm font-mono text-foreground">
                  {SCAN_STEPS[scanStep]}
                </span>
              </div>
              <Progress value={((scanStep + 1) / SCAN_STEPS.length) * 100} className="h-2" />
              <p className="text-[10px] text-muted-foreground font-mono">
                Etapa {scanStep + 1} de {SCAN_STEPS.length}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground font-mono mb-1.5 block">
                Nome da Empresa
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Ex: Compueletro LTDA"
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground font-mono mb-1.5 block">
                Responsável pelo TI
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="itResponsible"
                  value={form.itResponsible}
                  onChange={handleChange}
                  placeholder="Nome do responsável"
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground font-mono mb-1.5 block">
                Email Corporativo
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contato@empresa.com.br"
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  maxLength={255}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground font-mono mb-1.5 block">
                Domínio da Empresa
              </label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="domain"
                  value={form.domain}
                  onChange={handleChange}
                  placeholder="empresa.com.br"
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  maxLength={255}
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex items-start gap-1.5 mt-2">
                <AlertCircle size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  Insira o domínio sem http:// — Ex: empresa.com.br. O scan utilizará APIs públicas gratuitas (Mozilla Observatory, Nmap, Certificate Transparency).
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Iniciar Diagnóstico Real
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
