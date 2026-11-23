import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const CATEGORIAS = {
  armas: 'Armas',
  historia: 'História',
  curiosidades: 'Curiosidades',
} as const;

// Os campos espelham as colunas da planilha de revisão,
// para o agente (n8n) conseguir gerar um ficheiro .md por artigo aprovado.
const artigos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artigos' }),
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    data: z.coerce.date(),
    categoria: z.enum(['armas', 'historia', 'curiosidades']),
    tempoLeituraMinutos: z.number().int().positive().default(5),
    tags: z.array(z.string()).default([]),
    fontes: z.array(z.string()).default([]), // obras ou ligações consultadas
    imagem: z.string().optional(), // ex.: /imagens/tanegashima.jpg
    imagemAlt: z.string().optional(),
    revisadoPor: z.string().optional(), // preencher quando o revisor aprovar
    rascunho: z.boolean().default(false),
  }),
});

export const collections = { artigos };
