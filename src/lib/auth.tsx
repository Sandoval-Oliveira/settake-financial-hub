import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Papel = "admin" | "socio" | "vendedor";

export type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  ativo: boolean;
  criado_em: string | null;
};

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Papel | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isGestao: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Papel | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      return;
    }
    const [{ data: perfil }, { data: papel }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.rpc("meu_papel"),
    ]);
    setProfile((perfil as Profile | null) ?? null);
    setRole((papel as Papel | null) ?? null);
  }, []);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSession(data.session ?? null);
      await carregarPerfil(data.session?.user?.id);
      if (ativo) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, novaSessao) => {
      if (!ativo) return;
      if (event === "TOKEN_REFRESHED") {
        setSession(novaSessao ?? null);
        return;
      }
      setSession(novaSessao ?? null);
      if (!novaSessao) {
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }
      void carregarPerfil(novaSessao.user.id).then(() => setLoading(false));
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [carregarPerfil]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setRole(null);
      },
      refresh: async () => carregarPerfil(session?.user?.id),
      isAdmin: role === "admin",
      isGestao: role === "admin" || role === "socio",
    }),
    [session, profile, role, loading, carregarPerfil],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      session: null,
      user: null,
      profile: null,
      role: null,
      loading: true,
      signOut: async () => {},
      refresh: async () => {},
      isAdmin: false,
      isGestao: false,
    };
  }
  return ctx;
}

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: "Admin",
  socio: "Sócio",
  vendedor: "Vendedor",
};

export function mensagemAuthPtBr(mensagem: string | undefined): string {
  const m = (mensagem ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "E-mail ainda não confirmado.";
  if (m.includes("user not found")) return "Usuário não encontrado.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("banned") || m.includes("disabled"))
    return "Acesso desativado. Fale com o administrador.";
  if (m.includes("password should be")) return "A senha deve ter pelo menos 8 caracteres.";
  return mensagem || "Não foi possível concluir a operação.";
}
