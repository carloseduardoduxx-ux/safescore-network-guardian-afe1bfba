import { Shield, Bell, Settings, LayoutDashboard, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import logo from "@/assets/compueletro-logo.png";
import type { Session } from "@supabase/supabase-js";

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Compueletro Soluções" className="h-10 w-auto drop-shadow-lg" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Safe<span className="text-primary text-glow">Score</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors" title="Painel Admin">
            <LayoutDashboard size={18} />
          </Link>
          <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
            <Bell size={18} />
          </button>
          <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
            <Settings size={18} />
          </button>
          {session ? (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield size={16} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-mono truncate max-w-[120px]">
                {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 ml-3 pl-3 border-l border-border text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              <Shield size={16} />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
