// Gera as imagens do carrossel do Instagram (1080x1350, JPEG) a partir do
// campo `carrossel` do cabeçalho de cada artigo. Corre antes do build.
//
//   node scripts/gerar-slides.mjs
//
// Resultado: public/instagram/<artigo>/1.jpg, 2.jpg ... e slides.json
// (a lista das imagens, que o n8n lê para montar o post do Instagram).
// A pasta public/instagram está no .gitignore: é recriada a cada build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';
import { parse as lerYaml } from 'yaml';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_ARTIGOS = path.join(raiz, 'src', 'content', 'artigos');
const PASTA_SAIDA = path.join(raiz, 'public', 'instagram');
const ARQUIVO_LOGO = path.join(raiz, 'public', 'logo2.webp');

const MARCA = 'HOJUTSU.PT';
const SITE = 'hojutsu.pt';
const LARGURA = 1080;
const ALTURA = 1350; // 4:5, a proporção que mais ocupa o feed do Instagram
const MAX_SLIDES = 9; // o Instagram aceita 10 imagens; uma é o slide final

const COR = {
  fundo: '#171a21',
  fundoClaro: '#262b37',
  vermelho: '#8e1b1b',
  vermelhoClaro: '#e0584f',
  ouro: '#c19a3e',
  ouroClaro: '#e3c677',
  papel: '#f7f3ea',
  texto: '#dcd6c8',
  suave: '#9a9484',
};

const ROTULO_TIPO = {
  mito_ou_fato: 'MITO OU FATO',
  linha_do_tempo: 'LINHA DO TEMPO',
  anatomia: 'ANATOMIA',
  curiosidades: 'CURIOSIDADES',
  explicado: 'EXPLICADO',
};

// Fontes (arquivos .woff dos pacotes @fontsource). A variante "Ext" cobre
// caracteres como o "ō" de hōjutsu.
const fonte = (pacote, arquivo) =>
  fs.readFileSync(path.join(raiz, 'node_modules', '@fontsource', pacote, 'files', arquivo));
const FONTES = [
  { name: 'Serif', data: fonte('noto-serif', 'noto-serif-latin-700-normal.woff'), weight: 700, style: 'normal' },
  { name: 'SerifExt', data: fonte('noto-serif', 'noto-serif-latin-ext-700-normal.woff'), weight: 700, style: 'normal' },
  { name: 'Sans', data: fonte('inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'SansExt', data: fonte('inter', 'inter-latin-ext-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Sans', data: fonte('inter', 'inter-latin-600-normal.woff'), weight: 600, style: 'normal' },
  { name: 'SansExt', data: fonte('inter', 'inter-latin-ext-600-normal.woff'), weight: 600, style: 'normal' },
];
const SERIF = 'Serif, SerifExt';
const SANS = 'Sans, SansExt';

// Atalho para montar os elementos que o satori entende (sem React).
const h = (estilo, filhos) => ({ type: 'div', props: { style: { display: 'flex', ...estilo }, children: filhos } });

async function carregarLogo() {
  if (!fs.existsSync(ARQUIVO_LOGO)) return null;
  const largura = 640;
  const buf = await sharp(ARQUIVO_LOGO).resize({ width: largura }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  return { src: 'data:image/png;base64,' + buf.toString('base64'), width: meta.width, height: meta.height };
}

function imagemLogo(logo) {
  if (!logo) return h({}, []);
  return { type: 'img', props: { src: logo.src, width: logo.width, height: logo.height, style: { borderRadius: 24 } } };
}

function moldura(indice, total, conteudo) {
  const topo = h({ justifyContent: 'space-between', alignItems: 'center' }, [
    h({ fontFamily: SANS, fontWeight: 600, fontSize: 28, letterSpacing: 6, color: COR.ouroClaro }, MARCA),
    h({ fontFamily: SANS, fontWeight: 600, fontSize: 28, color: COR.suave }, `${indice}/${total}`),
  ]);
  const rodape = h({ alignItems: 'center', gap: 20 }, [
    h({ width: 80, height: 4, background: COR.ouro }, []),
    h({ fontFamily: SANS, fontSize: 26, color: COR.suave, letterSpacing: 2 }, SITE),
  ]);
  return h(
    {
      width: LARGURA,
      height: ALTURA,
      flexDirection: 'column',
      background: `linear-gradient(160deg, ${COR.fundoClaro} 0%, ${COR.fundo} 62%)`,
      color: COR.papel,
    },
    [
      h({ width: LARGURA, height: 14, background: COR.vermelho }, []),
      h({ flexDirection: 'column', flexGrow: 1, padding: '52px 84px 60px' }, [
        topo,
        h({ flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, conteudo),
        rodape,
      ]),
    ],
  );
}

const tamanhoTitulo = (t, grande, medio, pequeno) => (t.length <= 40 ? grande : t.length <= 80 ? medio : pequeno);

function slideCapa(slide, tipo, indice, total, logo) {
  const titulo = String(slide.titulo || '');
  const etiqueta = ROTULO_TIPO[tipo] || String(tipo || '').replace(/_/g, ' ').toUpperCase();
  return moldura(indice, total, [
    h({ alignSelf: 'flex-start', background: COR.vermelho, padding: '10px 26px', borderRadius: 999, marginBottom: 44 }, [
      h({ fontFamily: SANS, fontWeight: 600, fontSize: 28, letterSpacing: 5, color: COR.papel }, etiqueta),
    ]),
    h({ fontFamily: SERIF, fontWeight: 700, fontSize: tamanhoTitulo(titulo, 100, 84, 68), lineHeight: 1.12, color: COR.papel }, titulo),
    slide.texto
      ? h({ fontFamily: SANS, fontSize: 40, lineHeight: 1.4, color: COR.texto, marginTop: 36 }, String(slide.texto))
      : h({}, []),
    h({ marginTop: 64 }, [imagemLogo(logo)]),
  ]);
}

function slideConteudo(slide, indice, total) {
  const rotulo = String(slide.rotulo || '');
  const rotuloMaiusculo = rotulo.toUpperCase();
  const cor = rotuloMaiusculo === 'MITO' ? COR.vermelhoClaro : COR.ouroClaro;
  const tamanhoRotulo = rotulo.length <= 4 ? 170 : rotulo.length <= 8 ? 120 : rotulo.length <= 16 ? 76 : 56;
  const texto = String(slide.texto || '');
  const tamanhoTexto = texto.length > 340 ? 32 : texto.length > 260 ? 36 : 42;
  const titulo = String(slide.titulo || '');
  return moldura(indice, total, [
    rotulo
      ? h({ fontFamily: SERIF, fontWeight: 700, fontSize: tamanhoRotulo, lineHeight: 1.05, color: cor }, rotulo)
      : h({}, []),
    h({ width: 120, height: 6, background: COR.ouro, marginTop: 28, marginBottom: 36 }, []),
    titulo
      ? h({ fontFamily: SERIF, fontWeight: 700, fontSize: tamanhoTitulo(titulo, 64, 56, 48), lineHeight: 1.18, color: COR.papel, marginBottom: 32 }, titulo)
      : h({}, []),
    texto
      ? h({ fontFamily: SANS, fontSize: tamanhoTexto, lineHeight: 1.45, color: COR.texto }, texto)
      : h({}, []),
  ]);
}

function slideFinal(tituloArtigo, indice, total, logo) {
  return moldura(indice, total, [
    h({ fontFamily: SERIF, fontWeight: 700, fontSize: 80, lineHeight: 1.12, color: COR.papel }, 'Leia o artigo completo'),
    h({ fontFamily: SANS, fontSize: 38, lineHeight: 1.4, color: COR.texto, marginTop: 32 }, String(tituloArtigo || '')),
    h({ alignSelf: 'flex-start', background: COR.vermelho, padding: '14px 34px', borderRadius: 999, marginTop: 56 }, [
      h({ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: COR.papel }, 'Link na bio'),
    ]),
    h({ fontFamily: SERIF, fontWeight: 700, fontSize: 64, color: COR.ouroClaro, marginTop: 36 }, SITE),
    h({ marginTop: 56 }, [imagemLogo(logo)]),
  ]);
}

async function gravarSlide(no, destino) {
  const svg = await satori(no, { width: LARGURA, height: ALTURA, fonts: FONTES });
  await sharp(Buffer.from(svg)).flatten({ background: COR.fundo }).jpeg({ quality: 90, mozjpeg: true }).toFile(destino);
}

function lerArtigo(arquivo) {
  const bruto = fs.readFileSync(arquivo, 'utf-8');
  const m = bruto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? lerYaml(m[1]) : null;
}

async function main() {
  fs.rmSync(PASTA_SAIDA, { recursive: true, force: true });
  if (!fs.existsSync(PASTA_ARTIGOS)) return;

  const logo = await carregarLogo();
  let gerados = 0;

  for (const nome of fs.readdirSync(PASTA_ARTIGOS).filter((n) => n.endsWith('.md'))) {
    const slug = nome.replace(/\.md$/, '');
    try {
      const dados = lerArtigo(path.join(PASTA_ARTIGOS, nome));
      const carrossel = dados && dados.carrossel;
      if (!dados || dados.rascunho || !carrossel || !Array.isArray(carrossel.slides) || carrossel.slides.length === 0) continue;

      let slides = carrossel.slides.slice(0, MAX_SLIDES);
      if (slides[0].tipo !== 'capa') slides = [{ tipo: 'capa', titulo: dados.titulo, texto: dados.resumo }, ...slides.slice(0, MAX_SLIDES - 1)];
      const total = slides.length + 1; // + slide final

      const pasta = path.join(PASTA_SAIDA, slug);
      fs.mkdirSync(pasta, { recursive: true });

      const imagens = [];
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const no = s.tipo === 'capa' ? slideCapa(s, carrossel.tipo, i + 1, total, logo) : slideConteudo(s, i + 1, total);
        const arquivo = `${i + 1}.jpg`;
        await gravarSlide(no, path.join(pasta, arquivo));
        imagens.push(arquivo);
      }
      const arquivoFinal = `${total}.jpg`;
      await gravarSlide(slideFinal(dados.titulo, total, total, logo), path.join(pasta, arquivoFinal));
      imagens.push(arquivoFinal);

      fs.writeFileSync(path.join(pasta, 'slides.json'), JSON.stringify({ tipo: carrossel.tipo || '', imagens }, null, 2));
      gerados++;
      console.log(`[slides] ${slug}: ${imagens.length} imagens`);
    } catch (erro) {
      // Um carrossel com problema não deve impedir o site de ser publicado.
      console.warn(`[slides] ${slug}: não foi possível gerar (${erro.message})`);
    }
  }
  console.log(`[slides] ${gerados} carrossel(is) gerado(s)`);
}

main();
