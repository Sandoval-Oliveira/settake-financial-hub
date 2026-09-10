import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mensagemAuthPtBr, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/finance/auth-field";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — SetTake Finance" },
      { name: "description", content: "Acesse o SetTake Finance com seu e-mail e senha." },
      { property: "og:title", content: "Entrar — SetTake Finance" },
      { property: "og:description", content: "Área restrita do SetTake Finance." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) {
      setErro(mensagemAuthPtBr(error.message));
      return;
    }
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <span className="bg-primary flex size-10 items-center justify-center rounded-xl text-sm font-extrabold text-primary-foreground">
            SF
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-foreground">SetTake</span>
            <span className="text-xs text-muted-foreground">ERP Financeiro</span>
          </span>
        </div>

        <h1 className="text-lg font-semibold text-foreground">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use suas credenciais de acesso.</p>

        <form onSubmit={entrar} className="mt-6 flex flex-col gap-4">
          <Field label="E-mail">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {erro ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {erro}
            </p>
          ) : null}

          <Button type="submit" disabled={enviando} className="bg-primary text-primary-foreground">
            {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <Link
          to="/esqueci-senha"
          className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          Esqueci minha senha
        </Link>
      </div>
    </div>
  );
}
