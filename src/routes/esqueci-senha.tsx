import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mensagemAuthPtBr } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/finance/auth-field";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — SetTake Finance" },
      {
        name: "description",
        content: "Receba um link por e-mail para redefinir sua senha do SetTake Finance.",
      },
      { property: "og:title", content: "Recuperar senha — SetTake Finance" },
      { property: "og:description", content: "Redefina o acesso ao SetTake Finance." },
    ],
  }),
  component: EsqueciSenhaPage,
});

function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setEnviando(false);
    if (error) {
      setErro(mensagemAuthPtBr(error.message));
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-lg">
        <h1 className="text-lg font-semibold text-foreground">Esqueci minha senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviaremos um link de redefinição para o seu e-mail.
        </p>

        {enviado ? (
          <p className="mt-6 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
            Link enviado. Verifique sua caixa de entrada.
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
            <Field label="E-mail">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
              />
            </Field>
            {erro ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {erro}
              </p>
            ) : null}
            <Button type="submit" disabled={enviando} className="bg-primary text-primary-foreground">
              {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
              {enviando ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        )}

        <Link to="/login" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
