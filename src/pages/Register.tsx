import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mockScanData } from "@/data/mockScanData";
import { Building2, User, Mail, Shield, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    itResponsible: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.itResponsible.trim() || !form.email.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const scanData = mockScanData;
      const { data, error } = await supabase
        .from("company_scans")
        .insert({
          company_name: form.companyName.trim(),
          it_responsible: form.itResponsible.trim(),
          email: form.email.trim(),
          scan_score: scanData.overallScore,
          total_vulnerabilities: scanData.totalVulnerabilities,
          critical_count: scanData.criticalCount,
          high_count: scanData.highCount,
          medium_count: scanData.mediumCount,
          low_count: scanData.lowCount,
          open_ports_count: scanData.openPorts.filter((p) => p.status === "open").length,
          exposed_emails_count: scanData.exposedEmails.length,
          scan_data: scanData as any,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success("Diagnóstico realizado com sucesso!");
      navigate(`/report/${data.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar diagnóstico. Tente novamente.");
    } finally {
      setLoading(false);
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
              <p className="text-xs text-muted-foreground">Preencha os dados da empresa para iniciar</p>
            </div>
          </div>

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
                />
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
                  Analisando...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Iniciar Diagnóstico
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
