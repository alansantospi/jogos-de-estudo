/* A resposta de toda ação: JSON, com CORS. */

/* A autorização vai no cabeçalho, não em cookie: liberar qualquer origem
   não abre nada que o token não abra. */
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const responder = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), {
    status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });
export const erro = (status: number, codigo: string, mensagem: string, extra = {}) =>
  responder(status, { erro: codigo, mensagem, ...extra });
