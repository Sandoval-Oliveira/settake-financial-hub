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
    PostgrestVersion: "14.5"
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
      crm_config_areas_atuacao: {
        Row: {
          ativo: boolean
          criado_em: string
          id: number
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      crm_config_origens: {
        Row: {
          ativo: boolean
          criado_em: string
          id: number
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      crm_config_segmentos: {
        Row: {
          ativo: boolean
          criado_em: string
          id: number
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: number
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      crm_funil_etapas: {
        Row: {
          cor: string
          funil: Database["public"]["Enums"]["crm_funil_tipo"]
          id: number
          nome: string
          ordem: number
          tipo_final: string | null
        }
        Insert: {
          cor?: string
          funil: Database["public"]["Enums"]["crm_funil_tipo"]
          id?: number
          nome: string
          ordem: number
          tipo_final?: string | null
        }
        Update: {
          cor?: string
          funil?: Database["public"]["Enums"]["crm_funil_tipo"]
          id?: number
          nome?: string
          ordem?: number
          tipo_final?: string | null
        }
        Relationships: []
      }
      crm_interacoes: {
        Row: {
          criado_em: string
          descricao: string
          id: number
          lead_id: number | null
          oportunidade_id: number | null
          pessoa_id: number | null
          tipo: Database["public"]["Enums"]["crm_tipo_interacao"]
        }
        Insert: {
          criado_em?: string
          descricao: string
          id?: number
          lead_id?: number | null
          oportunidade_id?: number | null
          pessoa_id?: number | null
          tipo: Database["public"]["Enums"]["crm_tipo_interacao"]
        }
        Update: {
          criado_em?: string
          descricao?: string
          id?: number
          lead_id?: number | null
          oportunidade_id?: number | null
          pessoa_id?: number | null
          tipo?: Database["public"]["Enums"]["crm_tipo_interacao"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interacoes_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interacoes_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_aniversariantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_nutricao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_vendas"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_interacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "ltv_clientes"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_interacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          atualizado_em: string
          convertido: boolean
          criado_em: string
          email: string | null
          etapa_id: number
          id: number
          instagram: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          pessoa_id: number | null
          quem_indicou: string | null
          segmento: string | null
          whatsapp: string | null
        }
        Insert: {
          atualizado_em?: string
          convertido?: boolean
          criado_em?: string
          email?: string | null
          etapa_id: number
          id?: number
          instagram?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          pessoa_id?: number | null
          quem_indicou?: string | null
          segmento?: string | null
          whatsapp?: string | null
        }
        Update: {
          atualizado_em?: string
          convertido?: boolean
          criado_em?: string
          email?: string | null
          etapa_id?: number
          id?: number
          instagram?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          pessoa_id?: number | null
          quem_indicou?: string | null
          segmento?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "crm_funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_aniversariantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_nutricao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_vendas"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_leads_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "ltv_clientes"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_leads_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_oportunidades: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_fechamento: string | null
          etapa_id: number
          id: number
          item_id: number | null
          motivo_perda: string | null
          nome: string
          origem: string | null
          pessoa_id: number
          resultado:
            | Database["public"]["Enums"]["crm_resultado_oportunidade"]
            | null
          valor: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_fechamento?: string | null
          etapa_id: number
          id?: number
          item_id?: number | null
          motivo_perda?: string | null
          nome: string
          origem?: string | null
          pessoa_id: number
          resultado?:
            | Database["public"]["Enums"]["crm_resultado_oportunidade"]
            | null
          valor?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_fechamento?: string | null
          etapa_id?: number
          id?: number
          item_id?: number | null
          motivo_perda?: string | null
          nome?: string
          origem?: string | null
          pessoa_id?: number
          resultado?:
            | Database["public"]["Enums"]["crm_resultado_oportunidade"]
            | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_oportunidades_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "crm_funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_oportunidades_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_oportunidades_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_aniversariantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_oportunidades_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_nutricao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_oportunidades_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_vendas"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_oportunidades_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "ltv_clientes"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_oportunidades_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tarefas: {
        Row: {
          atualizado_em: string
          concluida_em: string | null
          criado_em: string
          descricao: string | null
          id: number
          lead_id: number | null
          oportunidade_id: number | null
          pessoa_id: number | null
          prazo: string | null
          prioridade: Database["public"]["Enums"]["crm_prioridade_tarefa"]
          status: Database["public"]["Enums"]["crm_status_tarefa"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          concluida_em?: string | null
          criado_em?: string
          descricao?: string | null
          id?: number
          lead_id?: number | null
          oportunidade_id?: number | null
          pessoa_id?: number | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["crm_prioridade_tarefa"]
          status?: Database["public"]["Enums"]["crm_status_tarefa"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          concluida_em?: string | null
          criado_em?: string
          descricao?: string | null
          id?: number
          lead_id?: number | null
          oportunidade_id?: number | null
          pessoa_id?: number | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["crm_prioridade_tarefa"]
          status?: Database["public"]["Enums"]["crm_status_tarefa"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tarefas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tarefas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tarefas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tarefas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tarefas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_aniversariantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tarefas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_nutricao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tarefas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_vendas"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_tarefas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "ltv_clientes"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "crm_tarefas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
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
      metas_financeiras: {
        Row: {
          ano: number
          atualizado_em: string
          criado_em: string
          id: number
          mes: number
          meta_despesas: number
          meta_faturamento: number
          meta_lucro: number
        }
        Insert: {
          ano: number
          atualizado_em?: string
          criado_em?: string
          id?: number
          mes: number
          meta_despesas?: number
          meta_faturamento?: number
          meta_lucro?: number
        }
        Update: {
          ano?: number
          atualizado_em?: string
          criado_em?: string
          id?: number
          mes?: number
          meta_despesas?: number
          meta_faturamento?: number
          meta_lucro?: number
        }
        Relationships: []
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
          aniversario: string | null
          area_atuacao: string | null
          cpf_cnpj: string | null
          criado_em: string
          email: string | null
          endereco: string | null
          etapa_nutricao_id: number | null
          id: number
          instagram: string | null
          lead_origem_id: number | null
          nome: string
          origem: string | null
          quem_indicou: string | null
          segmento: string | null
          tipo: Database["public"]["Enums"]["tipo_pessoa"]
          whatsapp: string | null
        }
        Insert: {
          aniversario?: string | null
          area_atuacao?: string | null
          cpf_cnpj?: string | null
          criado_em?: string
          email?: string | null
          endereco?: string | null
          etapa_nutricao_id?: number | null
          id?: number
          instagram?: string | null
          lead_origem_id?: number | null
          nome: string
          origem?: string | null
          quem_indicou?: string | null
          segmento?: string | null
          tipo: Database["public"]["Enums"]["tipo_pessoa"]
          whatsapp?: string | null
        }
        Update: {
          aniversario?: string | null
          area_atuacao?: string | null
          cpf_cnpj?: string | null
          criado_em?: string
          email?: string | null
          endereco?: string | null
          etapa_nutricao_id?: number | null
          id?: number
          instagram?: string | null
          lead_origem_id?: number | null
          nome?: string
          origem?: string | null
          quem_indicou?: string | null
          segmento?: string | null
          tipo?: Database["public"]["Enums"]["tipo_pessoa"]
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pessoas_lead_origem"
            columns: ["lead_origem_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pessoas_lead_origem"
            columns: ["lead_origem_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoas_etapa_nutricao_id_fkey"
            columns: ["etapa_nutricao_id"]
            isOneToOne: false
            referencedRelation: "crm_funil_etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          atualizado_em: string
          conciliada: boolean
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
          conciliada?: boolean
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
          conciliada?: boolean
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
            referencedRelation: "crm_aniversariantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_nutricao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_vendas"
            referencedColumns: ["pessoa_id"]
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
      crm_aniversariantes: {
        Row: {
          aniversario: string | null
          area_atuacao: string | null
          dias_para_aniversario: number | null
          email: string | null
          etapa_nutricao_id: number | null
          id: number | null
          ltv_total: number | null
          nome: string | null
          proximo_aniversario: string | null
          segmento: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_etapa_nutricao_id_fkey"
            columns: ["etapa_nutricao_id"]
            isOneToOne: false
            referencedRelation: "crm_funil_etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_metricas_conversao: {
        Row: {
          leads_convertidos: number | null
          leads_desqualificados: number | null
          mes: string | null
          oportunidades_ganhas: number | null
          oportunidades_perdidas: number | null
          origem_ads: number | null
          origem_ig_organico: number | null
          origem_indicacao: number | null
          origem_wpp_organico: number | null
          taxa_conversao_lead_pct: number | null
          taxa_conversao_oportunidade_pct: number | null
          ticket_medio: number | null
          total_leads: number | null
          total_oportunidades: number | null
          valor_ganho: number | null
        }
        Relationships: []
      }
      crm_pipeline_leads: {
        Row: {
          atualizado_em: string | null
          convertido: boolean | null
          criado_em: string | null
          dias_na_etapa: number | null
          dias_no_funil: number | null
          email: string | null
          etapa: string | null
          etapa_cor: string | null
          etapa_ordem: number | null
          id: number | null
          instagram: string | null
          nome: string | null
          observacoes: string | null
          origem: string | null
          quem_indicou: string | null
          segmento: string | null
          tarefas_pendentes: number | null
          tipo_final: string | null
          whatsapp: string | null
        }
        Relationships: []
      }
      crm_pipeline_nutricao: {
        Row: {
          aniversario: string | null
          area_atuacao: string | null
          email: string | null
          etapa_cor: string | null
          etapa_nutricao: string | null
          etapa_ordem: number | null
          id: number | null
          ltv_total: number | null
          nome: string | null
          origem: string | null
          segmento: string | null
          tarefas_pendentes: number | null
          total_transacoes: number | null
          ultima_transacao: string | null
          whatsapp: string | null
        }
        Relationships: []
      }
      crm_pipeline_vendas: {
        Row: {
          area_atuacao: string | null
          atualizado_em: string | null
          criado_em: string | null
          data_fechamento: string | null
          dias_na_etapa: number | null
          dias_no_funil: number | null
          etapa: string | null
          etapa_cor: string | null
          etapa_ordem: number | null
          id: number | null
          ltv_atual: number | null
          motivo_perda: string | null
          oportunidade: string | null
          origem: string | null
          pessoa: string | null
          pessoa_id: number | null
          resultado:
            | Database["public"]["Enums"]["crm_resultado_oportunidade"]
            | null
          segmento: string | null
          servico: string | null
          servico_grupo: string | null
          tarefas_pendentes: number | null
          tipo_final: string | null
          transacoes_concluidas: number | null
          valor: number | null
          whatsapp: string | null
        }
        Relationships: []
      }
      crm_tarefas_pendentes: {
        Row: {
          atrasada: boolean | null
          criado_em: string | null
          descricao: string | null
          dias_para_prazo: number | null
          id: number | null
          lead_nome: string | null
          lead_whatsapp: string | null
          oportunidade_nome: string | null
          oportunidade_valor: number | null
          pessoa_nome: string | null
          pessoa_whatsapp: string | null
          prazo: string | null
          prioridade:
            | Database["public"]["Enums"]["crm_prioridade_tarefa"]
            | null
          prioridade_peso: number | null
          status: Database["public"]["Enums"]["crm_status_tarefa"] | null
          titulo: string | null
        }
        Relationships: []
      }
      crm_valor_pipeline: {
        Row: {
          cor: string | null
          etapa: string | null
          media_dias_no_funil: number | null
          ordem: number | null
          qtd_oportunidades: number | null
          ticket_medio: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      dashboard_financeiro: {
        Row: {
          ano: number | null
          custos_deducoes: number | null
          custos_deducoes_pct: number | null
          desp_capex: number | null
          desp_crescimento: number | null
          desp_var_comercial: number | null
          desp_var_estrutura: number | null
          desp_var_mobilidade: number | null
          despesas_fixas: number | null
          despesas_fixas_pct: number | null
          despesas_nao_op_pct: number | null
          despesas_nao_operacionais: number | null
          despesas_variaveis: number | null
          despesas_variaveis_pct: number | null
          ebitda: number | null
          ebitda_pct: number | null
          ebitda_var_pct: number | null
          fat_bruto_participacao_pct: number | null
          fat_bruto_var_pct: number | null
          faturamento_bruto: number | null
          geracao_caixa_pct: number | null
          geracao_caixa_var_pct: number | null
          lucro_bruto: number | null
          lucro_bruto_pct: number | null
          lucro_bruto_var_pct: number | null
          lucro_liquido: number | null
          lucro_liquido_pct: number | null
          lucro_liquido_var_pct: number | null
          margem_contribuicao: number | null
          margem_contribuicao_pct: number | null
          margem_var_pct: number | null
          mes_num: number | null
          periodo: string | null
          periodo_curto: string | null
          receita_financeira: number | null
          receita_vendas: number | null
          resultado_antes_socios: number | null
          socios: number | null
          socios_pct: number | null
          total_despesas: number | null
          total_despesas_pct: number | null
        }
        Relationships: []
      }
      dashboard_financeiro_graficos: {
        Row: {
          ano: number | null
          custos_deducoes: number | null
          despesas_fixas: number | null
          despesas_nao_operacionais: number | null
          despesas_variaveis: number | null
          ebitda: number | null
          ebitda_pct: number | null
          faturamento_bruto: number | null
          lucro_bruto: number | null
          lucro_liquido: number | null
          lucro_liquido_pct: number | null
          margem_contribuicao: number | null
          margem_contribuicao_pct: number | null
          mes_num: number | null
          meta_desp_consumida_pct: number | null
          meta_despesas: number | null
          meta_fat_atingida_pct: number | null
          meta_faturamento: number | null
          meta_lucro: number | null
          meta_lucro_atingida_pct: number | null
          periodo: string | null
          periodo_curto: string | null
          socios: number | null
          total_despesas: number | null
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
          conciliada: boolean | null
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
      crm_funil_tipo: "leads" | "vendas" | "nutricao"
      crm_prioridade_tarefa: "Baixa" | "Média" | "Alta" | "Urgente"
      crm_resultado_oportunidade: "Ganho" | "Perdido"
      crm_status_tarefa: "Pendente" | "Em Andamento" | "Concluída" | "Cancelada"
      crm_tipo_interacao: "Nota" | "Ligação" | "WhatsApp" | "Email" | "Reunião"
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
      crm_funil_tipo: ["leads", "vendas", "nutricao"],
      crm_prioridade_tarefa: ["Baixa", "Média", "Alta", "Urgente"],
      crm_resultado_oportunidade: ["Ganho", "Perdido"],
      crm_status_tarefa: ["Pendente", "Em Andamento", "Concluída", "Cancelada"],
      crm_tipo_interacao: ["Nota", "Ligação", "WhatsApp", "Email", "Reunião"],
      status_transacao: ["A Pagar", "A Receber", "Atrasada", "Concluído"],
      temperatura_transacao: ["Quente", "Frio"],
      tipo_pessoa: ["Cliente", "Fornecedor"],
      tipo_transacao: ["Receita", "Despesa", "Transferência"],
    },
  },
} as const
