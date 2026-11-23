/**
 * Monta um endereço interno respeitando o `base` do Astro.
 *
 * - Em desenvolvimento (localhost:4321) o base é "/", então url('/artigos') → "/artigos".
 * - No GitHub Pages o base é "/hojutsu", então url('/artigos') → "/hojutsu/artigos".
 *
 * Endereços externos (http/https) passam sem alteração.
 */
export function url(caminho = '/'): string {
  if (/^https?:\/\//i.test(caminho)) return caminho;

  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const resto = caminho.replace(/^\/+/, '');

  return resto ? `${base}/${resto}` : `${base}/`;
}
