// LINE特典「工務店向け AI社員の作り方マニュアル」を manual.md から作る。
//   1) manual.md（「# 書き手メモ（PDFに入れない）」より前だけ）→ manual.html
//   2) manual.html → manual.pdf（A4縦・余白あり・ページ番号あり。Playwright＋Chromium）
// 使い方：node make-pdf.js            （html と pdf の両方を作り直す）
//         node make-pdf.js --html-only （html だけ作る）
// 配色：藍 #17324D・生成り #FAF6EE・山吹 #F2A93B（記事の見出し画像と同じ）。本文ページは白地に藍の文字。
// フォント：Google Fonts「Noto Sans JP」（SIL Open Font License）。読めないときはローカルの日本語ゴシック。

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SRC = path.join(DIR, 'manual.md');
const HTML = path.join(DIR, 'manual.html');
const PDF = path.join(DIR, 'manual.pdf');

// ---------- Markdown（このマニュアルで使っている書き方だけ）→ HTML ----------

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  // <br> だけは改行として残す
  const parts = s.split(/<br\s*\/?>/i).map((p) => esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'));
  return parts.join('<br>');
}

function splitRow(line) {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map((c) => c.trim());
}

// 表の種類（見出し行で見分ける）。書き込み欄の行の高さはここで決める
function tableKind(head) {
  const h = head.join('|');
  if (head[0] === '候補の仕事') return 'tpl tpl-check';
  if (head.length === 1 && head[0] === '最初の1人に任せる仕事') return 'tpl tpl-one';
  if (h === '項目|記入例（架空）|御社の場合') return 'tpl tpl-role';
  if (h === '項目|書くこと|御社の場合') return 'tpl tpl-rule';
  if (head[0] === '日付' && head[1].startsWith('直したこと')) return 'tpl tpl-memo';
  if (h === '確認|やらせないこと') return 'tpl tpl-ng';
  if (h === '見ること|記入欄') return 'tpl tpl-review';
  if (head[0] === '週') return 'info tbl-week';
  if (head[0] === '仕事の例') return 'info tbl-example';
  if (head[0] === '') return 'info tbl-overview';
  return 'info';
}

function renderTable(lines) {
  const head = splitRow(lines[0]);
  const rows = lines.slice(2).map(splitRow);
  const kind = tableKind(head);
  if (kind.includes('tpl-one')) {
    return `<table class="${kind}"><tbody><tr><th>${inline(head[0])}</th><td class="empty"></td></tr></tbody></table>\n`;
  }
  let out = `<table class="${kind}">\n<thead><tr>`;
  head.forEach((c, i) => { out += `<th class="c${i}">${inline(c)}</th>`; });
  out += '</tr></thead>\n<tbody>\n';
  rows.forEach((r) => {
    const isExample = r[0] && r[0].startsWith('記入例');
    const isBlank = r.every((c) => c === '' || c === '□');
    out += `<tr class="${isExample ? 'ex' : ''}${isBlank ? ' blank' : ''}">`;
    r.forEach((c, i) => {
      let cls = `c${i}`;
      if (c === '') cls += ' empty';
      if (c === '□') cls += ' box';
      let html = inline(c);
      // 振り返り表：「行」「個」は数字を書き込む単位、「Ａ・Ｂ・Ｃ」は○で囲む選択肢として組む
      if (kind.includes('tpl-review') && i === 1) {
        if (/^(行|個)$/.test(c)) html = `<span class="unit">${esc(c)}</span>`;
        else if (c.includes('・')) html = `<span class="choices">${c.split('・').map((x) => `<span>${esc(x)}</span>`).join('<i>・</i>')}</span>`;
      }
      // ルールシートの①②③は1行ずつ書ける高さにする
      if (kind.includes('tpl-rule') && c.startsWith('①')) {
        cls += ' multi';
        html = c.split(/<br\s*\/?>/i).map((x) => `<span class="mline">${esc(x)}</span>`).join('');
      }
      out += `<td class="${cls}">${html}</td>`;
    });
    out += '</tr>\n';
  });
  out += '</tbody></table>\n';
  return out;
}

// 文例（> が続く行）：1行ずつ別の行として組む。（ ）の中は書き換える所なので下線
function renderQuote(lines, isCover) {
  const texts = lines.map((l) => l.replace(/^>\s?/, ''));
  if (isCover) return `<p class="cover-lead">${inline(texts.join(''))}</p>\n`;
  if (texts.length === 1) return `<div class="note-box"><p>${inline(texts[0])}</p></div>\n`;
  const body = texts.map((t) => {
    let h = inline(t).replace(/（([^（）]*)）/g, '<span class="fill">（$1）</span>');
    const sep = t.startsWith('――') ? ' sep' : '';
    return `<div class="qline${sep}">${h}</div>`;
  }).join('\n');
  return `<div class="prompt-box">\n${body}\n</div>\n`;
}

function renderBlocks(lines) {
  let out = '';
  let i = 0;
  // 見出し(##)と直後の1ブロックを .keep で包み、見出しだけがページ末に残らないようにする
  let pendingH2 = null;
  const emit = (html) => {
    if (pendingH2 !== null) { out += `<div class="keep">\n${pendingH2}${html}</div>\n`; pendingH2 = null; }
    else out += html;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (line.startsWith('## ')) {
      if (pendingH2 !== null) { out += pendingH2; }
      pendingH2 = `<h2>${inline(line.slice(3))}</h2>\n`;
      i++; continue;
    }
    if (line.startsWith('|')) {
      const tl = [];
      while (i < lines.length && lines[i].startsWith('|')) tl.push(lines[i++]);
      emit(renderTable(tl)); continue;
    }
    if (line.startsWith('>')) {
      const ql = [];
      while (i < lines.length && lines[i].startsWith('>')) ql.push(lines[i++]);
      emit(renderQuote(ql, false)); continue;
    }
    if (/^\d+\.\s/.test(line)) {
      let html = '<ol>\n';
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const first = lines[i].replace(/^\d+\.\s/, '');
        i++;
        const cont = [];
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) cont.push(lines[i++].trim());
        html += `<li><span class="li-head">${inline(first)}</span>${cont.length ? `<span class="li-body">${inline(cont.join(''))}</span>` : ''}</li>\n`;
      }
      html += '</ol>\n';
      emit(html); continue;
    }
    if (line.startsWith('- ')) {
      let html = '<ul>\n';
      while (i < lines.length && lines[i].startsWith('- ')) html += `<li>${inline(lines[i++].slice(2))}</li>\n`;
      html += '</ul>\n';
      emit(html); continue;
    }
    // 段落（空行まで。行が続くときは改行を保つ）
    const pl = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#|\||>|- |\d+\.\s)/.test(lines[i])) pl.push(lines[i++]);
    emit(`<p>${pl.map(inline).join('<br>')}</p>\n`);
  }
  if (pendingH2 !== null) out += pendingH2;
  return out;
}

function build() {
  const md = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
  const cut = md.indexOf('\n# 書き手メモ（PDFに入れない）');
  if (cut < 0) throw new Error('「# 書き手メモ（PDFに入れない）」が見つかりません');
  const body = md.slice(0, cut).replace(/\n---\s*$/, '');
  const chunks = body.split(/\n---\n/).map((c) => c.trim());

  // 表紙（最初の --- まで）
  const cl = chunks[0].split('\n').filter((l) => l.trim() !== '');
  const title = cl[0].replace(/^#\s+/, '');
  const sub = cl[1];
  const author = cl[2];
  const lead = cl.filter((l) => l.startsWith('>'));
  const m = title.match(/^(工務店向け)\s*(.+)$/);
  const titleHtml = m ? `<span class="t-small">${esc(m[1])}</span><span class="t-big">${esc(m[2])}</span>` : esc(title);
  let html = `<section class="cover">
  <div class="cover-inner">
    <div class="cover-bar"></div>
    <h1 class="cover-title">${titleHtml}</h1>
    <p class="cover-sub">${inline(sub)}</p>
    ${renderQuote(lead, true)}
    <p class="cover-author">${inline(author)}</p>
  </div>
</section>
`;

  // 章（# ごとに改ページ）
  chunks.slice(1).forEach((c) => {
    const lines = c.split('\n');
    const h1 = lines[0].replace(/^#\s+/, '');
    const mm = h1.match(/^(\d+)\.\s*(.+)$/);
    const head = mm
      ? `<h1 class="chap"><span class="num">${mm[1]}</span><span class="ttl">${inline(mm[2])}</span></h1>`
      : `<h1 class="chap"><span class="ttl">${inline(h1)}</span></h1>`;
    html += `<section class="chapter">\n${head}\n${renderBlocks(lines.slice(1))}</section>\n`;
  });

  const doc = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<!-- このファイルは make-pdf.js が manual.md から作っています。文章の直しは manual.md で行い、node make-pdf.js で作り直してください -->
<!-- フォント：Google Fonts「Noto Sans JP」（SIL Open Font License）。読み込めない場合はローカルの日本語ゴシックで表示 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=block" rel="stylesheet">
<style>
${CSS}
</style>
</head>
<body>
${html}</body>
</html>
`;
  fs.writeFileSync(HTML, doc);
  console.log('wrote', HTML);
}

const CSS = `
  /* 配色（3色）：藍＝見出し・文字／生成り＝表の見出し・枠の地／山吹＝差し色（飾りのみ。文字には使わない） */
  :root {
    --ai: #17324D;
    --kinari: #FAF6EE;
    --yamabuki: #F2A93B;
    --line: rgba(23, 50, 77, 0.55);
    --line-soft: rgba(23, 50, 77, 0.25);
    --font: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "YuGothic", "Meiryo", "IPAexGothic", "IPAPGothic", "IPAGothic", sans-serif;
  }
  @page {
    size: A4 portrait;
    margin: 11mm 13mm 13mm 13mm;
    @bottom-center {
      content: counter(page) " / " counter(pages);
      font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "IPAGothic", sans-serif;
      font-size: 8.5pt;
      color: #17324D;
    }
  }
  @page :first {
    margin: 0;
    @bottom-center { content: none; }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: var(--font);
    color: var(--ai);
    background: #fff;
    font-size: 9.5pt;
    line-height: 1.55;
    font-feature-settings: "palt" 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  strong { font-weight: 700; }

  /* ---------- 表紙（藍地） ---------- */
  .cover {
    width: 210mm; height: 297mm;
    background: var(--ai);
    color: var(--kinari);
    position: relative;
    break-after: page;
    overflow: hidden;
  }
  .cover-inner { position: absolute; left: 24mm; right: 24mm; top: 62mm; bottom: 26mm; }
  .cover-bar { width: 22mm; height: 3mm; background: var(--yamabuki); margin-bottom: 12mm; }
  .cover-title { margin: 0; font-weight: 900; line-height: 1.25; letter-spacing: 0.02em; }
  .cover-title .t-small { display: block; font-size: 22pt; font-weight: 700; margin-bottom: 3mm; }
  .cover-title .t-big { display: block; font-size: 34pt; }
  .cover-sub { margin: 9mm 0 0; font-size: 16pt; font-weight: 700; color: var(--yamabuki); }
  .cover-lead {
    margin: 22mm 0 0; padding: 6mm 7mm; font-size: 11pt; line-height: 1.8;
    border: 0.4mm solid rgba(250, 246, 238, 0.55); border-radius: 2mm;
  }
  .cover-author { position: absolute; left: 0; bottom: 0; margin: 0; font-size: 12pt; font-weight: 500; letter-spacing: 0.04em; }

  /* ---------- 章（# ごとに改ページ） ---------- */
  .chapter { break-before: page; }
  .cover + .chapter { break-before: auto; }
  h1.chap {
    display: flex; align-items: center; gap: 4mm;
    margin: 0 0 3.5mm; padding-bottom: 2.2mm;
    border-bottom: 0.7mm solid var(--ai);
    font-size: 16pt; font-weight: 900; line-height: 1.3;
  }
  h1.chap .num {
    flex: none; width: 10mm; height: 10mm; border-radius: 50%;
    background: var(--yamabuki); color: var(--ai);
    display: flex; align-items: center; justify-content: center;
    font-size: 15pt; font-weight: 900; line-height: 1;
  }
  h2 {
    margin: 4mm 0 1.6mm; padding-left: 2.6mm;
    border-left: 1.4mm solid var(--yamabuki);
    font-size: 11.5pt; font-weight: 700; line-height: 1.35;
    break-after: avoid;
  }
  .keep { break-inside: avoid; }
  p { margin: 0 0 1.6mm; }
  ul, ol { margin: 0 0 1.8mm; padding-left: 5.5mm; }
  li { margin: 0 0 0.6mm; }
  ul li::marker { color: var(--ai); }
  ol li::marker { font-weight: 700; }
  .li-head { display: block; }
  .li-body { display: block; }

  /* 補足（> 1行） */
  .note-box { margin: 2mm 0 3mm; padding: 2.5mm 4mm; background: var(--kinari); border-radius: 1.5mm; break-inside: avoid; }
  .note-box p { margin: 0; }

  /* 文例（> が続く行）：1行ずつ見える。最後の「――」の行も1行 */
  .prompt-box {
    margin: 1.5mm 0 2.2mm; padding: 2.5mm 4.5mm;
    background: var(--kinari);
    border: 0.35mm solid var(--line);
    border-left: 1.6mm solid var(--ai);
    border-radius: 1.5mm;
    break-inside: avoid;
    font-size: 9.5pt; line-height: 1.55;
  }
  .prompt-box .qline { padding: 1mm 0; border-bottom: 0.25mm dashed var(--line-soft); }
  .prompt-box .qline:last-child { border-bottom: none; }
  .prompt-box .qline.sep { font-weight: 700; padding-top: 2mm; }
  .prompt-box .fill { text-decoration: underline; text-decoration-color: var(--yamabuki); text-decoration-thickness: 0.6mm; text-underline-offset: 0.8mm; }

  /* ---------- 表 ---------- */
  table { width: 100%; border-collapse: collapse; margin: 1mm 0 2.2mm; break-inside: avoid; font-size: 8.8pt; line-height: 1.45; }
  th, td { border: 0.3mm solid var(--line); padding: 1.2mm 2mm; vertical-align: top; text-align: left; }
  th { background: var(--kinari); font-weight: 700; }
  tr { break-inside: avoid; }
  td.box, table.tpl tr.ex td.box { text-align: center; vertical-align: middle; font-size: 13pt; line-height: 1; }

  /* 書き込み欄（印刷して手書き）：山吹の上線で目印。空欄は手で書ける高さ */
  table.tpl { border-top: 1.2mm solid var(--yamabuki); }
  table.tpl tr.ex td { background: var(--kinari); font-size: 8.8pt; }
  table.tpl td.empty { background: #fff; }

  table.tpl-check th { font-size: 8.6pt; vertical-align: bottom; }
  table.tpl-check th.c0 { width: 32%; }
  table.tpl-check tr.blank td { height: 13mm; }
  table.tpl-one th { width: 32%; vertical-align: middle; }
  table.tpl-one td { height: 14mm; }

  table.tpl-role th.c0 { width: 23%; }
  table.tpl-role th.c1 { width: 35%; }
  table.tpl-role td.c0 { font-weight: 700; }
  table.tpl-role td { height: 15mm; }

  table.tpl-rule th.c0 { width: 18%; }
  table.tpl-rule th.c1 { width: 32%; }
  table.tpl-rule td.c0 { font-weight: 700; }
  table.tpl-rule td.c1 { font-size: 8.6pt; }
  table.tpl-rule td { height: 16.5mm; }
  table.tpl-rule td.multi { padding: 0; }
  table.tpl-rule td.multi .mline { display: block; height: 8mm; padding: 1mm 2mm; border-bottom: 0.25mm dashed var(--line-soft); }
  table.tpl-rule td.multi .mline:last-child { border-bottom: none; }

  table.tpl-memo th.c0 { width: 15%; }
  table.tpl-memo th.c1 { width: 41%; }
  table.tpl-memo th.c2 { width: 30%; }
  table.tpl-memo th.c3 { width: 14%; text-align: center; font-size: 8.2pt; white-space: nowrap; }
  table.tpl-memo tr.blank td { height: 9mm; }
  table.tpl-memo tr.ex td.c0 { font-size: 8pt; }

  table.tpl-ng th.c0 { width: 12%; text-align: center; }
  table.tpl-ng td { height: 10.5mm; vertical-align: middle; }

  table.tpl-review th.c0 { width: 48%; }
  table.tpl-review td { height: 11mm; vertical-align: middle; }
  table.tpl-review .unit { display: block; text-align: right; padding-right: 6mm; }
  table.tpl-review .choices span { display: inline-block; padding: 0 2mm; }
  table.tpl-review .choices i { font-style: normal; }

  table.tbl-overview th.c0 { width: 7%; }
  table.tbl-overview td.c0 { text-align: center; font-weight: 700; }
  table.tbl-overview th.c2 { width: 34%; }

  table.tbl-example th.c0 { width: 36%; }
  table.tbl-example th.c2 { width: 30%; }

  table.tbl-week th.c0 { width: 15%; }
  table.tbl-week th.c2 { width: 11%; text-align: center; font-size: 8.2pt; white-space: nowrap; }
  table.tbl-week td.c0 { font-weight: 700; }
  table.tbl-week td.c1 { font-size: 9pt; }
`;

async function toPdf() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + HTML, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const fam = await page.evaluate(() => document.fonts.check('16px "Noto Sans JP"', 'あ'));
  console.log('Noto Sans JP loaded:', fam);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: PDF, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('wrote', PDF);
}

build();
if (!process.argv.includes('--html-only')) {
  toPdf().catch((e) => { console.error(e); process.exit(1); });
}
