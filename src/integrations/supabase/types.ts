export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      contas_bancarias: {
        Row: {
          criado_em: string
          id: number
          nome: string
          saldo_inicial: number
        }
        Insert: {
          criado_em?: string
          id?: number
          nome: string
          saldo_inicial?: number
        }
        Update: {
          criado_em?: string
          id?: number
          nome?: string
          saldo_inicial?: number
        }
        Relationships: []
      }
      grupo: {
        Row: {
          id: number
          natureza_id: number
          nome: string
        }
        Insert: {
          id?: number
          natureza_id: number
          nome: string
        }
        Update: {
          id?: number
          natureza_id?: number
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_natureza_id_fkey"
            columns: ["natureza_id"]
            isOneToOne: false
            referencedRelation: "natureza"
            referencedColumns: ["id"]
          },
        ]
      }
      item: {
        Row: {
          grupo_id: number
          id: number
          nome: string
        }
        Insert: {
          grupo_id: number
          id?: number
          nome: string
        }
        Update: {
          grupo_id?: number
          id?: number
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupo"
            referencedColumns: ["id"]
          },
        ]
      }
      natureza: {
        Row: {
          descricao: string | null
          id: number
          nome: string
        }
        Insert: {
          descricao?: string | null
          id?: number
          nome: string
        }
        Update: {
          descricao?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      pessoas: {
        Row: {
          criado_em: string
          id: number
          nome: string
          tipo: Database["public"]["Enums"]["tipo_pessoa"]
        }
        Insert: {
          criado_em?: string
          id?: number
          nome: string
          tipo: Database["public"]["Enums"]["tipo_pessoa"]
        }
        Update: {
          criado_em?: string
          id?: number
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_pessoa"]
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          atualizado_em: string
          conta_destino_id: number | null
          conta_origem_id: number | null
          criado_em: string
          grupo_id: number
          id: number
          item_id: number
          natureza_id: number
          nome: string
          pessoa_id: number | null
          status: Database["public"]["Enums"]["status_transacao"]
          temperatura:
            | Database["public"]["Enums"]["temperatura_transacao"]
            | null
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor: number
          vencimento: string
        }
        Insert: {
          atualizado_em?: string
          conta_destino_id?: number | null
          conta_origem_id?: number | null
          criado_em?: string
          grupo_id: number
          id?: number
          item_id: number
          natureza_id: number
          nome: string
          pessoa_id?: number | null
          status: Database["public"]["Enums"]["status_transacao"]
          temperatura?:
            | Database["public"]["Enums"]["temperatura_transacao"]
            | null
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor: number
          vencimento: string
        }
        Update: {
          atualizado_em?: string
          conta_destino_id?: number | null
          conta_origem_id?: number | null
          criado_em?: string
          grupo_id?: number
          id?: number
          item_id?: number
          natureza_id?: number
          nome?: string
          pessoa_id?: number | null
          status?: Database["public"]["Enums"]["status_transacao"]
          temperatura?:
            | Database["public"]["Enums"]["temperatura_transacao"]
            | null
          tipo?: Database["public"]["Enums"]["tipo_transacao"]
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "saldo_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "saldo_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_natureza_id_fkey"
            columns: ["natureza_id"]
            isOneToOne: false
            referencedRelation: "natureza"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "ltv_clientes"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "transacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      calendario: {
        Row: {
          atrasado: boolean | null
          conta_origem: string | null
          dias_para_vencer: number | null
          grupo: string | null
          id: number | null
          item: string | null
          natureza: string | null
          nome: string | null
          pessoa: string | null
          status: Database["public"]["Enums"]["status_transacao"] | null
          tipo: Database["public"]["Enums"]["tipo_transacao"] | null
          valor: number | null
          vencimento: string | null
        }
        Relationships: []
      }
      ltv_clientes: {
        Row: {
          cliente: string | null
          ltv_total: number | null
          pessoa_id: number | null
          primeira_transacao: string | null
          tipo: Database["public"]["Enums"]["tipo_pessoa"] | null
          total_transacoes: number | null
          ultima_transacao: string | null
        }
        Relationships: []
      }
      receita_por_servico: {
        Row: {
          grupo: string | null
          mes: string | null
          qtd_transacoes: number | null
          receita_total: number | null
          servico: string | null
        }
        Relationships: []
      }
      resumo_mensal: {
        Row: {
          capex: number | null
          crescimento: number | null
          custo_fixo: number | null
          custo_variavel: number | null
          despesa_total: number | null
          distribuicao_pablo: number | null
          distribuicao_sandoval: number | null
          geracao_caixa: number | null
          mes: string | null
          receita_bruta: number | null
          resultado: number | null
          total_socios: number | null
        }
        Relationships: []
      }
      saldo_contas: {
        Row: {
          conta: string | null
          id: number | null
          saldo_atual: number | null
          saldo_inicial: number | null
          total_entradas: number | null
          total_saidas: number | null
        }
        Relationships: []
      }
      transacoes_completas: {
        Row: {
          atualizado_em: string | null
          conta_destino: string | null
          conta_origem: string | null
          criado_em: string | null
          grupo: string | null
          id: number | null
          item: string | null
          natureza: string | null
          nome: string | null
          pessoa: string | null
          status: Database["public"]["Enums"]["status_transacao"] | null
          temperatura:
            | Database["public"]["Enums"]["temperatura_transacao"]
            | null
          tipo: Database["public"]["Enums"]["tipo_transacao"] | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"] | null
          valor: number | null
          vencimento: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      status_transacao: "A Pagar" | "A Receber" | "Atrasada" | "Concluído"
      temperatura_transacao: "Quente" | "Frio"
      tipo_pessoa: "Cliente" | "Fornecedor"
      tipo_transacao: "Receita" | "Despesa" | "Transferência"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      status_transacao: ["A Pagar", "A Receber", "Atrasada", "Concluído"],
      temperatura_transacao: ["Quente", "Frio"],
      tipo_pessoa: ["Cliente", "Fornecedor"],
      tipo_transacao: ["Receita", "Despesa", "Transferência"],
    },
  },
} as const
