/* O que a função lê do ambiente e os prazos que o corte de 150 s impõe.
   Tudo aqui é ajustável sem mexer no resto. */

import { createClient } from "npm:@supabase/supabase-js@2.117.0";

export const MODELO = "claude-opus-5-5";

/* As cercas, ajustáveis sem novo deploy: `supabase secrets set`.
   LIMITE_POR_DIA conta jogos; um jogo é o plano mais, por missão, uma parte
   e uma lição, até MAX_PARTES pedidos (200 questões são ~17 missões: o
   plano, 34 pedidos e folga para tentar de novo). */
export const LIMITE_POR_DIA = Number(Deno.env.get("LIMITE_POR_DIA") ?? 3);
export const LIMITE_LEITURAS = Number(Deno.env.get("LIMITE_LEITURAS") ?? 10);
export const MAX_PARTES = Number(Deno.env.get("MAX_PARTES") ?? 60);
export const TETO_DIA_USD = Number(Deno.env.get("TETO_DIA_USD") ?? 15);
/* Quanto uma geração em curso pesa no teto antes de se saber o custo real.
   Material no limite, vinte questões e duas rodadas ficam abaixo disto. */
export const ESTIMATIVA_USD = 0.6;

/* O plano grátis corta a função em 150 s. Regerar só começa se sobrar folga
   para a troca terminar; a chamada ao modelo desiste antes do corte, para o
   custo ainda ser registrado. */
export const SO_REGERA_ATE_MS = 75_000;
export const ESPERA_MAXIMA_MS = 140_000;

export const admin = createClient(Deno.env.get("SUPABASE_URL")!,
                                  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                                  { auth: { persistSession: false } });

/* Quem chama `trabalhar` prova que é a própria função ou o relógio do banco:
   o segredo mora nos secrets da função e no Vault (GERAR.md, "A fila"). */
export const TRABALHO_SEGREDO = Deno.env.get("TRABALHO_SEGREDO") ?? "";
export const ENDERECO = Deno.env.get("SUPABASE_URL") + "/functions/v1/gerar";
/* Até quando quem pegou a tarefa tem a vez: passa do corte de 150 s. */
export const PRAZO_S = 180;
