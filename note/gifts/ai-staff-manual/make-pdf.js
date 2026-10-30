// LINE特典「工務店向け AI社員の作り方マニュアル」のPDFを作る。2つの版がある。
//   A4版（印刷したい人向け）：manual.md → manual.html → manual.pdf（A4縦・余白あり・ページ番号あり）
//   スマホ版（LINEで受け取って読む）：manual-sp.md → manual-sp.html → manual-sp.pdf（横390×縦844pxの縦長ページ）
//   どちらも「# 書き手メモ（PDFに入れない）」より前だけを使う。書き出しは Playwright＋Chromium。
// 使い方：node make-pdf.js              （A4版の html と pdf を作り直す）
//         node make-pdf.js sp           （スマホ版の html と pdf を作り直す）
//         node make-pdf.js all          （両方）
//         --html-only を足すと html だけ作る（例：node make-pdf.js sp --html-only）
// A4版の配色：藍 #17324D・生成り #FAF6EE・山吹 #F2A93B。本文ページは白地に藍の文字。
// スマホ版の配色：記事の見出し画像（工事黒板）とそろえる。黒板 #23453a・チョーク #f1efe4・白地に濃い文字。
// フォント：Google Fonts「Noto Sans JP」「Klee One」（どちらも SIL Open Font License）。読めないときはローカルの日本語フォント。

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
        if (/^(行|個|件)$/.test(c)) html = `<span class="unit">${esc(c)}</span>`;
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

// =====================================================================
// スマホ版（manual-sp.md → manual-sp.html → manual-sp.pdf）
//   ページ：横390×縦844px（スマホ1画面の幅）。Googleドライブ等のPDF表示で、ページ幅＝画面幅で読む前提。
//   改ページ：表紙のあと／「## 1.」のような番号つきの見出し（章の始まり）の前だけ。それ以外の ## は流し込む。
//   見出し・ひな形の枠（>）・太字の小見出し＋直後の箇条書きは、ページの途中で切らない。
// =====================================================================

const SRC_SP = path.join(DIR, 'manual-sp.md');
const HTML_SP = path.join(DIR, 'manual-sp.html');
const PDF_SP = path.join(DIR, 'manual-sp.pdf');

// ひな形の1行：「項目：」の項目を太字に、（ ）の中（書き換える所）に下線
function spQuoteLine(t, isTemplate) {
  let label = '';
  let rest = t;
  const m = t.match(/^([^（「：][^「：]{0,24})：(.*)$/);
  if (m) { label = `<b class="k">${esc(m[1])}：</b>`; rest = m[2]; }
  let h = inline(rest);
  if (isTemplate) h = h.replace(/（([^（）]*)）/g, '<span class="fill">（$1）</span>');
  return label + h;
}

// 「>」が続く行：1行ずつ別の行として組み、枠で囲む（コピーして使うもの）
//   1行だけ → 補足の囲み／1行目が【N】→ 枠の見出し帯にする／見出しに「記入例」→ 点線の枠（書き換える所の下線なし）
function renderQuoteSp(lines, h2text) {
  let texts = lines.map((l) => l.replace(/^>\s?/, ''));
  if (texts.length === 1) return `<div class="note-box"><p>${inline(texts[0])}</p></div>\n`;
  const isExample = /記入例/.test(h2text || '') || texts[0].startsWith('記入例');
  let head = '';
  if (/^【\d】/.test(texts[0])) { head = `<div class="copy-head">${inline(texts[0])}</div>\n`; texts = texts.slice(1); }
  const body = texts.map((t) => {
    if (t.trim() === '') return '<div class="qgap"></div>';
    if (t.startsWith('記入例')) return `<div class="qline ex-label">${inline(t)}</div>`;
    const sep = t.startsWith('――') ? ' sep' : '';
    return `<div class="qline${sep}">${spQuoteLine(t, !isExample)}</div>`;
  }).join('\n');
  return `<div class="copy-box${isExample ? ' example' : ''}">\n${head}<div class="copy-body">\n${body}\n</div>\n</div>\n`;
}

function renderBlocksSp(lines) {
  let out = '';
  let i = 0;
  // 見出し（##）や太字だけの小見出しは、次のかたまりと一緒に .keep で包む（ページ末に見出しだけ残さない）
  let pending = '';
  let h2text = '';
  const glue = (html) => { pending += html; };
  //   枠（ひな形）は途中で切れないので、見出しと枠を丸ごと .keep で包む。
  //   段落・箇条書きは途中で切れてよい（見出しは break-after: avoid で次の行とくっつく）。ページ末の空きを減らすため
  const emit = (html, whole) => {
    if (pending && whole) out += `<div class="keep">\n${pending}${html}</div>\n`;
    else out += pending + html;
    pending = '';
  };
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (line.startsWith('## ')) {
      if (pending) { out += pending; pending = ''; }
      h2text = line.slice(3);
      glue(`<h2>${inline(h2text)}</h2>\n`);
      i++; continue;
    }
    if (line.startsWith('>')) {
      const ql = [];
      while (i < lines.length && lines[i].startsWith('>')) ql.push(lines[i++]);
      emit(renderQuoteSp(ql, h2text), true); continue;
    }
    if (/^\d+\.\s/.test(line)) {
      let html = '<ol>\n';
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const first = lines[i].replace(/^\d+\.\s/, '');
        i++;
        const cont = [];
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) cont.push(lines[i++].trim());
        html += `<li>${inline(first)}${cont.length ? `<br>${inline(cont.join(''))}` : ''}</li>\n`;
      }
      html += '</ol>\n';
      emit(html); continue;
    }
    if (line.startsWith('- ')) {
      let html = '<ul>\n';
      let n = 0;
      while (i < lines.length && lines[i].startsWith('- ')) { html += `<li>${inline(lines[i++].slice(2))}</li>\n`; n++; }
      html += '</ul>\n';
      emit(html, n <= 3); continue; // 3項目までの短い箇条書きは、見出しごと次のページへ送る
    }
    // 段落（空行まで。行が続くときは改行を保つ）
    const pl = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#|\||>|- |\d+\.\s)/.test(lines[i])) pl.push(lines[i++]);
    const boldOnly = /^\*\*[^*]+\*\*$/.test(pl[0].trim());
    if (boldOnly && pl.length === 1 && i < lines.length && lines[i].startsWith('- ')) {
      // 「**最低これだけ**」＋箇条書き → 小見出しとして次の箇条書きとくっつける
      glue(`<p class="sub-ttl">${inline(pl[0])}</p>\n`);
      continue;
    }
    if (boldOnly && pl.length === 1) {
      // 太字だけの一文（「作業がゼロに…」）は、直前の段落（「今の私の答えは、こうです。」）と同じページに置く
      const prev = out.match(/<p>[^\n]*<\/p>\n$/);
      const st = `<p class="statement">${inline(pl[0])}</p>\n`;
      if (prev && !pending) { out = out.slice(0, prev.index) + `<div class="keep">\n${prev[0]}${st}</div>\n`; }
      else emit(st);
      continue;
    }
    if (boldOnly) {
      // 「**1. 社長が毎回…**」＋説明 → 小見出しつきの段落（途中で切らない）
      emit(`<p class="item"><span class="sub-ttl">${inline(pl[0])}</span>${pl.slice(1).map(inline).join('<br>')}</p>\n`);
      continue;
    }
    // 短い段落（約5行まで）は途中で切らない。最後の1行だけが次のページに出るのを防ぐ（Chromium の印刷では widows が効かないため）
    const len = pl.join('').replace(/\*\*/g, '').length;
    emit(len <= 100 ? `<p class="short">${pl.map(inline).join('<br>')}</p>\n` : `<p>${pl.map(inline).join('<br>')}</p>\n`);
  }
  if (pending) out += pending;
  return out;
}

function buildSp() {
  const md = fs.readFileSync(SRC_SP, 'utf8').replace(/\r\n/g, '\n');
  const cut = md.indexOf('\n# 書き手メモ（PDFに入れない）');
  if (cut < 0) throw new Error('「# 書き手メモ（PDFに入れない）」が見つかりません');
  const lines = md.slice(0, cut).replace(/\n---\s*$/, '').split('\n');

  // 表紙（最初の ## まで）
  const firstH2 = lines.findIndex((l) => l.startsWith('## '));
  const cl = lines.slice(0, firstH2).filter((l) => l.trim() !== '');
  const title = cl[0].replace(/^#\s+/, '');
  const sub = cl[1];
  const author = cl[2];
  const lead = cl.filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, '')).join('');
  const m = title.match(/^(工務店向け)\s*(AI社員の作り方)(マニュアル)$/);
  let html = `<section class="cover">
  <div class="board">
    <div class="smudge"></div>
    <div class="frame">
      <div class="row row-top">${m ? `<span class="t-small">${esc(m[1])}</span>` : ''}</div>
      <div class="row row-main">
        <h1 class="cover-title">${m ? `<span class="t-big">${esc(m[2])}</span><span class="t-big">${esc(m[3])}</span>` : esc(title)}</h1>
        <p class="cover-sub">${inline(sub).replace('、', '、<br>')}</p>
      </div>
      <div class="row row-lead"><p>${inline(lead)}</p></div>
      <div class="row row-author"><p>${inline(author)}</p></div>
    </div>
    <div class="tray"></div>
    <div class="stick" style="left: 236px; width: 44px;"></div>
    <div class="stick" style="left: 290px; width: 28px; background: #e9d9a0;"></div>
  </div>
</section>
`;

  // 本文：「## 1.」のような番号つき見出しの前で改ページ
  const groups = [];
  let cur = { head: null, lines: [] };
  lines.slice(firstH2).forEach((l) => {
    const mm = l.match(/^##\s+(\d+)\.\s*(.+)$/);
    if (mm) { groups.push(cur); cur = { head: { num: mm[1], ttl: mm[2] }, lines: [] }; }
    else cur.lines.push(l);
  });
  groups.push(cur);
  groups.forEach((g) => {
    if (!g.head && g.lines.every((l) => l.trim() === '')) return;
    const head = g.head
      ? `<h1 class="chap"><span class="num">${esc(g.head.num)}</span><span class="ttl">${inline(g.head.ttl)}</span></h1>\n`
      : '';
    html += `<section class="${g.head ? 'chapter' : 'intro'}">\n${head}${renderBlocksSp(g.lines)}</section>\n`;
  });

  const doc = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=390">
<title>${esc(title)}</title>
<!-- このファイルは make-pdf.js が manual-sp.md から作っています。文章の直しは manual-sp.md で行い、node make-pdf.js sp で作り直してください -->
<!-- フォント：Google Fonts「Noto Sans JP」「Klee One」（SIL Open Font License）。読み込めない場合はローカルの日本語フォントで表示 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Noto+Sans+JP:wght@400;700&display=block" rel="stylesheet">
<style>
${CSS_SP}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="3" seed="11"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/>
  </filter>
</svg>
${html}</body>
</html>
`;
  fs.writeFileSync(HTML_SP, doc);
  console.log('wrote', HTML_SP);
}

const CSS_SP = `
  /* 配色（記事の見出し画像＝工事黒板とそろえる）：黒板の緑＝表紙・章見出し・差し色／チョーク＝表紙の文字・枠の地／本文＝白地に濃い文字 */
  :root {
    --board: #23453a;
    --chalk: #f1efe4;
    --chalk-dim: rgba(241, 239, 228, 0.62);
    --ink: #1f2a26;
    --line: rgba(35, 69, 58, 0.55);
    --line-soft: rgba(35, 69, 58, 0.22);
    --sans: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "YuGothic", "Meiryo", "IPAexGothic", "IPAGothic", sans-serif;
    --klee: "Klee One", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif;
  }
  @page {
    size: 390px 844px;
    margin: 26px 20px 36px 20px;
    @bottom-center {
      content: counter(page) " / " counter(pages);
      font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "IPAGothic", sans-serif;
      font-size: 11px;
      color: rgba(35, 69, 58, 0.75);
    }
  }
  @page :first {
    margin: 0;
    @bottom-center { content: none; }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: var(--sans);
    color: var(--ink);
    background: #fff;
    font-size: 17px;
    line-height: 1.72;
    overflow-wrap: anywhere;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  strong, b { font-weight: 700; }

  /* ---------- 表紙（工事黒板） ---------- */
  .cover { width: 390px; height: 844px; break-after: page; overflow: hidden; }
  .board {
    position: relative; width: 100%; height: 100%;
    background:
      radial-gradient(ellipse at 30% 35%, rgba(255,255,255,.06), transparent 60%),
      radial-gradient(ellipse at 80% 85%, rgba(255,255,255,.05), transparent 55%),
      var(--board);
    color: var(--chalk);
    font-family: var(--klee);
    overflow: hidden;
  }
  .smudge { position: absolute; inset: 0; filter: url(#grain); opacity: .5; }
  .frame {
    position: absolute; left: 22px; right: 22px; top: 40px; bottom: 58px;
    border: 2.5px solid var(--chalk-dim);
    display: flex; flex-direction: column;
  }
  .row { padding: 0 20px; }
  .row-top { border-bottom: 2.5px solid var(--chalk-dim); padding-top: 14px; padding-bottom: 12px; }
  .row-top .t-small { font-size: 22px; font-weight: 600; letter-spacing: .12em; }
  .row-main { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .cover-title { margin: 0; font-weight: 600; line-height: 1.32; letter-spacing: .02em; -webkit-text-stroke: .6px var(--chalk); }
  .cover-title .t-big { display: block; font-size: 40px; }
  .cover-sub { margin: 22px 0 0; font-size: 19px; font-weight: 600; line-height: 1.6; color: var(--chalk); }
  .cover-sub::before { content: ""; display: block; width: 56px; height: 3px; background: var(--chalk-dim); margin-bottom: 18px; }
  .row-lead { border-top: 2.5px solid var(--chalk-dim); padding-top: 18px; padding-bottom: 20px; }
  .row-lead p { margin: 0; font-size: 16.5px; line-height: 1.85; }
  .row-author { border-top: 2.5px solid var(--chalk-dim); padding-top: 14px; padding-bottom: 14px; }
  .row-author p { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .06em; }
  .tray { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; background: linear-gradient(#7d827b, #a7aba5); }
  .stick { position: absolute; bottom: 9px; height: 9px; border-radius: 3px; background: var(--chalk); }

  /* ---------- 章（番号つきの見出しの前だけ改ページ） ---------- */
  .chapter { break-before: page; }
  h1.chap {
    display: flex; align-items: center; gap: 14px;
    margin: 0 0 18px; padding: 12px 16px;
    background: var(--board); color: var(--chalk);
    border-radius: 6px;
    font-family: var(--klee); font-weight: 600;
    font-size: 23px; line-height: 1.4;
    break-after: avoid;
  }
  h1.chap .num {
    flex: none; font-size: 34px; line-height: 1;
    padding-right: 14px; border-right: 2.5px solid var(--chalk-dim);
  }
  h2 {
    margin: 26px 0 8px; padding: 1px 0 1px 11px;
    border-left: 5px solid var(--board);
    color: var(--board);
    font-size: 20px; font-weight: 700; line-height: 1.45;
    break-after: avoid;
  }
  .intro > h2:first-child, .intro > .keep:first-child > h2:first-child { margin-top: 4px; }
  h1.chap + h2, h1.chap + .keep > h2:first-child { margin-top: 6px; }
  .keep { break-inside: avoid; }
  p { margin: 0 0 12px; orphans: 2; widows: 2; }
  .sub-ttl { display: block; margin: 0 0 2px; font-weight: 700; color: var(--board); }
  p.sub-ttl { margin-top: 4px; break-after: avoid; }
  p.item, p.short { break-inside: avoid; }
  p.statement {
    margin: 4px 0 18px; padding: 12px 14px;
    border-left: 5px solid var(--board); background: var(--chalk);
    font-weight: 700; line-height: 1.75;
  }

  ul, ol { margin: 0 0 12px; padding: 0; list-style: none; }
  li { position: relative; margin: 0 0 4px; break-inside: avoid; }
  ul li { padding-left: 18px; }
  ul li::before { content: ""; position: absolute; left: 3px; top: .72em; width: 7px; height: 7px; border-radius: 50%; background: var(--board); }
  ol { counter-reset: n; }
  ol li { counter-increment: n; padding-left: 34px; }
  ol li::before {
    content: counter(n); position: absolute; left: 0; top: .2em;
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--board); color: var(--chalk);
    font-size: 14px; font-weight: 700; line-height: 24px; text-align: center;
  }

  /* 補足（> 1行） */
  .note-box { margin: 4px 0 16px; padding: 12px 14px; background: var(--chalk); border-radius: 6px; break-inside: avoid; font-size: 16px; line-height: 1.75; }
  .note-box p { margin: 0; }

  /* ひな形・記入例（> が続く行）：枠で囲み、1行ずつ改行を保つ。折り返した行は1字下げて、元の行と見分ける */
  .copy-box {
    margin: 6px 0 16px;
    border: 2px solid var(--board); border-radius: 8px;
    background: var(--chalk);
    overflow: hidden;
    break-inside: avoid;
  }
  .copy-head {
    padding: 8px 12px;
    background: var(--board); color: var(--chalk);
    font-size: 15.5px; font-weight: 700; line-height: 1.5;
  }
  .copy-body { padding: 4px 12px 6px; font-size: 16.5px; line-height: 1.6; }
  .qline { padding: 5px 0 5px 1em; text-indent: -1em; border-bottom: 1px dashed var(--line-soft); }
  .qline:last-child { border-bottom: none; }
  .qline .k { color: var(--board); }
  .qline.sep { font-weight: 700; color: var(--board); text-indent: 0; padding-left: 0; }
  .qline.ex-label { font-weight: 700; color: var(--board); font-size: 14.5px; }
  .qgap { height: 10px; border-bottom: 2px solid var(--line); margin-bottom: 4px; }
  .fill { text-decoration: underline; text-decoration-color: var(--board); text-decoration-thickness: 1.5px; text-underline-offset: 4px; }
  .copy-box.example { background: #fff; border-style: dashed; }
`;

async function toPdfSp() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file://' + HTML_SP, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => ({
    noto: document.fonts.check('17px "Noto Sans JP"', 'あ'),
    klee: document.fonts.check('600 23px "Klee One"', 'あ'),
  }));
  console.log('Noto Sans JP loaded:', fonts.noto, '/ Klee One loaded:', fonts.klee);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: PDF_SP, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('wrote', PDF_SP);
}

// ---------- 実行 ----------
const args = process.argv.slice(2);
const htmlOnly = args.includes('--html-only');
const mode = args.includes('all') ? 'all' : args.includes('sp') ? 'sp' : 'a4';

(async () => {
  if (mode === 'a4' || mode === 'all') {
    build();
    if (!htmlOnly) await toPdf();
  }
  if (mode === 'sp' || mode === 'all') {
    buildSp();
    if (!htmlOnly) await toPdfSp();
  }
})().catch((e) => { console.error(e); process.exit(1); });
