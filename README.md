# Hojutsu.pt

Blog sobre armas, história e curiosidades, feito com [Astro](https://astro.build). Cada artigo é um ficheiro Markdown em `src/content/artigos/`.

## Como correr

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera a pasta dist/
npm run preview  # pré-visualiza o build
```

## Endereços (GitHub Pages e localhost)

- **Desenvolvimento:** `npm run dev` abre em http://localhost:4321 (base `/`).
- **GitHub Pages:** https://eduardohayashi.github.io/hojutsu (base `/hojutsu`). O `npm run build` e o `npm run preview` já usam esse base.
- **Domínio próprio:** `SITE_URL=https://hojutsu.pt BASE_PATH=/ npm run build`.

Todos os links e imagens passam pela função `url()` de `src/utils/url.ts`, que acrescenta o base automaticamente. Nos artigos, o campo `imagem` escreve-se como `/imagens/ficheiro.jpg`, sem o base.

### Publicação no GitHub Pages

O ficheiro `.github/workflows/deploy.yml` faz o build e publica a cada push na `main`. Uma única vez, no repositório do GitHub, vá a **Settings → Pages → Build and deployment** e escolha **Source: GitHub Actions**.

## Estrutura

```
hojutsu/
├── astro.config.mjs
├── package.json
├── public/
│   ├── favicon.svg
│   ├── logo1.webp            # logo em fundo claro
│   ├── logo2.webp            # logo em fundo escuro (usado na página inicial e na partilha)
│   ├── robots.txt
│   └── imagens/              # imagens dos artigos (ex.: /imagens/tanegashima.jpg)
└── src/
    ├── content.config.ts     # esquema dos campos de cada artigo e categorias
    ├── content/artigos/      # um artigo = um ficheiro .md
    ├── components/           # Header, Footer, ArtigoCard
    ├── layouts/Base.astro    # estrutura comum das páginas (SEO incluído)
    ├── pages/
    │   ├── index.astro       # página inicial
    │   ├── sobre.astro
    │   ├── artigos/          # lista e página de cada artigo (com dados estruturados)
    │   └── categoria/        # armas, história e curiosidades
    ├── styles/global.css     # cores (vermelho, ouro e carvão do logo), tipografia e layout
    └── utils/
```

## Formato de um artigo

Campos do cabeçalho (frontmatter): `titulo`, `resumo`, `data`, `categoria` (`armas`, `historia` ou `curiosidades`), `tempoLeituraMinutos`, `tags`, `fontes`, `imagem`, `imagemAlt`, `revisadoPor` e `rascunho`.

O nome do ficheiro vira o endereço (`tanegashima.md` → `/artigos/tanegashima`). A imagem é o campo `imagem`, se existir; senão, o site procura `public/imagens/<nome-do-ficheiro>.jpg`.

## Fluxo de publicação (igual ao naturalmentedoce)

1. O agente (n8n) gera os artigos da semana e regista-os na planilha de revisão.
2. O revisor aprova ou ajusta os artigos.
3. Os aprovados são commitados no repositório (`.md` em `src/content/artigos/` e imagem em `public/imagens/`) e o GitHub Actions publica o site.

## Pendências

- [ ] Rever os três artigos de exemplo (ou marcar `rascunho: true`) antes de publicar
- [ ] Criar o repositório no GitHub e fazer o primeiro push
- [ ] Definir o domínio hojutsu.pt (ver "Endereços")
- [ ] Criar os workflows do n8n e a planilha de revisão
- [ ] Adicionar sitemap (`@astrojs/sitemap`) quando houver domínio
