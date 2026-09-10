import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, type Papel } from "@/lib/auth";

const ROTAS_PUBLICAS = ["/login", "/esqueci-senha", "/redefinir-senha"];

export function isRotaPublica(pathname: string) {
  return ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, role, loading, signOut, isGestao } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const publica = isRotaPublica(pathname);

  useEffect(() => {
    if (loading || publica) return;
    if (!session) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, publica, session, navigate]);

  if (publica) return <>{children}</>;

  if (loading || (!session && typeof window !== "undefined")) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">Acesso desativado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesso desativado. Fale com o administrador.
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (!isGestao) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">Sem acesso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O ERP Financeiro é restrito a administradores e sócios.
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Bloqueia uma página para quem não tem um dos papéis exigidos.
 * O banco também bloqueia (policies) — isto é a camada de interface.
 */
export function RequirePapel({ papeis, children }: { papeis: Papel[]; children: ReactNode }) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const permitido = role !== null && papeis.includes(role);

  useEffect(() => {
    if (!loading && role && !permitido) navigate({ to: "/", replace: true });
  }, [loading, role, permitido, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!permitido) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="max-w-sm rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">Sem acesso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu perfil não tem permissão para esta área.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
