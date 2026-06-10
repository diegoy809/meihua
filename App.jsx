import { useState, useEffect, useMemo } from "react";

/* ───────────── 基础数据 ───────────── */

// 八卦：序数 1乾 2兑 3离 4震 5巽 6坎 7艮 8坤
// l = 爻线，自下而上，1阳 0阴
const T = [null,
  { n: "乾", s: "☰", l: [1, 1, 1], w: "金", img: "天" },
  { n: "兑", s: "☱", l: [1, 1, 0], w: "金", img: "泽" },
  { n: "离", s: "☲", l: [1, 0, 1], w: "火", img: "火" },
  { n: "震", s: "☳", l: [1, 0, 0], w: "木", img: "雷" },
  { n: "巽", s: "☴", l: [0, 1, 1], w: "木", img: "风" },
  { n: "坎", s: "☵", l: [0, 1, 0], w: "水", img: "水" },
  { n: "艮", s: "☶", l: [0, 0, 1], w: "土", img: "山" },
  { n: "坤", s: "☷", l: [0, 0, 0], w: "土", img: "地" },
];

// 六十四卦名 HEX[上卦][下卦]
const HEX = [null,
  ["乾为天", "天泽履", "天火同人", "天雷无妄", "天风姤", "天水讼", "天山遁", "天地否"],
  ["泽天夬", "兑为泽", "泽火革", "泽雷随", "泽风大过", "泽水困", "泽山咸", "泽地萃"],
  ["火天大有", "火泽睽", "离为火", "火雷噬嗑", "火风鼎", "火水未济", "火山旅", "火地晋"],
  ["雷天大壮", "雷泽归妹", "雷火丰", "震为雷", "雷风恒", "雷水解", "雷山小过", "雷地豫"],
  ["风天小畜", "风泽中孚", "风火家人", "风雷益", "巽为风", "风水涣", "风山渐", "风地观"],
  ["水天需", "水泽节", "水火既济", "水雷屯", "水风井", "坎为水", "水山蹇", "水地比"],
  ["山天大畜", "山泽损", "山火贲", "山雷颐", "山风蛊", "山水蒙", "艮为山", "山地剥"],
  ["地天泰", "地泽临", "地火明夷", "地雷复", "地风升", "地水师", "地山谦", "坤为地"],
].map((row, i) => (i < 1 ? row : Object.assign({}, ...row.map((v, j) => ({ [j + 1]: v })))));

// 卦义提要
const MEAN = {
  乾为天: "刚健自强", 坤为地: "厚德载物", 水雷屯: "起始维艰", 山水蒙: "启蒙待教",
  水天需: "守正待时", 天水讼: "慎争戒讼", 地水师: "行险而顺", 水地比: "亲附团结",
  风天小畜: "蓄养待进", 天泽履: "谨慎践行", 地天泰: "通泰安康", 天地否: "闭塞不通",
  天火同人: "上下和同", 火天大有: "盛大丰有", 地山谦: "谦逊受益", 雷地豫: "顺时而动",
  泽雷随: "随顺时势", 山风蛊: "整饬除弊", 地泽临: "临事而治", 风地观: "观察省思",
  火雷噬嗑: "果决去障", 山火贲: "文饰得体", 山地剥: "剥落止损", 地雷复: "一阳来复",
  天雷无妄: "守正无妄", 山天大畜: "大有积蓄", 山雷颐: "颐养有道", 泽风大过: "非常之时",
  坎为水: "险中守信", 离为火: "附丽光明", 泽山咸: "感应相通", 雷风恒: "恒久守常",
  天山遁: "退避保身", 雷天大壮: "壮盛守正", 火地晋: "进取上升", 地火明夷: "韬光养晦",
  风火家人: "正家之道", 火泽睽: "异中求同", 水山蹇: "险阻在前", 雷水解: "缓解舒困",
  山泽损: "损中有益", 风雷益: "增益进取", 泽天夬: "决断果行", 天风姤: "不期而遇",
  泽地萃: "聚集会合", 地风升: "柔顺上升", 泽水困: "困境守志", 水风井: "养而不穷",
  泽火革: "顺时变革", 火风鼎: "鼎新革故", 震为雷: "临危不乱", 艮为山: "适可而止",
  风山渐: "循序渐进", 雷泽归妹: "慎始知终", 雷火丰: "丰盛宜守", 火山旅: "行旅在外",
  巽为风: "谦逊申命", 兑为泽: "和悦相处", 风水涣: "涣散重聚", 水泽节: "节制有度",
  风泽中孚: "诚信立身", 雷山小过: "小事可为", 水火既济: "功成慎守", 火水未济: "事未竟成",
};

// 五行生克
const SHENG = { 金: "水", 水: "木", 木: "火", 火: "土", 土: "金" };
const KE = { 金: "木", 木: "土", 土: "水", 水: "火", 火: "金" };

const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const SHICHEN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const mod = (n, m) => { const r = n % m; return r === 0 ? m : r; };

function trigramFromLines(l3) {
  for (let i = 1; i <= 8; i++)
    if (T[i].l[0] === l3[0] && T[i].l[1] === l3[1] && T[i].l[2] === l3[2]) return i;
  return 1;
}

// 体用生克判断
function relation(tiW, otherW) {
  if (tiW === otherW) return { key: "比和", text: `${tiW}${otherW}比和`, level: 2 };
  if (SHENG[otherW] === tiW) return { key: "用生体", text: `${otherW}生${tiW}，生体`, level: 3 };
  if (KE[tiW] === otherW) return { key: "体克用", text: `${tiW}克${otherW}，体克之`, level: 1 };
  if (SHENG[tiW] === otherW) return { key: "体生用", text: `${tiW}生${otherW}，泄体`, level: -1 };
  return { key: "用克体", text: `${otherW}克${tiW}，克体`, level: -2 };
}

const VERDICT = {
  用生体: { tag: "大吉", seal: "吉", desc: "用卦生体卦，有人相助、外缘顺遂，所求之事易成。" },
  比和: { tag: "吉", seal: "吉", desc: "体用比和，气势相合，谋事顺利，多有同心之助。" },
  体克用: { tag: "吉·费力", seal: "吉", desc: "体卦克用卦，事可成，但需自己主动争取，稍费周折。" },
  体生用: { tag: "不利·耗泄", seal: "慎", desc: "体卦生用卦，泄耗自身精力财物，事倍功半，宜量力。" },
  用克体: { tag: "凶", seal: "凶", desc: "用卦克体卦，阻力较大，恐有损耗，宜守不宜进。" },
};

// 完整起卦计算
function cast(shang, xia, dong) {
  const up = T[shang], low = T[xia];
  const lines = [...low.l, ...up.l]; // 初爻在前
  const tiIsUp = dong <= 3;          // 动爻在下卦→下为用、上为体
  const ti = tiIsUp ? up : low;
  const yong = tiIsUp ? low : up;

  // 互卦：2-4爻为下互，3-5爻为上互
  const huLow = trigramFromLines([lines[1], lines[2], lines[3]]);
  const huUp = trigramFromLines([lines[2], lines[3], lines[4]]);

  // 变卦：动爻阴阳互变
  const bLines = [...lines];
  bLines[dong - 1] = 1 - bLines[dong - 1];
  const bianLow = trigramFromLines(bLines.slice(0, 3));
  const bianUp = trigramFromLines(bLines.slice(3));
  const bianChanged = tiIsUp ? T[bianLow] : T[bianUp]; // 变出的那一半

  return {
    shang, xia, dong, lines, tiIsUp, ti, yong,
    name: HEX[shang][xia], mean: MEAN[HEX[shang][xia]] || "",
    hu: { up: huUp, low: huLow, name: HEX[huUp][huLow], lines: [T[huLow].l, T[huUp].l].flat() },
    bian: { up: bianUp, low: bianLow, name: HEX[bianUp][bianLow], lines: bLines, changed: bianChanged },
    main: relation(ti.w, yong.w),
    huRel: [relation(ti.w, T[huLow].w), relation(ti.w, T[huUp].w)],
    bianRel: relation(ti.w, bianChanged.w),
  };
}

/* ───────────── 组件 ───────────── */

function Yao({ yang, moving, delay }) {
  return (
    <div className="yao-row" style={{ animationDelay: `${delay}ms` }}>
      {yang ? <span className={`bar full ${moving ? "mov" : ""}`} />
        : <><span className={`bar half ${moving ? "mov" : ""}`} /><span className={`bar half ${moving ? "mov" : ""}`} /></>}
      {moving && <i className="dot" />}
    </div>
  );
}

function Gua({ title, sub, lines, dong, name, mean, badges, base }) {
  // 自上而下渲染：上爻在最上
  return (
    <div className="gua-col">
      <div className="gua-title">{title}<em>{sub}</em></div>
      <div className="gua-lines">
        {[5, 4, 3, 2, 1, 0].map((i, k) => (
          <Yao key={i} yang={lines[i] === 1} moving={dong === i + 1}
            delay={(base || 0) + k * 90} />
        ))}
      </div>
      {badges && (
        <div className="badge-wrap">
          <span className={`badge ${badges.upIsTi ? "ti" : "yong"}`}>{badges.upIsTi ? "体" : "用"}·{badges.up}</span>
          <span className={`badge ${badges.upIsTi ? "yong" : "ti"}`}>{badges.upIsTi ? "用" : "体"}·{badges.low}</span>
        </div>
      )}
      <div className="gua-name">{name}</div>
      {mean && <div className="gua-mean">{mean}</div>}
    </div>
  );
}

function Branch() {
  return (
    <svg viewBox="0 0 160 90" className="plum" aria-hidden="true">
      <path d="M158 6 C120 22 92 30 64 52 C46 66 30 76 6 84" fill="none" stroke="#5b5347" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M96 36 C90 28 84 24 74 20 M52 60 C50 50 46 44 40 40" fill="none" stroke="#5b5347" strokeWidth="1.8" strokeLinecap="round" />
      {[[74, 18], [96, 35], [40, 39], [118, 22], [28, 70]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          {[0, 72, 144, 216, 288].map(a => (
            <circle key={a} cx={4.6 * Math.cos(a * Math.PI / 180)} cy={4.6 * Math.sin(a * Math.PI / 180)} r="3.4" fill="#c5697a" opacity="0.92" />
          ))}
          <circle r="1.7" fill="#e9c46a" />
        </g>
      ))}
    </svg>
  );
}

export default function MeihuaApp() {
  const [mode, setMode] = useState("time");
  const [now, setNow] = useState(new Date());
  // 时间起卦：年支自动、农历月日手填
  const [zhiIdx, setZhiIdx] = useState((new Date().getFullYear() - 4) % 12);
  const [lMonth, setLMonth] = useState("");
  const [lDay, setLDay] = useState("");
  // 数字起卦
  const [numA, setNumA] = useState("");
  const [numB, setNumB] = useState("");
  const [addHour, setAddHour] = useState(true);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const hourIdx = useMemo(() => {
    const h = now.getHours();
    return h >= 23 || h < 1 ? 0 : Math.floor((h + 1) / 2) % 12;
  }, [now]);
  const shichenNum = hourIdx + 1; // 子1…亥12

  function doCast() {
    setErr("");
    let shang, xia, dong, src;
    if (mode === "time") {
      const m = parseInt(lMonth, 10), d = parseInt(lDay, 10);
      if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 30)) { setErr("请填写农历月（1–12）和农历日（1–30），手机日历上可直接查到。"); return; }
      const y = zhiIdx + 1;
      shang = mod(y + m + d, 8);
      xia = mod(y + m + d + shichenNum, 8);
      dong = mod(y + m + d + shichenNum, 6);
      src = `${ZHI[zhiIdx]}年(${y}) 农历${m}月${d}日 ${SHICHEN[hourIdx]}时(${shichenNum})`;
    } else if (mode === "num") {
      const a = parseInt(numA, 10), b = parseInt(numB, 10);
      if (!(a >= 1) || !(b >= 1)) { setErr("请填入两个正整数，可以是心中默念的数、字数、笔画数等。"); return; }
      shang = mod(a, 8);
      xia = mod(b, 8);
      dong = mod(a + b + (addHour ? shichenNum : 0), 6);
      src = `先天数 ${a}、${b}${addHour ? ` + ${SHICHEN[hourIdx]}时(${shichenNum})` : ""}`;
    } else {
      const a = 1 + Math.floor(Math.random() * 64), b = 1 + Math.floor(Math.random() * 64);
      shang = mod(a, 8); xia = mod(b, 8); dong = mod(a + b + shichenNum, 6);
      src = `随机数 ${a}、${b} + ${SHICHEN[hourIdx]}时(${shichenNum})`;
    }
    setResult({ ...cast(shang, xia, dong), src, q: question.trim() });
  }

  const r = result;
  const v = r && VERDICT[r.main.key];

  return (
    <div className="root">
      <style>{`
        
        .root{min-height:100vh;background:radial-gradient(120% 90% at 50% 0%,#2a3340 0%,#1b222b 52%,#141a21 100%);
          color:#ded5c2;font-family:'PingFang SC','Noto Sans SC',sans-serif;padding:20px 14px 56px;display:flex;flex-direction:column;align-items:center;}
        .serif{font-family:'Noto Serif SC','Songti SC','STSong',serif;}
        .wrap{width:100%;max-width:520px;}
        header{position:relative;text-align:center;padding:6px 0 18px;}
        .plum{position:absolute;right:-6px;top:-8px;width:120px;opacity:.85;}
        h1{font-family:'Noto Serif SC','Songti SC',serif;font-weight:900;font-size:34px;letter-spacing:.22em;color:#efe7d3;margin:0;}
        .subtitle{font-size:12px;letter-spacing:.42em;color:#8f9aa8;margin-top:6px;}
        .tabs{display:flex;gap:8px;margin:14px 0 12px;}
        .tab{flex:1;padding:10px 0;border:1px solid #3a4351;border-radius:8px;background:transparent;color:#aab4c2;
          font-size:14px;letter-spacing:.14em;cursor:pointer;transition:all .2s;}
        .tab.on{background:#efe7d3;color:#2e2a24;border-color:#efe7d3;font-weight:600;}
        .panel{background:rgba(239,231,211,.06);border:1px solid #353e4b;border-radius:12px;padding:16px;}
        .row{display:flex;gap:10px;margin-bottom:10px;}
        .field{flex:1;display:flex;flex-direction:column;gap:5px;}
        .field label{font-size:12px;color:#9aa5b3;letter-spacing:.12em;}
        input,select{background:#11161d;border:1px solid #3a4351;border-radius:8px;color:#e7dfcd;padding:10px 12px;font-size:16px;width:100%;box-sizing:border-box;}
        input:focus,select:focus{outline:2px solid #b5382a;outline-offset:1px;border-color:#b5382a;}
        .hint{font-size:12px;color:#7e8896;line-height:1.6;margin-top:2px;}
        .auto-line{font-size:13px;color:#c8bfa9;margin-bottom:10px;}
        .auto-line b{color:#e9c46a;font-weight:600;}
        .check{display:flex;align-items:center;gap:8px;font-size:13px;color:#aab4c2;margin-bottom:6px;}
        .check input{width:auto;}
        .go{width:100%;margin-top:8px;padding:14px 0;border:none;border-radius:10px;background:#b5382a;color:#f6efe0;
          font-size:17px;letter-spacing:.5em;text-indent:.5em;font-family:'Noto Serif SC',serif;font-weight:600;cursor:pointer;transition:transform .15s;}
        .go:active{transform:scale(.98);}
        .err{color:#e08a7d;font-size:13px;margin-top:8px;line-height:1.6;}
        /* 卦纸 */
        .paper{margin-top:18px;background:linear-gradient(173deg,#f4ecda 0%,#efe5cd 100%);border:1px solid #d9caa6;
          border-radius:12px;color:#2e2a24;padding:18px 14px 22px;box-shadow:0 10px 30px rgba(0,0,0,.35);}
        .src{font-size:12px;color:#8a7d62;text-align:center;letter-spacing:.06em;margin-bottom:4px;}
        .qline{font-family:'Noto Serif SC',serif;text-align:center;font-size:15px;color:#4a4336;margin-bottom:12px;}
        .three{display:flex;justify-content:space-between;gap:6px;}
        .gua-col{flex:1;display:flex;flex-direction:column;align-items:center;min-width:0;}
        .gua-title{font-size:13px;color:#6e6250;letter-spacing:.2em;margin-bottom:8px;display:flex;flex-direction:column;align-items:center;gap:2px;}
        .gua-title em{font-style:normal;font-size:10px;color:#a3937a;letter-spacing:.3em;}
        .gua-lines{display:flex;flex-direction:column;gap:7px;}
        .yao-row{position:relative;display:flex;gap:8px;width:74px;justify-content:center;animation:ink .5s both;}
        @keyframes ink{from{opacity:0;transform:scaleX(.2);}to{opacity:1;transform:scaleX(1);}}
        @media (prefers-reduced-motion: reduce){.yao-row{animation:none;}}
        .bar{height:9px;background:#332e26;border-radius:1.5px;}
        .bar.full{width:74px;}
        .bar.half{width:33px;}
        .bar.mov{background:#b5382a;}
        .dot{position:absolute;right:-14px;top:1px;width:7px;height:7px;border-radius:50%;background:#b5382a;}
        .badge-wrap{display:flex;gap:6px;margin-top:10px;}
        .badge{font-size:11px;padding:2px 7px;border-radius:4px;letter-spacing:.08em;}
        .badge.ti{background:#2e4a3f;color:#cfe7d4;}
        .badge.yong{background:#6e3a2e;color:#f3d9c8;}
        .gua-name{font-family:'Noto Serif SC','Songti SC',serif;font-weight:900;font-size:17px;margin-top:10px;letter-spacing:.1em;color:#2e2a24;text-align:center;}
        .gua-mean{font-size:11px;color:#8a7d62;margin-top:3px;letter-spacing:.12em;}
        /* 断语 */
        .judge{position:relative;margin-top:18px;border-top:1px dashed #cbb98f;padding-top:16px;}
        .judge h3{font-family:'Noto Serif SC',serif;font-size:14px;letter-spacing:.3em;color:#6e6250;margin:0 0 10px;}
        .jrow{display:flex;align-items:baseline;gap:10px;font-size:14px;line-height:1.8;color:#423b30;}
        .jrow .k{flex-shrink:0;font-size:12px;color:#8a7d62;width:64px;letter-spacing:.1em;}
        .vtag{display:inline-block;font-family:'Noto Serif SC',serif;font-weight:600;color:#b5382a;margin-right:6px;}
        .desc{margin-top:10px;font-size:14px;line-height:1.9;color:#423b30;}
        .seal{position:absolute;right:4px;top:14px;width:54px;height:54px;background:#b5382a;color:#f6efe0;border-radius:6px;
          display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;font-weight:900;font-size:30px;
          transform:rotate(6deg);box-shadow:inset 0 0 0 2px rgba(246,239,224,.55), inset 0 0 0 5px #b5382a, 0 3px 8px rgba(0,0,0,.18);
          animation:stamp .35s .8s both;}
        @keyframes stamp{from{opacity:0;transform:rotate(6deg) scale(1.6);}to{opacity:1;transform:rotate(6deg) scale(1);}}
        @media (prefers-reduced-motion: reduce){.seal{animation:none;}}
        footer{margin-top:22px;font-size:11px;color:#5f6975;text-align:center;letter-spacing:.1em;line-height:1.8;}
      `}</style>

      <div className="wrap">
        <header>
          <Branch />
          <h1>梅花心易</h1>
          <div className="subtitle">随时随地 · 一念起卦</div>
        </header>

        <div className="tabs" role="tablist">
          {[["time", "时间起卦"], ["num", "数字起卦"], ["rand", "随机起卦"]].map(([k, label]) => (
            <button key={k} role="tab" aria-selected={mode === k} className={`tab ${mode === k ? "on" : ""}`}
              onClick={() => { setMode(k); setResult(null); setErr(""); }}>{label}</button>
          ))}
        </div>

        <div className="panel">
          <div className="field" style={{ marginBottom: 12 }}>
            <label>所占何事（可不填）</label>
            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="如：此行是否顺利" />
          </div>

          {mode === "time" && (
            <>
              <div className="auto-line">已自动取当前时辰：<b>{SHICHEN[hourIdx]}时</b>（数 {shichenNum}）</div>
              <div className="row">
                <div className="field">
                  <label>年支（已按今年预选）</label>
                  <select value={zhiIdx} onChange={e => setZhiIdx(+e.target.value)}>
                    {ZHI.map((z, i) => <option key={z} value={i}>{z}（{i + 1}）</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>农历月</label>
                  <input inputMode="numeric" value={lMonth} onChange={e => setLMonth(e.target.value)} placeholder="1–12" />
                </div>
                <div className="field">
                  <label>农历日</label>
                  <input inputMode="numeric" value={lDay} onChange={e => setLDay(e.target.value)} placeholder="1–30" />
                </div>
              </div>
              <div className="hint">月、日请按农历填写，手机自带日历里就能看到今天的农历日期。若在立春前后或正月，请留意年支是否需要调整。</div>
            </>
          )}

          {mode === "num" && (
            <>
              <div className="row">
                <div className="field">
                  <label>第一个数（起上卦）</label>
                  <input inputMode="numeric" value={numA} onChange={e => setNumA(e.target.value)} placeholder="任意正整数" />
                </div>
                <div className="field">
                  <label>第二个数（起下卦）</label>
                  <input inputMode="numeric" value={numB} onChange={e => setNumB(e.target.value)} placeholder="任意正整数" />
                </div>
              </div>
              <label className="check">
                <input type="checkbox" checked={addHour} onChange={e => setAddHour(e.target.checked)} />
                动爻加时辰数（当前 {SHICHEN[hourIdx]} 时 = {shichenNum}）
              </label>
              <div className="hint">可用心中默念的两个数、问话字数、来人报的数、所见之数等。</div>
            </>
          )}

          {mode === "rand" && (
            <div className="hint" style={{ marginBottom: 4 }}>心中默想所问之事，凝神片刻，再按下起卦。随机数将自动加当前时辰起动爻。</div>
          )}

          <button className="go" onClick={doCast}>起卦</button>
          {err && <div className="err">{err}</div>}
        </div>

        {r && (
          <div className="paper" key={r.src + r.name + Math.random()}>
            <div className="src">{r.src} · 动爻第{["一", "二", "三", "四", "五", "六"][r.dong - 1]}爻</div>
            {r.q && <div className="qline serif">问：{r.q}</div>}

            <div className="three">
              <Gua title="本卦" sub="现状" lines={r.lines} dong={r.dong}
                name={r.name} mean={r.mean} base={0}
                badges={{ upIsTi: r.tiIsUp, up: `${T[r.shang].n}${T[r.shang].w}`, low: `${T[r.xia].n}${T[r.xia].w}` }} />
              <Gua title="互卦" sub="过程" lines={r.hu.lines}
                name={r.hu.name} mean={MEAN[r.hu.name]} base={180} />
              <Gua title="变卦" sub="结局" lines={r.bian.lines} dong={r.dong}
                name={r.bian.name} mean={MEAN[r.bian.name]} base={360} />
            </div>

            <div className="judge">
              <div className="seal" aria-label={`断：${v.seal}`}>{v.seal}</div>
              <h3>断 语</h3>
              <div className="jrow"><span className="k">体用</span>
                <span>体为{r.ti.n}({r.ti.w})，用为{r.yong.n}({r.yong.w})。{r.main.text}——<span className="vtag">{v.tag}</span></span></div>
              <div className="jrow"><span className="k">过程·互卦</span>
                <span>{T[r.hu.low].n}{r.huRel[0].text}；{T[r.hu.up].n}{r.huRel[1].text}</span></div>
              <div className="jrow"><span className="k">结局·变卦</span>
                <span>{r.bian.changed.n}({r.bian.changed.w}){r.bianRel.text}，结局{r.bianRel.level > 0 ? "趋吉" : "宜慎"}</span></div>
              <div className="desc">{v.desc} 卦意「{r.mean}」，终至「{MEAN[r.bian.name]}」。断卦仍须结合所问之事灵活取象，外应尤为关键。</div>
            </div>
          </div>
        )}

        <footer>体用生克为大要 · 互卦观过程 · 变卦定结局<br />易者意也，仅供参考自省，不必拘泥</footer>
      </div>
    </div>
  );
}
