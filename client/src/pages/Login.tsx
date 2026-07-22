import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Shield, Crosshair, Skull, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-military-bg" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(/manus-storage/pasted_file_gU1gjQ_WhatsAppImage2026_07_02at00_01_36_63d60f9d.jpeg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-military-bg via-military-bg/80 to-military-bg/60" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Link href="/">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-green-neon mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Início
          </Button>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-green-neon/30 bg-military-surface/50 mb-4 animate-pulse-slow">
            <img
              src="/manus-storage/pasted_file_yOEqOW_image_35f2b60a.png"
              alt="L.A.A."
              className="w-20 h-20 rounded-full"
            />
          </div>
          <h1 className="font-display text-4xl font-bold text-green-neon tracking-wider text-glow">
            L.A.A.
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.3em]">
            Liga Anônima de Airsoft
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-military-surface/90 border-green-neon/20 glow-border backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-neon" />
              <h2 className="font-display text-lg text-green-neon tracking-wider">
                ACESSAR O PORTAL
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Faça login para acessar todas as funcionalidades da Liga
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <a
              href={loginUrl}
              className="block"
            >
              <Button
                className="w-full bg-green-neon text-military-bg font-display tracking-wider text-lg py-6 hover:bg-green-glow transition-all duration-200 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]"
              >
                <Crosshair className="w-5 h-5 mr-2" />
                ENTRAR COM MANUS
              </Button>
            </a>

            <Separator className="bg-green-dim/20" />

            <div className="space-y-3 pt-2">
              <h3 className="font-display text-xs text-green-dim tracking-wider text-center uppercase">
                Acesso para membros
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Skull className="w-4 h-4 text-green-neon/50 shrink-0 mt-0.5" />
                  <p>Após o login, você terá acesso ao feed, galeria, loja e agendamento de jogos.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-neon/50 shrink-0 mt-0.5" />
                  <p>Se você é um administrador, solicite a promoção ao ADM Master para acessar o painel.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Ao acessar, você concorda com as regras da Liga Anônima de Airsoft.
        </p>
      </div>
    </div>
  );
}
