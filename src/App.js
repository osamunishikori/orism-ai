import { useState, useEffect } from "react";

// ===== サンプル工務店データ（顧問先ごとに編集して使います）=====
// オリズムが顧問先工務店ごとにこのブロックを差し替えてカスタマイズします
const NIKKEN_DATA = `
【会社情報】
会社名：（サンプル）地域工務店株式会社
所在地：○○県○○市
対応エリア：○○県全域
創業：○○年（実績○○棟）
キャッチコピー：「（御社のキャッチコピーをここに）」
コンセプト：（御社のコンセプトをここに）
【強み・特徴】
・（性能・断熱・気密などの強みをここに）
・（自社施工／提案力／アフター対応などの強みをここに）
・（保証制度／補助金活用／資金計画サポートなど）
【受賞・認定（あれば）】
・（受賞歴・認定があればここに）
※このブロックは「顧問先工務店ごとに」差し替えてください。
※オリズム式の「Whyの深掘り」「ライフスタイルのコア」を引き出すヒアリング設計を内蔵しています。
`;

// ===== オリズム監修のコンサル方針（全プロンプトに常時注入）=====
const ORISM_DOCTRINE = `
【オリズム式 営業の鉄則】
・主役はお客様。会社の自慢ではなく「お客様の不安・憧れ」に寄り添う
・「弊社は〇〇です」ではなく「〇〇でお悩みではないですか？」のスタンス
・要望の裏にある「Why（なぜ？）」を必ず引き出す
・売り込み感ゼロ。読んだ人が「この人に相談したい」と感じる温かい文体
・受注を急がない。信頼関係の構築が先、契約は後から自然についてくる
・地域ナンバーワン中小工務店として、誠実さと専門性を両立
`;

// ===== 経営コンサル用（案A向け）=====
const ORISM_CONSULT_DOCTRINE = `
【オリズム式 工務店経営コンサルの鉄則】
・地域ナンバーワン中小工務店を目指す経営哲学
・売上より利益、利益より粗利率を重視
・社長自身が営業の最前線に立つ組織づくり
・下請け脱却・元請け強化・自社ブランド化が3本柱
・Web集客とリアル集客のバランス（地域密着 × デジタル活用）
・数字で語る。感覚ではなくKPIで経営判断
・小さく始めて早く改善。PDCAを週単位で回す
`;

// ===== 集客支援用（案B向け）=====
const ORISM_MARKETING_DOCTRINE = `
【オリズム式 集客コンテンツの鉄則】
・会社の自慢ではなく、お客様の「憧れ」や「不安」にフォーカス
・住まいの悩みに寄り添う温かい文体、親近感のある言葉選び
・地域名・地域ネタを入れて地元感を演出
・施工事例・お客様の声など「写真で語れる要素」を最大限活用
・売り込み感を出さず、読んだ人が「相談してみたい」と感じる導線
・専門用語は使わず、家づくり初心者にもわかる言葉で
・「家」ではなく「暮らし」を売る視点
`;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans JP', sans-serif; background: #f7f7f7; color: #2a2a2a; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .header { background: #2a2a2a; padding: 16px 28px; border-bottom: 3px solid #7a1526; display: flex; align-items: center; justify-content: space-between; }
  .header-logo { font-family: 'Noto Serif JP', serif; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.06em; }
  .header-logo .accent { color: #c4334a; font-weight: 700; }
  .header-logo span { font-size: 11px; color: #aaaaaa; margin-left: 8px; font-family: 'Noto Sans JP', sans-serif; font-weight: 300; letter-spacing: 0.15em; }
  .header-sub { font-size: 10px; color: #999999; font-weight: 300; letter-spacing: 0.15em; margin-top: 3px; }
  .layout { display: flex; flex: 1; }
  .sidebar { width: 220px; min-width: 220px; background: #ffffff; border-right: 1px solid #e0e0e0; padding: 16px 12px; overflow-y: auto; }
  .sidebar-title { font-size: 10px; font-weight: 700; color: #6a6a6a; letter-spacing: 0.12em; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #ececec; }
  .customer-item { padding: 8px 10px; border-radius: 2px; cursor: pointer; font-size: 13px; color: #2a2a2a; margin-bottom: 4px; border: 1px solid transparent; transition: all 0.15s; }
  .customer-item:hover { background: #fdf5f6; }
  .customer-item.active { background: #2a2a2a; color: #ffffff; border-color: #2a2a2a; }
  .customer-item-name { font-weight: 500; }
  .customer-item-meta { font-size: 10px; color: #999999; margin-top: 2px; }
  .customer-item.active .customer-item-meta { color: #c4334a; }
  .add-customer-btn { width: 100%; padding: 8px; background: transparent; border: 1px dashed #7a1526; color: #7a1526; border-radius: 2px; font-size: 12px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; margin-bottom: 8px; }
  .main-area { flex: 1; overflow-y: auto; }
  .tabs { display: flex; background: #2a2a2a; padding: 0 20px; gap: 2px; overflow-x: auto; border-bottom: 1px solid #1a1a1a; }
  .tab { padding: 11px 16px; border: none; background: transparent; color: #999999; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; white-space: nowrap; }
  .tab.active { color: #ffffff; border-bottom-color: #7a1526; }
  .tab:hover:not(.active) { color: #cccccc; }
  .main { max-width: 860px; margin: 0 auto; padding: 24px 20px; }
  .section-title { font-family: 'Noto Serif JP', serif; font-size: 19px; font-weight: 700; margin-bottom: 6px; color: #2a2a2a; }
  .section-desc { font-size: 13px; color: #6a6a6a; margin-bottom: 20px; line-height: 1.7; }
  .nikken-badge { display: inline-flex; align-items: center; gap: 6px; background: #2a2a2a; color: #ffffff; font-size: 10px; padding: 4px 12px; border-radius: 2px; margin-bottom: 16px; letter-spacing: 0.1em; border-left: 3px solid #7a1526; }
  .customer-banner { background: #fdf5f6; border: 1px solid #e8c5cb; border-radius: 2px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
  .customer-banner-name { font-size: 14px; font-weight: 700; color: #2a2a2a; }
  .customer-banner-meta { font-size: 11px; color: #7a1526; margin-top: 2px; }
  .customer-banner-del { padding: 4px 10px; background: transparent; border: 1px solid #c08080; color: #a05050; border-radius: 2px; font-size: 11px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; }
  .no-customer { text-align: center; padding: 60px 20px; color: #999999; }
  .no-customer-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; color: #6a6a6a; }
  .card { background: #ffffff; border-radius: 2px; padding: 20px; margin-bottom: 14px; border: 1px solid #e0e0e0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .card.why-card { background: #fdf5f6; border: 1px solid #e8c5cb; border-left: 3px solid #7a1526; }
  .card.history-card { background: #fafafa; border: 1px solid #e0e0e0; border-left: 3px solid #c4334a; }
  .card.hearing-ref { background: #fdf5f6; border: 1px solid #e8c5cb; border-left: 3px solid #7a1526; }
  .card-title { font-size: 11px; font-weight: 700; color: #6a6a6a; letter-spacing: 0.1em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ececec; display: flex; align-items: center; gap: 8px; }
  .num { background: #7a1526; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .num.why { background: #5a0f1c; }
  .why-badge { background: #5a0f1c; color: #ffe0e5; font-size: 9px; padding: 2px 7px; border-radius: 2px; }
  .why-hint { font-size: 11px; color: #7a1526; margin-bottom: 12px; line-height: 1.7; font-style: italic; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 11px; font-weight: 500; color: #4a4a4a; letter-spacing: 0.04em; }
  input, select, textarea { padding: 8px 11px; border: 1px solid #d8d8d8; border-radius: 2px; font-family: 'Noto Sans JP', sans-serif; font-size: 13px; color: #2a2a2a; background: #fafafa; transition: border-color 0.2s; outline: none; width: 100%; }
  input:focus, select:focus, textarea:focus { border-color: #7a1526; background: #ffffff; }
  textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
  .member-row { display: grid; grid-template-columns: 1.5fr 0.7fr 0.7fr 1fr 1.5fr; gap: 8px; margin-bottom: 8px; align-items: end; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .chip { padding: 5px 12px; border: 1px solid #d8d8d8; background: #fafafa; border-radius: 20px; font-size: 12px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; color: #4a4a4a; transition: all 0.15s; }
  .chip.on { background: #2a2a2a; color: #ffffff; border-color: #2a2a2a; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .divider { border: none; border-top: 1px solid #ececec; margin: 8px 0 14px; }
  .btn { width: 100%; padding: 13px; background: #2a2a2a; color: #ffffff; border: none; border-radius: 2px; font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; margin-top: 8px; border-bottom: 3px solid #7a1526; }
  .btn:hover:not(:disabled) { background: #1a1a1a; }
  .btn:disabled { background: #b0b0b0; color: #e8e8e8; cursor: not-allowed; border-bottom-color: #c0c0c0; }
  .btn-sm { padding: 7px 16px; background: #2a2a2a; color: #ffffff; border: none; border-radius: 2px; font-size: 12px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; }
  .btn-loading { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .spinner { width: 15px; height: 15px; border: 2px solid #ffffff40; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .result { margin-top: 20px; }
  .result-badge { display: inline-block; background: #7a1526; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; letter-spacing: 0.1em; margin-bottom: 10px; }
  .result-content { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 2px; padding: 20px; font-size: 13px; line-height: 2; color: #2a2a2a; white-space: pre-wrap; position: relative; }
  .copy-btn { position: absolute; top: 10px; right: 10px; padding: 5px 12px; background: #2a2a2a; color: #ffffff; border: none; border-radius: 2px; font-size: 11px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; }
  .save-btn-row { display: flex; justify-content: flex-end; margin-top: 8px; gap: 8px; }
  .add-btn { padding: 5px 14px; background: transparent; border: 1px dashed #7a1526; color: #7a1526; border-radius: 2px; font-size: 11px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; }
  .remove-btn { padding: 4px 10px; background: transparent; border: 1px solid #e0b0b0; color: #c06060; border-radius: 2px; font-size: 11px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; }
  .tone-btns { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; max-width: 100%; }
  .tone-btn { padding: 6px 14px; border: 1px solid #d8d8d8; background: #fafafa; border-radius: 2px; font-size: 12px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; color: #4a4a4a; transition: all 0.15s; }
  .tone-btn.selected { background: #2a2a2a; color: #ffffff; border-color: #2a2a2a; }
  .error { background: #fff5f5; border: 1px solid #f0c0c0; color: #c04040; padding: 10px 14px; border-radius: 2px; font-size: 12px; margin-top: 12px; }
  .header-right { display: flex; align-items: center; gap: 18px; }
  .mode-selector { display: flex; gap: 3px; }
  .mode-btn { padding: 7px 14px; background: #1a1a1a; color: #999999; border: 1px solid #4a4a4a; border-radius: 2px; font-family: 'Noto Sans JP', sans-serif; font-size: 11px; cursor: pointer; letter-spacing: 0.08em; transition: all 0.15s; }
  .mode-btn:hover:not(.active) { color: #cccccc; border-color: #6a6a6a; }
  .mode-btn.active { background: #7a1526; color: #ffffff; border-color: #7a1526; font-weight: 600; }
  .industry-selector { display: flex; align-items: center; gap: 10px; }
  .industry-label { font-size: 10px; color: #999999; letter-spacing: 0.08em; }
  .industry-select { padding: 5px 10px; background: #1a1a1a; color: #ffffff; border: 1px solid #4a4a4a; border-radius: 2px; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; cursor: pointer; outline: none; }
  .industry-select option { background: #1a1a1a; color: #ffffff; }
  .industry-badge { display: inline-flex; align-items: center; gap: 6px; background: #ececec; color: #4a4a4a; font-size: 10px; padding: 4px 12px; border-radius: 2px; margin-bottom: 12px; letter-spacing: 0.08em; }
  .crisis-banner { background: #fff8e1; border: 1px solid #f0c040; border-left: 4px solid #e0a000; border-radius: 2px; padding: 10px 16px; margin-bottom: 16px; font-size: 12px; color: #7a5a00; line-height: 1.6; }
  .saved-tag { font-size: 10px; color: #7a1526; background: #fdf5f6; padding: 2px 8px; border-radius: 10px; }
  .exchange-block { background: #ffffff; border: 1px solid #e0e0e0; border-radius: 2px; padding: 14px; margin-bottom: 10px; }
  .exchange-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 6px; }
  .exchange-label.customer { color: #4a4a4a; }
  .exchange-label.nikken { color: #7a1526; }
  .round-badge { display: inline-flex; align-items: center; gap: 6px; background: #fdf5f6; color: #7a1526; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; border: 1px solid #e8c5cb; }
  .history-log { margin-top: 12px; }
  .history-log-item { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 2px; padding: 12px; margin-bottom: 8px; font-size: 12px; }
  .history-log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .history-log-round { font-weight: 700; color: #7a1526; font-size: 11px; }
  .history-log-date { font-size: 10px; color: #999999; }
  .history-log-preview { color: #6a6a6a; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: #ffffff; border-radius: 4px; padding: 28px; width: 360px; }
  .modal-title { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #2a2a2a; }
  .modal-btns { display: flex; gap: 8px; margin-top: 20px; justify-content: flex-end; }
  .modal-btn { padding: 8px 20px; border-radius: 2px; font-size: 13px; font-family: 'Noto Sans JP', sans-serif; cursor: pointer; }
  .modal-btn.primary { background: #2a2a2a; color: #ffffff; border: none; border-bottom: 2px solid #7a1526; }
  .modal-btn.secondary { background: transparent; border: 1px solid #d8d8d8; color: #4a4a4a; }
  .progress { display: flex; gap: 3px; margin-bottom: 20px; }
  .progress-step { flex: 1; height: 3px; background: #ececec; border-radius: 2px; }
  .progress-step.done { background: #7a1526; }
`;

// localStorage helpers
const LS_KEY = "orism_customers";
const loadCustomers = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const saveCustomers = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data));

const callClaude = async (systemPrompt, userMessage) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, userMessage }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
};

// 業種ごとの設定
const INDUSTRY_CONFIG = {
  nikken: {
    label: "中小工務店（デフォルト）",
    businessName: "工務店",
    product: "注文住宅",
    customer: "お客様",
  },
  koumuten: {
    label: "工務店・地域ビルダー",
    businessName: "工務店",
    product: "注文住宅",
    customer: "施主",
  },
  reform: {
    label: "リフォーム会社",
    businessName: "リフォーム会社",
    product: "リフォーム工事",
    customer: "お客様",
  },
  fudosan: {
    label: "不動産会社",
    businessName: "不動産会社",
    product: "不動産",
    customer: "お客様",
  },
  sekkei: {
    label: "設計事務所",
    businessName: "設計事務所",
    product: "設計・建築",
    customer: "施主",
  },
};

function Chips({ options, value, onChange, multi = true }) {
  const toggle = (opt) => {
    if (!multi) { onChange(value === opt ? "" : opt); return; }
    const arr = value ? value.split(",").filter(Boolean) : [];
    const next = arr.includes(opt) ? arr.filter(v => v !== opt) : [...arr, opt];
    onChange(next.join(","));
  };
  const selected = value ? value.split(",") : [];
  return (
    <div className="chips">
      {options.map(opt => (
        <button key={opt} type="button" className={`chip ${selected.includes(opt) ? "on" : ""}`} onClick={() => toggle(opt)}>{opt}</button>
      ))}
    </div>
  );
}

const EMPTY_HEARING = {
  budget: "", land: "含む", area: "", timeline: "",
  weekday_h: "", weekday_w: "", weekend: "",
  relax: "", living: "", dining: "", kitchen: "", drink: "", smoke: "",
  guest: "", future: "", parent_child: "", sleep: "", storage: "",
  exterior: "", balcony: "", garden: "", car: "", equipment: "", magazine: "",
  must_h: "", must_w: "", conflict: "", complaint: "", future_life: "", lifestyle_core: "",
  staff_note: "",
};

const EMPTY_MEMBERS = [
  { name: "", age: "", sex: "男性", job: "", hobby: "" },
  { name: "", age: "", sex: "女性", job: "", hobby: "" },
];

function HearingTab({ customer, onSave }) {
  const [members, setMembers] = useState(customer.members || EMPTY_MEMBERS);
  const [f, setF] = useState(customer.hearing || EMPTY_HEARING);
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMembers(customer.members || EMPTY_MEMBERS);
    setF(customer.hearing || EMPTY_HEARING);
    setResult("");
  }, [customer.id]);

  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const sm = (i, k, v) => setMembers(m => m.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const filled = [members.some(m => m.name), f.weekday_h || f.relax, f.exterior || f.equipment, f.must_h || f.must_w, !!result].filter(Boolean).length;

  const handleSave = () => {
    onSave({ members, hearing: f });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generate = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const mStr = members.filter(m => m.name || m.age).map((m, i) =>
        `${["ご主人","奥様","お子様1","お子様2"][i]||`${i+1}人目`}：${m.name} / ${m.age}歳 / ${m.sex} / ${m.job} / 趣味:${m.hobby}`
      ).join("\n");
      const msg = `【家族構成】\n${mStr}\n【予算】${f.budget}万円（土地代${f.land}）坪数：${f.area} 入居：${f.timeline}\n【暮らし】平日(夫)：${f.weekday_h} 平日(妻)：${f.weekday_w} 休日：${f.weekend}\n【くつろぎ】${f.relax} リビング：${f.living} 食事：${f.dining} キッチン：${f.kitchen} 酒：${f.drink} 煙草：${f.smoke}\n【来客・将来】${f.guest} 将来：${f.future} 親子：${f.parent_child} 就寝：${f.sleep} 収納：${f.storage}\n【外まわり】外観：${f.exterior} バルコニー：${f.balcony} 庭：${f.garden} 車：${f.car} 設備：${f.equipment} 雑誌：${f.magazine}\n【Why深掘り】夫の譲れない：${f.must_h} 妻の譲れない：${f.must_w} 夫婦の対立：${f.conflict} 不満：${f.complaint} 10年後：${f.future_life} コア：${f.lifestyle_core}\n【担当メモ】${f.staff_note}`;
      const sys = `あなたはオリズム式営業メソッドを習得した、中小工務店の優秀な営業アドバイザーです。以下の会社情報を活かしながら、ヒアリング内容を分析してください。\n${NIKKEN_DATA}\n${ORISM_DOCTRINE}\n\n以下の形式で出力：\n【ライフスタイル分析】\n【プランのコア（お客様にとって最も大切なもの）】\n【間取り提案3つ（理由付き）】\n【潜在ニーズ（Whyから掘り起こした本当の願い）】\n【トークスクリプト（オリズム式：寄り添い→共感→提案）】\n【概算見積もり】\n【自社の強みとの紐づけ（さりげなく）】`;
      setResult(await callClaude(sys, msg));
    } catch (e) { setError("エラー: " + e.message); }
    finally { setLoading(false); }
  };
  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      <div className="nikken-badge">ORism AI — オリズム式ヒアリング</div>
      <div className="section-title">ヒアリングシート</div>
      <p className="section-desc">{customer.name}様のヒアリング情報を入力・保存します。Whyの深掘りでお客様の本当の願いを引き出します。</p>
      <div className="progress">
        {["基本","暮らし","要望","Why","提案"].map((t,i) => <div key={t} className={`progress-step ${i < filled ? "done" : ""}`} title={t} />)}
      </div>
      <div className="card">
        <div className="card-title"><span className="num">1</span>家族構成・基本情報</div>
        <div style={{overflowX:"auto"}}>
          {members.map((m, i) => (
            <div className="member-row" key={i}>
              <div className="form-group"><label>{["ご主人","奥様","お子様1","お子様2"][i]||`${i+1}人目`}</label><input placeholder="山田 太郎" value={m.name} onChange={e => sm(i,"name",e.target.value)} /></div>
              <div className="form-group"><label>年齢</label><input placeholder="35" value={m.age} onChange={e => sm(i,"age",e.target.value)} /></div>
              <div className="form-group"><label>性別</label><select value={m.sex} onChange={e => sm(i,"sex",e.target.value)}><option>男性</option><option>女性</option></select></div>
              <div className="form-group"><label>職業</label><input placeholder="会社員" value={m.job} onChange={e => sm(i,"job",e.target.value)} /></div>
              <div className="form-group"><label>趣味・持ち物</label><input placeholder="ゴルフ、読書" value={m.hobby} onChange={e => sm(i,"hobby",e.target.value)} /></div>
            </div>
          ))}
        </div>
        <button className="add-btn" type="button" onClick={() => setMembers(m => [...m, {name:"",age:"",sex:"男性",job:"",hobby:""}])}>＋ お子様を追加</button>
        <hr className="divider" style={{marginTop:16}} />
        <div className="form-grid">
          <div className="form-group"><label>予算（万円）</label><input placeholder="3500" value={f.budget} onChange={e => s("budget",e.target.value)} /></div>
          <div className="form-group"><label>土地代</label><select value={f.land} onChange={e => s("land",e.target.value)}><option value="含む">土地代を含む</option><option value="含まない">建物のみ</option><option value="未定">未定</option></select></div>
          <div className="form-group"><label>希望坪数</label><input placeholder="35〜40坪" value={f.area} onChange={e => s("area",e.target.value)} /></div>
          <div className="form-group"><label>入居希望時期</label><input placeholder="2026年秋" value={f.timeline} onChange={e => s("timeline",e.target.value)} /></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><span className="num">2</span>1日の生活サイクル</div>
        <div className="form-grid">
          <div className="form-group"><label>平日（ご主人）</label><textarea placeholder="6時起床→7時出勤→19時帰宅→24時就寝" value={f.weekday_h} onChange={e => s("weekday_h",e.target.value)} /></div>
          <div className="form-group"><label>平日（奥様）</label><textarea placeholder="7時起床→パート9〜15時→21時就寝" value={f.weekday_w} onChange={e => s("weekday_w",e.target.value)} /></div>
          <div className="form-group full"><label>休日の過ごし方</label><textarea placeholder="家族でお出かけ、ゴルフ月2回…" style={{minHeight:"60px"}} value={f.weekend} onChange={e => s("weekend",e.target.value)} /></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><span className="num">3</span>くつろぎ・食事・水回り</div>
        <div className="form-group" style={{marginBottom:12}}><label>くつろぎ方</label><Chips options={["床にごろごろ","ソファ","椅子","その他"]} value={f.relax} onChange={v => s("relax",v)} /></div>
        <div className="form-group" style={{marginBottom:12}}><label>リビングイメージ</label><Chips options={["吹抜け","シアタールーム","2階リビング","開放的","ダイニング中心"]} value={f.living} onChange={v => s("living",v)} /></div>
        <div className="two-col">
          <div className="form-group"><label>食事</label><Chips options={["ダイニングテーブル","座卓"]} value={f.dining} onChange={v => s("dining",v)} multi={false} /></div>
          <div className="form-group"><label>キッチン</label><Chips options={["独立型","居間と一体型"]} value={f.kitchen} onChange={v => s("kitchen",v)} multi={false} /></div>
        </div>
        <div className="two-col" style={{marginTop:12}}>
          <div className="form-group"><label>お酒</label><input placeholder="夫：ビール毎晩" value={f.drink} onChange={e => s("drink",e.target.value)} /></div>
          <div className="form-group"><label>タバコ</label><input placeholder="夫：外のみ" value={f.smoke} onChange={e => s("smoke",e.target.value)} /></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><span className="num">4</span>来客・将来・収納</div>
        <div className="form-grid">
          <div className="form-group"><label>来客</label><Chips options={["ホームパーティ","宿泊客あり","ほぼなし"]} value={f.guest} onChange={v => s("guest",v)} /></div>
          <div className="form-group"><label>将来の家族変化</label><Chips options={["赤ちゃん誕生","親を呼ぶ","子供の独立","嫁婿を迎える"]} value={f.future} onChange={v => s("future",v)} /></div>
          <div className="form-group"><label>親子の距離感</label><Chips options={["プライバシー重視","和気あいあい"]} value={f.parent_child} onChange={v => s("parent_child",v)} multi={false} /></div>
          <div className="form-group"><label>就寝</label><Chips options={["ベッド","ふとん"]} value={f.sleep} onChange={v => s("sleep",v)} multi={false} /></div>
          <div className="form-group full"><label>収納の困りごと</label><textarea placeholder="玄関が散らかる、クローゼットが足りない…" style={{minHeight:"60px"}} value={f.storage} onChange={e => s("storage",e.target.value)} /></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><span className="num">5</span>外観・外まわり・設備</div>
        <div className="form-grid">
          <div className="form-group"><label>外観イメージ</label><input placeholder="シンプルモダン・ナチュラル" value={f.exterior} onChange={e => s("exterior",e.target.value)} /></div>
          <div className="form-group"><label>参考サイト・雑誌</label><input placeholder="Instagram、SUUMO" value={f.magazine} onChange={e => s("magazine",e.target.value)} /></div>
          <div className="form-group"><label>バルコニー</label><Chips options={["洗濯物干し","テラス","ガーデニング","不要"]} value={f.balcony} onChange={v => s("balcony",v)} /></div>
          <div className="form-group"><label>庭</label><Chips options={["ガーデニング","家庭菜園","子供の遊び場","不要"]} value={f.garden} onChange={v => s("garden",v)} /></div>
          <div className="form-group"><label>車・自転車</label><input placeholder="普通車2台" value={f.car} onChange={e => s("car",e.target.value)} /></div>
          <div className="form-group"><label>欲しい設備</label><Chips options={["床暖房","食洗機","ジェットバス","太陽光","蓄電池","EV充電"]} value={f.equipment} onChange={v => s("equipment",v)} /></div>
        </div>
      </div>
      <div className="card why-card">
        <div className="card-title"><span className="num why">6</span>Whyの深掘り<span className="why-badge">潜在ニーズ</span></div>
        <p className="why-hint">要望の裏にある「なぜ？」を引き出します。</p>
        <div className="form-grid">
          <div className="form-group"><label>ご主人の絶対譲れないこと</label><textarea placeholder="書斎は絶対欲しい。仕事を持ち帰るから。" value={f.must_h} onChange={e => s("must_h",e.target.value)} /></div>
          <div className="form-group"><label>奥様の絶対譲れないこと</label><textarea placeholder="キッチンからリビングが見渡せること。" value={f.must_w} onChange={e => s("must_w",e.target.value)} /></div>
          <div className="form-group full"><label>夫婦で意見が分かれていること</label><textarea placeholder="夫は吹き抜け希望・妻は光熱費が心配。" value={f.conflict} onChange={e => s("conflict",e.target.value)} /></div>
          <div className="form-group"><label>今の住まいの一番の不満</label><textarea style={{minHeight:"60px"}} value={f.complaint} onChange={e => s("complaint",e.target.value)} /></div>
          <div className="form-group"><label>10年後の暮らしイメージ</label><textarea style={{minHeight:"60px"}} value={f.future_life} onChange={e => s("future_life",e.target.value)} /></div>
          <div className="form-group full"><label>ライフスタイルのコア</label><textarea value={f.lifestyle_core} onChange={e => s("lifestyle_core",e.target.value)} /></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><span className="num">7</span>担当者コメント</div>
        <div className="form-group"><label>どんな住まいにしてあげたいか</label><textarea value={f.staff_note} onChange={e => s("staff_note",e.target.value)} /></div>
      </div>
      <div className="save-btn-row">
        <button className="btn-sm" onClick={handleSave}>💾 ヒアリング情報を保存</button>
        {saved && <span className="saved-tag">✓ 保存しました</span>}
      </div>
      <button className="btn" style={{marginTop:16}} onClick={generate} disabled={loading || !members[0].name}>
        {loading ? <span className="btn-loading"><span className="spinner" />AIが分析中...</span> : "AI提案を生成する"}
      </button>
      {error && <div className="error">{error}</div>}
      {result && <div className="result"><span className="result-badge">AI 提案＆分析</span><div className="result-content"><button className="copy-btn" onClick={copy}>{copied ? "コピー済 ✓" : "コピー"}</button>{result}</div></div>}
    </div>
  );
}

function EmailTab({ customer, onSaveHistory }) {
  const [mail, setMail] = useState("");
  const emailHistory = customer.emailHistory || [];
  const totalRounds = emailHistory.length + 1;

  const [isFirstContact, setIsFirstContact] = useState(true);
  const [scene, setScene] = useState("イベント");
  const [tone, setTone] = useState("丁寧・信頼感");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const hasHearing = customer.hearing && Object.values(customer.hearing).some(v => v);

  const hearingText = () => {
    if (!hasHearing) return "";
    const h = customer.hearing;
    const m = (customer.members || []).filter(m => m.name || m.age).map((m, i) =>
      `${["ご主人","奥様","お子様1","お子様2"][i]||`${i+1}人目`}：${m.name} ${m.age}歳 ${m.job}`
    ).join("、");
    return `\n\n【お客様のヒアリング情報】\n家族：${m}\n予算：${h.budget}万円（${h.land}）${h.area} 入居：${h.timeline}\nこだわり：${h.living} ${h.relax} ${h.equipment}\n譲れないこと（夫）：${h.must_h}\n譲れないこと（妻）：${h.must_w}\n今の不満：${h.complaint}\n10年後：${h.future_life}\n担当メモ：${h.staff_note}`;
  };

  const scenes = ["イベント","見学会","資料請求","提案後フォロー","「検討します」への返信","断り後の関係維持","一般的なやり取り"];
  const tones = ["丁寧・信頼感","親しみやすい","簡潔・スピード感"];

  const generate = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const historyText = emailHistory.length > 0
        ? "\n\n【これまでのやり取り履歴】\n" + emailHistory.map((h, i) =>
            `--- ${i+1}往復目 ---\nお客様：${h.customer}\n営業担当：${h.nikken}`
          ).join("\n\n")
        : "";

      const meetingGuide = !isFirstContact && totalRounds >= 3
        ? `今回で${totalRounds}往復目です。お客様が前向きなサインを見せていれば、メール末尾で「よろしければ一度お会いしてお話しできればと思いますが、いかがでしょうか？」をさりげなく添えてください。押しつけにならないよう自然に。`
        : `来場を急かす言葉は一切使わないこと。`;

      const closedQGuide = isFirstContact
        ? `初回のやり取りのため、目的は返信をもらうだけ。考えさせない超簡単な質問1問のみ。例：「現在はご賃貸にお住まいですか？」「お車は何台お持ちですか？」「土地はすでに見つかっていますか？」「資金計画はされたことがありますか？」から状況に合う1問。`
        : `2回目以降のやり取りのため、シーンに合った質問を選ぶ。
  見学会・イベント→「ご参加はご夫婦でお越しのご予定ですか？」
  資料請求→「土地はすでにお持ちですか？」
  提案後フォロー→「気になる点は金額面ですか、それとも間取りですか？」
  検討しますへの返信→「他社さんとも比較されていますか？」
  断り後の関係維持→「今後また家づくりを考える機会はありそうですか？」
  一般的なやり取り→メール内容から最も自然な質問を1問考える（例：「現在のお住まいで一番気になっているのはどのあたりですか？」「家づくりでまず気になるのは費用面ですか、デザイン面ですか？」）`;

      const sys = `あなたはオリズム式営業メソッドを習得した、中小工務店の営業担当です。会社情報は背景知識として持っておくだけで、自社の性能や受賞歴を積極的にアピールしてはいけません。
${NIKKEN_DATA}
${ORISM_DOCTRINE}
${hearingText()}

【メール作成の鉄則】
・主役はお客様。お客様の気持ち・悩み・状況に寄り添う文章にする
・「弊社は〇〇です」ではなく「〇〇でお悩みではないですか？」のスタンス
・ヒアリング情報がある場合はそれを踏まえた内容にする
・読んだ人が「この人に相談したい」と感じる、押しつけがましくない温かい文体
・売り込み感ゼロ

【来場誘導】${meetingGuide}

【クローズドクエスチョンの必須ルール】
・来場誘導を入れない場合：「ひとつだけ教えてください。」＋質問1問＋署名のみで締める
・来場誘導を入れる場合：来場の一文＋署名のみ。クローズドクエスチョンは不要
・質問・来場誘導の後に追加のお願いや選択肢は一切書かないこと
・${closedQGuide}

トーン：${tone}　シーン：${scene}

出力形式：
【件名】
【本文】
【次のアクション提案】（1つだけ）`;

      setResult(await callClaude(sys, `${historyText}\n\n【今回のお客様メール（${totalRounds}往復目）】\n${mail}`));
    } catch (e) { setError("エラー: " + e.message); }
    finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const saveToHistory = () => {
    if (!mail.trim() || !result.trim()) return;
    onSaveHistory({ customer: mail, nikken: result, date: new Date().toLocaleDateString("ja-JP") });
    setMail("");
    setResult("");
    alert("やり取りを保存しました！");
  };

  return (
    <div>
      <div className="nikken-badge">ORism AI — オリズム式メール返信</div>
      <div className="section-title">メール返信生成</div>
      <p className="section-desc">{customer.name}様とのやり取りを蓄積します。</p>

      {hasHearing && (
        <div className="card hearing-ref" style={{padding:"12px 16px", marginBottom:"14px"}}>
          <div style={{fontSize:"11px", fontWeight:"700", color:"#3a6020", marginBottom:"4px"}}>✅ ヒアリング情報あり — メール生成時に自動参照します</div>
          <div style={{fontSize:"11px", color:"#5a7840"}}>予算：{customer.hearing.budget}万円 / 入居：{customer.hearing.timeline} / こだわり：{customer.hearing.must_h || customer.hearing.relax}</div>
        </div>
      )}

      {emailHistory.length > 0 && (
        <div className="card history-card">
          <div className="card-title">💬 やり取り履歴（{emailHistory.length}往復）</div>
          <div className="history-log">
            {emailHistory.map((h, i) => (
              <div className="history-log-item" key={i}>
                <div className="history-log-header">
                  <span className="history-log-round">{i+1}往復目</span>
                  <span className="history-log-date">{h.date}</span>
                </div>
                <div className="history-log-preview">お客様：{h.customer}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">やり取りの段階</div>
        <div className="tone-btns">
          <button className={`tone-btn ${isFirstContact ? "selected" : ""}`} onClick={() => setIsFirstContact(true)}>初回のやり取り</button>
          <button className={`tone-btn ${!isFirstContact ? "selected" : ""}`} onClick={() => setIsFirstContact(false)}>2回目以降のやり取り</button>
        </div>
        <hr className="divider"/>
        <div className="card-title">シーン</div>
        <div className="tone-btns">{scenes.map(sc => <button key={sc} className={`tone-btn ${scene===sc?"selected":""}`} onClick={() => setScene(sc)}>{sc}</button>)}</div>
        <hr className="divider"/>
        <div className="card-title">トーン</div>
        <div className="tone-btns">{tones.map(t => <button key={t} className={`tone-btn ${tone===t?"selected":""}`} onClick={() => setTone(t)}>{t}</button>)}</div>
        <hr className="divider"/>
        <div style={{display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px"}}>
          <span className="round-badge">📩 {totalRounds}往復目</span>
        </div>
        <div className="form-group">
          <label>お客様からのメール本文</label>
          <textarea placeholder="ここにお客様のメールを貼り付けてください..." style={{minHeight:"150px"}} value={mail} onChange={e => setMail(e.target.value)} />
        </div>
        <button className="btn" onClick={generate} disabled={loading || !mail.trim()}>
          {loading ? <span className="btn-loading"><span className="spinner"/>生成中...</span> : "返信メールを生成する"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <span className="result-badge">返信メール</span>
          <div className="result-content">
            <button className="copy-btn" onClick={copy}>{copied ? "コピー済 ✓" : "コピー"}</button>
            {result}
          </div>
          <div className="save-btn-row" style={{marginTop:"10px"}}>
            <button className="btn-sm" onClick={saveToHistory}>💾 このやり取りを履歴に保存</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 値上げ説明AI =====
function PriceExplainTab({ customer, industry }) {
  const cfg = INDUSTRY_CONFIG[industry];
  const [form, setForm] = useState({
    material: "断熱材", rateUp: "40",
    reason: "原材料の輸入コスト上昇・円安の影響",
    impact: "", customerType: "既存客",
  });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const nikkenContext = industry === "nikken" ? `\n${NIKKEN_DATA}\n自社の強みを活かしつつ、誠実に説明してください。` : "";
      const sys = `あなたはオリズム式営業メソッドを習得した${cfg.businessName}の営業担当です。
資材・材料の価格上昇を${cfg.customer}に誠実かつ納得感を持って伝える説明文を作成してください。${nikkenContext}
${ORISM_DOCTRINE}

出力形式：
【口頭説明スクリプト】
（打ち合わせで使える自然な会話調、3〜5分程度）

【メール・書面用説明文】
（丁寧な書き言葉で）

【よくある反論への回答】
Q: 「他社はそんなに上がっていないのでは？」
A: 〜
Q: 「もう少し安くなりませんか？」
A: 〜
Q: 「予算オーバーになるのですが…」
A: 〜`;
      const userMsg = `値上げ内容：\n・対象材料：${form.material}\n・値上げ率：約${form.rateUp}%\n・主な理由：${form.reason}\n・${cfg.customer}への影響：${form.impact || "見積もり金額の増加"}\n・相手：${form.customerType}${customer ? `\n・お客様名：${customer.name}様` : ""}`;
      setResult(await callClaude(sys, userMsg));
    } catch (e) { setError("エラー: " + e.message); }
    finally { setLoading(false); }
  };
  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      <div className="nikken-badge">ORism AI — 値上げ説明（{cfg.label}）</div>
      <div className="section-title">値上げ説明AI</div>
      <p className="section-desc">資材価格の上昇を{cfg.customer}に納得してもらうための説明文・スクリプトを自動生成します。</p>
      {industry !== "nikken" && <div className="industry-badge">{cfg.label}モード</div>}
      <div className="crisis-banner">
        <strong>危機対応機能</strong> ｜ 断熱材・資材の価格高騰により、見積もり金額の再提示が必要な場面でご活用ください。
      </div>
      <div className="card">
        <div className="card-title">値上げ情報</div>
        <div className="form-grid">
          <div className="form-group"><label>値上げ対象の材料・資材</label><input placeholder="例：断熱材" value={form.material} onChange={e => set("material", e.target.value)} /></div>
          <div className="form-group"><label>値上げ率（%）</label><input placeholder="例：40" value={form.rateUp} onChange={e => set("rateUp", e.target.value)} /></div>
          <div className="form-group full"><label>値上がりの主な理由</label><input placeholder="例：原材料の輸入コスト上昇・円安の影響" value={form.reason} onChange={e => set("reason", e.target.value)} /></div>
          <div className="form-group full"><label>{cfg.customer}への具体的な影響（任意）</label><input placeholder="例：見積もり金額が約50万円増加する見込み" value={form.impact} onChange={e => set("impact", e.target.value)} /></div>
          <div className="form-group"><label>相手の種別</label>
            <select value={form.customerType} onChange={e => set("customerType", e.target.value)}>
              <option value="既存客">既存客（契約前）</option>
              <option value="契約済み客">契約済み客</option>
              <option value="見積もり中の新規客">見積もり中の新規客</option>
            </select>
          </div>
        </div>
        <button className="btn" onClick={generate} disabled={loading || !form.material}>
          {loading ? <span className="btn-loading"><span className="spinner" />生成中...</span> : "値上げ説明文を生成する"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && <div className="result"><span className="result-badge">説明スクリプト</span><div className="result-content"><button className="copy-btn" onClick={copy}>{copied ? "コピー済 ✓" : "コピー"}</button>{result}</div></div>}
    </div>
  );
}

// ===== 着工遅延お詫び文AI =====
function DelayApologyTab({ customer, industry }) {
  const cfg = INDUSTRY_CONFIG[industry];
  const [form, setForm] = useState({
    delayReason: "ユニットバス受注停止", delayPeriod: "2〜3ヶ月",
    originalDate: "", newDate: "", compensation: "", customerName: customer?.name || "",
  });
  const [docType, setDocType] = useState("口頭スクリプト");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const docTypes = ["口頭スクリプト", "お詫び書面・メール", "両方"];
  const reasons = ["ユニットバス受注停止", "断熱材の入荷遅延", "サッシ・窓の供給不足", "職人・施工業者の確保困難", "その他（自由入力）"];

  useEffect(() => {
    if (customer?.name) setForm(f => ({ ...f, customerName: customer.name }));
  }, [customer?.name]);

  const generate = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const nikkenContext = industry === "nikken" ? `\n${NIKKEN_DATA}\n自社としての誠意ある対応を心がけてください。` : "";
      const sys = `あなたはオリズム式営業メソッドを習得した${cfg.businessName}の担当者です。
${cfg.customer}に工事・着工の遅延を誠意を持って伝え、信頼関係を維持するための文章を作成してください。${nikkenContext}
${ORISM_DOCTRINE}

出力形式（${docType}）：
${docType === "口頭スクリプト" || docType === "両方" ? `【口頭お詫びスクリプト】\n（訪問・電話で使える自然な会話調、3〜4分程度。謝罪→状況説明→今後のスケジュール→フォロー提案の流れで）\n` : ""}
${docType === "お詫び書面・メール" || docType === "両方" ? `【お詫び書面・メール文】\n（件名付き。丁寧な書き言葉で。信頼回復に重点を置いて）\n` : ""}
【信頼回復のためのアクション提案】
（次の打ち合わせまでにできることを3点）`;
      const userMsg = `遅延情報：\n・遅延の原因：${form.delayReason}\n・遅延期間の目安：${form.delayPeriod}\n・当初の着工・完工予定：${form.originalDate || "未記入"}\n・新しい予定：${form.newDate || "現時点では未確定"}\n・補償・対応策：${form.compensation || "特になし（誠意ある対応を心がける）"}\n・お客様名：${form.customerName || "○○"}様`;
      setResult(await callClaude(sys, userMsg));
    } catch (e) { setError("エラー: " + e.message); }
    finally { setLoading(false); }
  };
  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      <div className="nikken-badge">ORism AI — 着工遅延お詫び（{cfg.label}）</div>
      <div className="section-title">着工遅延お詫び文AI</div>
      <p className="section-desc">資材不足・供給停止による工事遅延を{cfg.customer}に伝えるお詫び文・スクリプトを生成します。</p>
      {industry !== "nikken" && <div className="industry-badge">{cfg.label}モード</div>}
      <div className="crisis-banner">
        <strong>危機対応機能</strong> ｜ ユニットバス受注停止・資材不足による着工遅延の{cfg.customer}対応にご活用ください。
      </div>
      <div className="card">
        <div className="card-title">遅延情報</div>
        <div className="form-grid">
          <div className="form-group full"><label>遅延の主な原因</label>
            <select value={form.delayReason} onChange={e => set("delayReason", e.target.value)}>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group"><label>遅延期間の目安</label><input placeholder="例：2〜3ヶ月" value={form.delayPeriod} onChange={e => set("delayPeriod", e.target.value)} /></div>
          <div className="form-group"><label>お客様名（任意）</label><input placeholder="例：田中" value={form.customerName} onChange={e => set("customerName", e.target.value)} /></div>
          <div className="form-group"><label>当初の着工・完工予定</label><input placeholder="例：2026年5月着工" value={form.originalDate} onChange={e => set("originalDate", e.target.value)} /></div>
          <div className="form-group"><label>新しい予定（分かれば）</label><input placeholder="例：2026年8月以降" value={form.newDate} onChange={e => set("newDate", e.target.value)} /></div>
          <div className="form-group full"><label>補償・対応策（任意）</label><input placeholder="例：設計変更の無償対応、打ち合わせの優先実施など" value={form.compensation} onChange={e => set("compensation", e.target.value)} /></div>
        </div>
        <div className="card-title" style={{marginTop: "8px"}}>出力形式</div>
        <div className="tone-btns" style={{marginBottom: "16px"}}>
          {docTypes.map(t => <button key={t} className={`tone-btn ${docType === t ? "selected" : ""}`} onClick={() => setDocType(t)}>{t}</button>)}
        </div>
        <button className="btn" onClick={generate} disabled={loading || !form.delayReason}>
          {loading ? <span className="btn-loading"><span className="spinner" />生成中...</span> : "お詫び文を生成する"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && <div className="result"><span className="result-badge">お詫び文</span><div className="result-content"><button className="copy-btn" onClick={copy}>{copied ? "コピー済 ✓" : "コピー"}</button>{result}</div></div>}
    </div>
  );
}

// ===== 汎用AIタブ（設定駆動。案A・案Bの全タブで使用）=====
function GenericAITab({ badgeLabel, title, description, cautionNote, formFields, buildSystem, buildUserMessage, resultLabel }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(formFields.map(f => [f.key, f.default ?? (f.type === "select" && f.options ? f.options[0] : "")]))
  );
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      setResult(await callClaude(buildSystem(form), buildUserMessage(form)));
    } catch (e) { setError("エラー: " + e.message); }
    finally { setLoading(false); }
  };
  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      <div className="nikken-badge">ORism AI — {badgeLabel}</div>
      <div className="section-title">{title}</div>
      <p className="section-desc">{description}</p>
      {cautionNote && <div className="crisis-banner">{cautionNote}</div>}
      <div className="card">
        <div className="card-title">入力</div>
        <div className="form-grid">
          {formFields.map(f => (
            <div key={f.key} className={`form-group ${f.full ? "full" : ""}`}>
              <label>{f.label}</label>
              {f.type === "select" ? (
                <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
              ) : (
                <input placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
              )}
            </div>
          ))}
        </div>
        <button className="btn" onClick={generate} disabled={loading}>
          {loading ? <span className="btn-loading"><span className="spinner" />生成中...</span> : `${resultLabel}を生成する`}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && <div className="result"><span className="result-badge">{resultLabel}</span><div className="result-content"><button className="copy-btn" onClick={copy}>{copied ? "コピー済 ✓" : "コピー"}</button>{result}</div></div>}
    </div>
  );
}

// ===== 案A：経営コンサルタブ =====
const CONSULT_TABS = [
  {
    label: "📊 経営診断",
    props: {
      badgeLabel: "経営診断",
      title: "経営診断AI",
      description: "月商・粗利率・受注状況から、中小工務店の経営課題と改善策を診断します。",
      resultLabel: "経営診断レポート",
      formFields: [
        { key: "revenue", label: "月商（万円）", placeholder: "例：3000" },
        { key: "grossMargin", label: "粗利率（%）", placeholder: "例：25" },
        { key: "contracts", label: "年間受注棟数", placeholder: "例：12" },
        { key: "employees", label: "従業員数", placeholder: "例：8" },
        { key: "area", label: "対応エリア", placeholder: "例：○○県中部", full: true },
        { key: "concern", label: "現在の課題・気になっている点", type: "textarea", placeholder: "例：粗利が改善しない、元請け案件が増えない、職人の高齢化…", full: true },
      ],
      buildSystem: () => `あなたはオリズム代表の工務店経営コンサルタントです。${ORISM_CONSULT_DOCTRINE}
相談は地域密着の中小工務店経営者からのものです。提出された数字から、SWOT観点の経営診断、粗利改善に効く施策3点、3ヶ月で実行可能なアクションプランを出してください。

出力形式：
【経営スナップショット】（3行で現状を要約）
【SWOT簡易診断】S/W/O/T 各2点
【今すぐ効く改善策 TOP3】（粗利・集客・組織のバランスで。各施策について「期待効果」「実行コスト」「所要期間」を明記）
【3ヶ月アクションプラン】（週単位のマイルストーン）`,
      buildUserMessage: f => `月商：${f.revenue}万円\n粗利率：${f.grossMargin}%\n年間受注棟数：${f.contracts}棟\n従業員数：${f.employees}名\n対応エリア：${f.area}\n経営者の気になっている点：\n${f.concern}`,
    }
  },
  {
    label: "💰 値決め・粗利改善",
    props: {
      badgeLabel: "値決め・粗利改善",
      title: "値決め・粗利改善AI",
      description: "原価・競合相場・差別化要素から、受注も粗利も落とさない適正価格を提案します。",
      resultLabel: "価格戦略レポート",
      formFields: [
        { key: "grade", label: "商品グレード", type: "select", options: ["高性能住宅", "標準住宅", "ローコスト住宅", "自然素材系", "デザイン住宅"] },
        { key: "cost", label: "原価坪単価（万円）", placeholder: "例：55" },
        { key: "competitor", label: "競合の平均坪単価（万円）", placeholder: "例：75" },
        { key: "targetMargin", label: "目標粗利率（%）", placeholder: "例：28" },
        { key: "differentiator", label: "自社の差別化要素・強み", type: "textarea", placeholder: "例：UA値0.46、自社大工、アフター永年保証、補助金活用サポート…", full: true },
      ],
      buildSystem: () => `あなたはオリズム代表の工務店経営コンサルタントです。${ORISM_CONSULT_DOCTRINE}
値決めは「安さで勝つ」ではなく「価値で納得してもらう」が鉄則です。原価・競合・差別化から、受注を逃さず粗利を守れる価格戦略を提案してください。

出力形式：
【適正坪単価の提案】（3パターン：安全/推奨/攻め。各パターンの粗利率と受注確度コメント）
【値決めロジック】（なぜその価格か、顧客に説明できる理由3点）
【お客様への説明トークスクリプト】（売り込み感なし、オリズム式の寄り添い型で）
【粗利改善のための付帯施策】（オプション販売・契約の磨き込みなど3点）`,
      buildUserMessage: f => `商品グレード：${f.grade}\n原価坪単価：${f.cost}万円\n競合の平均坪単価：${f.competitor}万円\n目標粗利率：${f.targetMargin}%\n差別化要素：\n${f.differentiator}`,
    }
  },
  {
    label: "📈 集客戦略",
    props: {
      badgeLabel: "集客戦略",
      title: "集客戦略AI",
      description: "エリア・ターゲット・予算から、費用対効果の高い集客チャネル配分を提案します。",
      resultLabel: "集客戦略プラン",
      formFields: [
        { key: "area", label: "対応エリア", placeholder: "例：○○県中部" },
        { key: "target", label: "ターゲット年代", type: "select", options: ["20代後半〜30代前半（一次取得層）", "30代後半〜40代（建替え・子育て世代）", "40代〜50代（2世帯・終の棲家）", "60代以上（終活・リフォーム）", "全年代"] },
        { key: "budget", label: "月額広告予算（万円）", placeholder: "例：30" },
        { key: "current", label: "現在使っている集客チャネル", type: "textarea", placeholder: "例：SUUMO掲載、Instagram投稿、紹介のみ…", full: true },
        { key: "goal", label: "集客目標（月間問い合わせ数など）", placeholder: "例：月5件の見学予約", full: true },
      ],
      buildSystem: () => `あなたはオリズム代表の工務店経営コンサルタントです。${ORISM_CONSULT_DOCTRINE}
地域密着中小工務店に最適化した集客戦略を提案してください。広告費用対効果と地域密着性を両立させます。

出力形式：
【チャネル配分プラン】（Web広告／SNS／リアル／紹介 の推奨配分比率と月額予算内訳）
【優先度TOP3の施策】（各施策の期待月間問い合わせ数、実行コスト、立ち上げ所要期間）
【1ヶ月目の実行プラン】（週単位でやること）
【計測すべきKPI】（3つ、数字で追える指標）`,
      buildUserMessage: f => `エリア：${f.area}\nターゲット年代：${f.target}\n月額広告予算：${f.budget}万円\n現在の集客チャネル：\n${f.current}\n集客目標：${f.goal}`,
    }
  },
  {
    label: "🎯 営業トーク",
    props: {
      badgeLabel: "営業トーク",
      title: "営業トーク・差別化AI",
      description: "競合との比較・お客様の悩みから、受注に効く差別化トークと反論対応を生成します。",
      resultLabel: "営業トークスクリプト",
      formFields: [
        { key: "competitor", label: "競合会社名・タイプ", placeholder: "例：大手ハウスメーカーA社、地場ビルダーB社" },
        { key: "competitorStrength", label: "競合の強み", placeholder: "例：ブランド安心感、大規模展示場" },
        { key: "ourStrength", label: "自社の強み", placeholder: "例：高気密高断熱、自社大工" },
        { key: "priceDiff", label: "価格差", type: "select", options: ["自社が安い", "ほぼ同じ", "自社が高い（1割程度）", "自社が高い（2割以上）"] },
        { key: "concern", label: "お客様の悩み・不安", type: "textarea", placeholder: "例：光熱費、予算オーバー、職人の質、アフター対応…", full: true },
      ],
      buildSystem: () => `あなたはオリズム式営業メソッドを熟知した中小工務店の営業コンサルタントです。${ORISM_DOCTRINE}${ORISM_CONSULT_DOCTRINE}
競合比較と自社差別化を元に、売り込み感ゼロで受注に効くトークスクリプトを作成してください。

出力形式：
【差別化の芯（これだけは外さない訴求点）】（3点）
【お客様の悩みに寄り添う導入トーク】（30秒で話せる自然な会話調）
【競合と比較された時の対応トーク】（価格差に触れつつ、値引きせず価値で納得させる）
【よくある反論への返答】
Q: 「もう少し安くなりませんか？」
A: 〜
Q: 「大手の方が安心では？」
A: 〜
Q: 「もう少し検討させてください」
A: 〜`,
      buildUserMessage: f => `競合：${f.competitor}\n競合の強み：${f.competitorStrength}\n自社の強み：${f.ourStrength}\n価格差：${f.priceDiff}\nお客様の悩み：\n${f.concern}`,
    }
  },
  {
    label: "📝 セミナー台本",
    props: {
      badgeLabel: "セミナー台本",
      title: "セミナー台本生成AI",
      description: "テーマと所要時間から、集客セミナー・勉強会の完全な進行台本を生成します。",
      resultLabel: "セミナー台本",
      formFields: [
        { key: "theme", label: "セミナーのテーマ", placeholder: "例：失敗しない家づくり勉強会", full: true },
        { key: "duration", label: "所要時間", type: "select", options: ["60分", "90分", "120分", "180分"] },
        { key: "target", label: "対象参加者", type: "select", options: ["家づくり検討初期の20代〜30代", "建替え検討の40代〜50代", "土地から探す層", "リフォーム層", "全世代向け"] },
        { key: "appeal", label: "主な訴求ポイント・伝えたいこと", type: "textarea", placeholder: "例：高気密高断熱の光熱費効果、資金計画の罠、失敗事例の紹介…", full: true },
      ],
      buildSystem: () => `あなたはオリズム式営業メソッドを熟知した中小工務店のセミナー講師コンサルタントです。${ORISM_DOCTRINE}${ORISM_CONSULT_DOCTRINE}
売り込み感ゼロで、終了後に「この会社に相談したい」と自然に思われるセミナー台本を作成してください。

出力形式：
【セミナータイトル案】（3案）
【進行アジェンダ】（時間配分つき）
【オープニングトーク】（自然な会話調、5分）
【本編の要点スライド構成】（見出し＋1枚ごとに話す内容のサマリ）
【クロージングトーク】（次のアクションに自然に誘導、3分）
【配布物の提案】（3点）`,
      buildUserMessage: f => `テーマ：${f.theme}\n所要時間：${f.duration}\n対象参加者：${f.target}\n訴求したいポイント：\n${f.appeal}`,
    }
  },
];

// ===== 案B：集客支援タブ =====
const MARKETING_TABS = [
  {
    label: "📱 Instagram投稿",
    props: {
      badgeLabel: "Instagram投稿",
      title: "Instagram投稿文生成AI",
      description: "施工写真やイベント写真に合わせた、地域密着の投稿キャプションとハッシュタグを生成します。",
      resultLabel: "Instagram投稿文",
      formFields: [
        { key: "theme", label: "投稿テーマ", placeholder: "例：新築お引き渡し写真、完成見学会告知、施主さんのインタビュー" },
        { key: "area", label: "地域名（ハッシュタグ用）", placeholder: "例：○○市" },
        { key: "tone", label: "トーン", type: "select", options: ["温かみのある家族系", "スタイリッシュ・デザイン系", "ナチュラル・自然素材系", "お役立ち情報系"] },
        { key: "point", label: "伝えたいポイント", type: "textarea", placeholder: "例：吹き抜けの開放感、薪ストーブ、高気密高断熱、施主さんの笑顔…", full: true },
      ],
      buildSystem: () => `あなたはオリズム式集客メソッドを習得した中小工務店のSNS担当です。${ORISM_MARKETING_DOCTRINE}
売り込み感ゼロで、ユーザーが「いいね」したくなる自然なInstagramキャプションを書いてください。

出力形式：
【キャプション本文】（200〜400字、絵文字ほどよく、改行多めの読みやすいInstagram向け）
【ハッシュタグ】（#30個以内。地域系・家づくり系・トレンド系をバランスよく）
【投稿アドバイス】（時間帯・画像構成のコツ 2〜3点）`,
      buildUserMessage: f => `投稿テーマ：${f.theme}\n地域：${f.area}\nトーン：${f.tone}\n伝えたいポイント：\n${f.point}`,
    }
  },
  {
    label: "📰 ブログ記事",
    props: {
      badgeLabel: "ブログ記事",
      title: "ブログ記事生成AI",
      description: "SEOキーワードと想定読者から、検索流入を狙ったブログ記事の構成・本文を生成します。",
      resultLabel: "ブログ記事",
      formFields: [
        { key: "keyword", label: "SEOキーワード", placeholder: "例：○○市 注文住宅 坪単価" },
        { key: "audience", label: "想定読者", placeholder: "例：30代前半、共働き、土地探しから" },
        { key: "length", label: "目安文字数", type: "select", options: ["2000字（コンパクト）", "3000字（標準）", "5000字（しっかり）"] },
        { key: "angle", label: "記事の切り口・伝えたいこと", type: "textarea", placeholder: "例：坪単価のからくりを正直に解説、○○市の相場、失敗しない選び方…", full: true },
      ],
      buildSystem: () => `あなたはオリズム式集客メソッドを習得した中小工務店のWebライターです。${ORISM_MARKETING_DOCTRINE}
検索ユーザーが満足する、SEOとユーザー体験を両立したブログ記事を書いてください。

出力形式：
【タイトル案】（3案、検索意図に合うもの）
【メタディスクリプション】（120字以内）
【記事構成（H2/H3見出し）】
【本文】（指定文字数目安で、セクションごとに分けて）
【記事末のCTA】（来場予約や資料請求に自然誘導、売り込み感なし）`,
      buildUserMessage: f => `SEOキーワード：${f.keyword}\n想定読者：${f.audience}\n目安文字数：${f.length}\n記事の切り口：\n${f.angle}`,
    }
  },
  {
    label: "📧 LINE配信",
    props: {
      badgeLabel: "LINE一斉配信",
      title: "LINE一斉配信文生成AI",
      description: "配信目的とセグメントから、開封・クリックされるLINE配信文を生成します。",
      resultLabel: "LINE配信文",
      formFields: [
        { key: "purpose", label: "配信目的", type: "select", options: ["見学会・イベント告知", "キャンペーン告知", "お役立ち情報シェア", "お引き渡し事例紹介", "お客様の声紹介"] },
        { key: "segment", label: "配信対象", type: "select", options: ["全友だち", "見学会参加済み", "資料請求済み", "商談中", "OB顧客"] },
        { key: "content", label: "伝えたい内容", type: "textarea", placeholder: "例：今週末の完成見学会、○○市、予約10組限定、プレゼントあり…", full: true },
      ],
      buildSystem: () => `あなたはオリズム式集客メソッドを習得した中小工務店のLINE配信担当です。${ORISM_MARKETING_DOCTRINE}
LINEは短さと親近感が命。読んだ瞬間にタップしたくなる配信文を書いてください。

出力形式：
【配信文本文】（300字以内、絵文字適度、改行多め）
【リッチメニュー用タイトル案】（15字以内、2案）
【タップされやすい時間帯の提案】（平日／週末 でそれぞれ1案）
【配信後のKPI目安】（開封率・クリック率の想定ベンチマーク）`,
      buildUserMessage: f => `配信目的：${f.purpose}\n配信対象：${f.segment}\n内容：\n${f.content}`,
    }
  },
  {
    label: "🎬 YouTube台本",
    props: {
      badgeLabel: "YouTube台本",
      title: "YouTube動画台本生成AI",
      description: "動画のテーマと尺から、完全な進行台本（導入・本編・CTA）を生成します。",
      resultLabel: "YouTube動画台本",
      formFields: [
        { key: "theme", label: "動画テーマ", placeholder: "例：高気密高断熱の家の冬の実録", full: true },
        { key: "duration", label: "動画尺", type: "select", options: ["3分（ショート）", "5〜7分（標準）", "10〜15分（じっくり）"] },
        { key: "target", label: "ターゲット視聴者", placeholder: "例：家づくり検討中の30代夫婦" },
        { key: "message", label: "伝えたいメッセージ・見どころ", type: "textarea", placeholder: "例：実際の光熱費、体感温度、施主さんのリアル感想…", full: true },
      ],
      buildSystem: () => `あなたはオリズム式集客メソッドを習得した中小工務店のYouTube企画担当です。${ORISM_MARKETING_DOCTRINE}
最後まで視聴されて、来場予約や資料請求につながる台本を書いてください。

出力形式：
【動画タイトル案】（3案、クリックされるもの）
【サムネイル用キャッチコピー】（15字以内、3案）
【導入（フック）】（0:00〜0:30 で離脱させない）
【本編構成】（時間配分つき、セクションごとに話す内容）
【クロージング・CTA】（自然な導線で概要欄や来場予約へ）
【撮影のコツ】（3点、地域工務店でも実行可能なもの）`,
      buildUserMessage: f => `テーマ：${f.theme}\n動画尺：${f.duration}\nターゲット：${f.target}\n伝えたいメッセージ：\n${f.message}`,
    }
  },
  {
    label: "🖼️ チラシコピー",
    props: {
      badgeLabel: "チラシコピー",
      title: "チラシ・キャッチコピー生成AI",
      description: "商品・ターゲットから、ポスティングで反応を取るチラシのキャッチコピーとボディコピーを生成します。",
      resultLabel: "チラシコピー一式",
      formFields: [
        { key: "product", label: "商品・サービス", placeholder: "例：高気密高断熱の注文住宅", full: true },
        { key: "axis", label: "キャッチコピー軸", type: "select", options: ["光熱費メリット系", "快適性・健康系", "デザイン・憧れ系", "価格・資金系", "安心・実績系"] },
        { key: "target", label: "読ませたい層", placeholder: "例：築20年以上の戸建にお住まいの40代" },
        { key: "offer", label: "オファー・キャンペーン（あれば）", placeholder: "例：完成見学会のご案内、先着10組プレゼント", full: true },
      ],
      buildSystem: () => `あなたはオリズム式集客メソッドを習得した中小工務店のチラシコピーライターです。${ORISM_MARKETING_DOCTRINE}
ポスティングで捨てられず読まれるチラシコピーを作ってください。キャッチコピーは一瞬で刺さる言葉で。

出力形式：
【メインキャッチコピー案】（3案、20字以内）
【サブキャッチ（キャッチを補足）】（3案、30字以内）
【ボディコピー本文】（200字程度、読んで悩みに共感させて行動促す）
【CTA（行動喚起）文言】（見学会予約・資料請求に誘導、2案）
【チラシレイアウトの提案】（構成ブロックの順番、3〜4段構成）`,
      buildUserMessage: f => `商品・サービス：${f.product}\nキャッチコピー軸：${f.axis}\n読ませたい層：${f.target}\nオファー：${f.offer}`,
    }
  },
];

function AddCustomerModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">お客様を追加</div>
        <div className="form-group">
          <label>お客様名</label>
          <input placeholder="山田 太郎" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-btns">
          <button className="modal-btn secondary" onClick={onClose}>キャンセル</button>
          <button className="modal-btn primary" onClick={() => name.trim() && onAdd(name.trim())} disabled={!name.trim()}>追加</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [customers, setCustomers] = useState(() => loadCustomers());
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [industry, setIndustry] = useState("nikken");
  const [mode, setMode] = useState("sales");

  const selectedCustomer = customers.find(c => c.id === selectedId);
  const SALES_TAB_LABELS = ["📋 ヒアリングシート", "✉️ メール返信生成", "📈 値上げ説明AI", "🔔 着工遅延お詫び文"];
  const tabs = mode === "sales"
    ? SALES_TAB_LABELS
    : mode === "consult"
      ? CONSULT_TABS.map(t => t.label)
      : MARKETING_TABS.map(t => t.label);

  const changeMode = (m) => { setMode(m); setTab(0); };

  const addCustomer = (name) => {
    const newC = { id: Date.now().toString(), name, createdAt: new Date().toLocaleDateString("ja-JP"), hearing: EMPTY_HEARING, members: EMPTY_MEMBERS, emailHistory: [] };
    const updated = [...customers, newC];
    setCustomers(updated);
    saveCustomers(updated);
    setSelectedId(newC.id);
    setShowAddModal(false);
  };

  const deleteCustomer = (id) => {
    if (!window.confirm("このお客様のデータを削除しますか？")) return;
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    saveCustomers(updated);
    setSelectedId(null);
  };

  const updateCustomer = (id, data) => {
    const updated = customers.map(c => c.id === id ? { ...c, ...data } : c);
    setCustomers(updated);
    saveCustomers(updated);
  };

  const saveHearing = (data) => updateCustomer(selectedId, data);
  const saveEmailHistory = (entry) => {
    const c = customers.find(c => c.id === selectedId);
    updateCustomer(selectedId, { emailHistory: [...(c.emailHistory || []), entry] });
  };

  return (
    <>
      <style>{STYLES}</style>
      {showAddModal && <AddCustomerModal onAdd={addCustomer} onClose={() => setShowAddModal(false)} />}
      <div className="app">
        <div className="header">
          <div>
            <div className="header-logo">O<span className="accent">R</span>ism <span>AI 工務店支援システム</span></div>
            <div className="header-sub">営業・経営コンサル・集客支援の3モード搭載 — オリズム式メソッド</div>
          </div>
          <div className="header-right">
            <div className="mode-selector">
              <button className={`mode-btn ${mode === "sales" ? "active" : ""}`} onClick={() => changeMode("sales")}>営業支援</button>
              <button className={`mode-btn ${mode === "consult" ? "active" : ""}`} onClick={() => changeMode("consult")}>経営コンサル</button>
              <button className={`mode-btn ${mode === "marketing" ? "active" : ""}`} onClick={() => changeMode("marketing")}>集客支援</button>
            </div>
            {mode === "sales" && (
              <div className="industry-selector">
                <span className="industry-label">業種</span>
                <select className="industry-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                  {Object.entries(INDUSTRY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="layout">
          {mode === "sales" && (
            <div className="sidebar">
              <div className="sidebar-title">👥 お客様一覧</div>
              <button className="add-customer-btn" onClick={() => setShowAddModal(true)}>＋ お客様を追加</button>
              {customers.map(c => (
                <div key={c.id} className={`customer-item ${selectedId === c.id ? "active" : ""}`} onClick={() => { setSelectedId(c.id); setTab(0); }}>
                  <div className="customer-item-name">{c.name}</div>
                  <div className="customer-item-meta">{c.emailHistory?.length || 0}往復 · {c.createdAt}</div>
                </div>
              ))}
              {customers.length === 0 && <div style={{fontSize:"11px", color:"#999", textAlign:"center", marginTop:"20px"}}>お客様を追加してください</div>}
            </div>
          )}
          <div className="main-area">
            {mode === "sales" ? (
              !selectedCustomer ? (
                <div className="no-customer">
                  <div className="no-customer-title">お客様を選択してください</div>
                  <div style={{fontSize:"13px"}}>左のサイドバーからお客様を選ぶか、<br/>新規追加してください</div>
                </div>
              ) : (
                <>
                  <div className="tabs">
                    {tabs.map((t,i) => <button key={i} className={`tab ${tab===i?"active":""}`} onClick={() => setTab(i)}>{t}</button>)}
                  </div>
                  <div className="main">
                    <div className="customer-banner">
                      <div>
                        <div className="customer-banner-name">👤 {selectedCustomer.name} 様</div>
                        <div className="customer-banner-meta">登録日：{selectedCustomer.createdAt} · メール{selectedCustomer.emailHistory?.length || 0}往復</div>
                      </div>
                      <button className="customer-banner-del" onClick={() => deleteCustomer(selectedId)}>削除</button>
                    </div>
                    {tab === 0 && <HearingTab customer={selectedCustomer} onSave={saveHearing} />}
                    {tab === 1 && <EmailTab customer={selectedCustomer} onSaveHistory={saveEmailHistory} />}
                    {tab === 2 && <PriceExplainTab customer={selectedCustomer} industry={industry} />}
                    {tab === 3 && <DelayApologyTab customer={selectedCustomer} industry={industry} />}
                  </div>
                </>
              )
            ) : (
              <>
                <div className="tabs">
                  {tabs.map((t,i) => <button key={i} className={`tab ${tab===i?"active":""}`} onClick={() => setTab(i)}>{t}</button>)}
                </div>
                <div className="main">
                  {mode === "consult" && CONSULT_TABS[tab] && <GenericAITab key={`consult-${tab}`} {...CONSULT_TABS[tab].props} />}
                  {mode === "marketing" && MARKETING_TABS[tab] && <GenericAITab key={`marketing-${tab}`} {...MARKETING_TABS[tab].props} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
