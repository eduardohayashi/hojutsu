import fs from 'node:fs';
import path from 'node:path';
import type { CollectionEntry } from 'astro:content';

/**
 * Caminho (sem o base) da imagem de um artigo, ou undefined se não houver.
 *
 * 1. Usa o campo `imagem` do cabeçalho do artigo, se existir.
 * 2. Senão, procura por convenção `public/imagens/<nome-do-ficheiro-do-artigo>.jpg`,
 *    que é onde o fluxo do n8n grava a imagem.
 */
export function imagemDoArtigo(artigo: CollectionEntry<'artigos'>): string | undefined {
  if (artigo.data.imagem) return artigo.data.imagem;

  const ficheiro = path.join(process.cwd(), 'public', 'imagens', `${artigo.id}.jpg`);
  return fs.existsSync(ficheiro) ? `/imagens/${artigo.id}.jpg` : undefined;
}

export function formatarData(data: Date): string {
  return data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
