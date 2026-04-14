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

  const selectedCustomer = customers.find(c => c.id === selectedId);
  const tabs = ["📋 ヒアリングシート", "✉️ メール返信生成", "📈 値上げ説明AI", "🔔 着工遅延お詫び文"];

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
            <div className="header-logo">O<span className="accent">R</span>ism <span>AI 営業支援システム</span></div>
            <div className="header-sub">中小工務店のための、地域ナンバーワン営業メソッド搭載 AI</div>
          </div>
          <div className="industry-selector">
            <span className="industry-label">業種</span>
            <select className="industry-select" value={industry} onChange={e => setIndustry(e.target.value)}>
              {Object.entries(INDUSTRY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="layout">
          <div className="sidebar">
            <div className="sidebar-title">👥 お客様一覧</div>
            <button className="add-customer-btn" onClick={() => setShowAddModal(true)}>＋ お客様を追加</button>
            {customers.map(c => (
              <div key={c.id} className={`customer-item ${selectedId === c.id ? "active" : ""}`} onClick={() => { setSelectedId(c.id); setTab(0); }}>
                <div className="customer-item-name">{c.name}</div>
                <div className="customer-item-meta">{c.emailHistory?.length || 0}往復 · {c.createdAt}</div>
              </div>
            ))}
            {customers.length === 0 && <div style={{fontSize:"11px", color:"#8aaa60", textAlign:"center", marginTop:"20px"}}>お客様を追加してください</div>}
          </div>
          <div className="main-area">
            {!selectedCustomer ? (
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
