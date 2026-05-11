// ============================================================
// 礼物侦探事务所 · 交互层
// ============================================================

const SCREENS = ["cover", "relation", "budget", "quiz", "open", "result", "gallery"];
const STEP_OF_SCREEN = {       // 进度条对应步骤（0 = 不显示）
  cover: 0, relation: 1, budget: 2, quiz: 3, open: 4, result: 4, gallery: 0
};

const state = {
  screen: "cover",
  relation: null,
  budget: null,
  answers: [],            // 长度 12 的数组，存 "E"/"I"/"M" 等
  quizIdx: 0,
  open: { o1: "", o2: "", o3: "", o4: "" },
  persona: null,
  scores: null
};

// ---------- 工具：屏切换 ----------
function goto(screen) {
  state.screen = screen;
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.toggle("active", s.dataset.screen === screen);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 进度
  const step = STEP_OF_SCREEN[screen];
  const wrap = document.getElementById("progressWrap");
  const fill = document.getElementById("progressFill");
  const txt = document.getElementById("progressText");
  if (step === 0) {
    wrap.style.display = "none";
  } else {
    wrap.style.display = "block";
    fill.style.width = (step / 4 * 100) + "%";
    txt.textContent = `第 ${step} 步 / 共 4 步`;
  }

  // 重新调查按钮与图鉴入口
  document.getElementById("restartBtn").hidden = (screen === "cover" || screen === "gallery");
  document.getElementById("gallery-entry").hidden = (screen === "gallery");
}

// ---------- 渲染 Step 1 关系 ----------
function renderRelations() {
  const grid = document.getElementById("relationGrid");
  grid.innerHTML = "";
  RELATIONS.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "opt-card";
    btn.innerHTML = `
      <div class="opt-emoji">${r.emoji}</div>
      <div class="opt-body">
        <div class="opt-title">${r.label}</div>
        <div class="opt-hint">${r.hint}</div>
      </div>
    `;
    btn.addEventListener("click", () => {
      state.relation = r.id;
      grid.querySelectorAll(".opt-card").forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
      setTimeout(() => goto("budget"), 280);
    });
    grid.appendChild(btn);
  });
}

// ---------- 渲染 Step 2 预算 ----------
function renderBudgets() {
  const grid = document.getElementById("budgetGrid");
  grid.innerHTML = "";
  BUDGETS.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "budget-card";
    const meta = b.max === 99999 ? "高预算 · 重磅级" :
                 b.min === 0 ? "心意为主 · 实用小物" :
                 `中间价位 · 兼顾品质与设计`;
    btn.innerHTML = `
      <div>
        <div class="b-label">¥ ${b.label}</div>
        <div class="b-meta">${meta}</div>
      </div>
      <div style="font-size:20px;">›</div>
    `;
    btn.addEventListener("click", () => {
      state.budget = b.id;
      grid.querySelectorAll(".budget-card").forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
      setTimeout(() => {
        state.quizIdx = 0;
        state.answers = [];
        goto("quiz");
        renderQuiz();
      }, 260);
    });
    grid.appendChild(btn);
  });
}

// ---------- 渲染 Step 3 题目 ----------
function renderQuiz() {
  const i = state.quizIdx;
  const q = QUESTIONS[i];
  document.getElementById("quizQ").textContent = q.q;
  document.getElementById("quizSubHint").textContent = `第 ${i+1} / ${QUESTIONS.length} 题`;

  // 选项
  const optsEl = document.getElementById("quizOptions");
  optsEl.innerHTML = "";
  q.options.forEach(opt => {
    const b = document.createElement("button");
    b.className = "quiz-opt";
    b.textContent = opt.label;
    if (state.answers[i] === opt.value) b.classList.add("picked");
    b.addEventListener("click", () => {
      state.answers[i] = opt.value;
      optsEl.querySelectorAll(".quiz-opt").forEach(x => x.classList.remove("picked"));
      b.classList.add("picked");
      // 下一题或进入开放题
      setTimeout(() => {
        if (state.quizIdx < QUESTIONS.length - 1) {
          state.quizIdx++;
          renderQuiz();
        } else {
          goto("open");
        }
      }, 240);
    });
    optsEl.appendChild(b);
  });

  // 进度点
  const dots = document.getElementById("quizDots");
  dots.innerHTML = "";
  for (let k = 0; k < QUESTIONS.length; k++) {
    const d = document.createElement("span");
    d.className = "dot" + (k < i ? " done" : (k === i ? " current" : ""));
    dots.appendChild(d);
  }

  // 上一题按钮
  document.getElementById("quizBack").disabled = (i === 0);
}

// ---------- 评分 & 人格判定 ----------
function computeScores() {
  const scores = { E:0, I:0, M:0, A:0, L:0, R:0, S:0, W:0 };
  state.answers.forEach(v => { if (v) scores[v]++; });
  return scores;
}

function pickCode(scores) {
  const a = scores.E >= scores.I ? "E" : "I";
  const b = scores.M >= scores.A ? "M" : "A";
  const c = scores.L >= scores.R ? "L" : "R";
  const d = scores.S >= scores.W ? "S" : "W";
  return a + b + c + d;
}

// 置信度：3:0 强 / 2:1 弱
function dimStrength(scores) {
  return {
    EI: Math.abs(scores.E - scores.I) === 3 ? "strong" : "weak",
    MA: Math.abs(scores.M - scores.A) === 3 ? "strong" : "weak",
    LR: Math.abs(scores.L - scores.R) === 3 ? "strong" : "weak",
    SW: Math.abs(scores.S - scores.W) === 3 ? "strong" : "weak"
  };
}

// ---------- 礼物推荐引擎 ----------
// 预算为严格筛选条件：只在 [budget.min, budget.max] 范围内出商品。
// 同人格+同关系优先；只要凑足几件算几件，不为了凑数量破坏预算。
function recommendGifts() {
  const persona = state.persona;
  const budget = BUDGETS.find(b => b.id === state.budget);
  const relation = state.relation;
  const openText = Object.values(state.open).join(" ").toLowerCase();
  const TARGET = 6;

  // 严格预算区间过滤
  const inBudget = g => g.price >= budget.min && g.price <= budget.max;

  // 1) 人格 + 关系（最强）
  const tier1 = GIFTS.filter(g =>
    inBudget(g) && g.personas.includes(persona) && g.relations.includes(relation)
  );
  // 2) 同人格，关系不匹配
  const tier2 = GIFTS.filter(g =>
    inBudget(g) && g.personas.includes(persona) && !g.relations.includes(relation)
  );
  // 3) 关系匹配，人格不匹配
  const tier3 = GIFTS.filter(g =>
    inBudget(g) && !g.personas.includes(persona) && g.relations.includes(relation)
  );
  // 4) 其他范围内礼物（仅为预算较窄时提供额外后备）
  const tier4 = GIFTS.filter(g =>
    inBudget(g) && !g.personas.includes(persona) && !g.relations.includes(relation)
  );

  function scoreGift(g, tier) {
    let s = 0;
    if (tier === 1) s += 10;
    else if (tier === 2) s += 5;
    else if (tier === 3) s += 2;
    else s += 0.5;
    // 关键词加分
    g.tags.forEach(t => {
      if (openText.includes(t.toLowerCase())) s += 2.5;
    });
    return s;
  }

  const all = [
    ...tier1.map(g => ({ g, tier: 1, score: scoreGift(g, 1) })),
    ...tier2.map(g => ({ g, tier: 2, score: scoreGift(g, 2) })),
    ...tier3.map(g => ({ g, tier: 3, score: scoreGift(g, 3) })),
    ...tier4.map(g => ({ g, tier: 4, score: scoreGift(g, 4) }))
  ];
  all.sort((a, b) => b.score - a.score);

  const picked = [];
  const seen = new Set();
  for (const h of all) {
    if (!seen.has(h.g.name)) {
      picked.push(h.g);
      seen.add(h.g.name);
      if (picked.length >= TARGET) break;
    }
  }
  return picked;
}

// 找到开放题里命中的关键词，结果页高亮用
function findHitKeywords() {
  const openText = Object.values(state.open).join(" ").toLowerCase();
  if (!openText.trim()) return [];
  const all = new Set();
  GIFTS.forEach(g => g.tags.forEach(t => {
    if (openText.includes(t.toLowerCase())) all.add(t);
  }));
  return Array.from(all).slice(0, 8);
}

// ---------- 雷达图 ----------
function renderRadar(scores) {
  // 四个维度归一到 0-1
  const dims = [
    { label: "外向", short: "E", val: scores.E / 3 },
    { label: "美学", short: "A", val: scores.A / 3 },
    { label: "感性", short: "L", val: scores.L / 3 },
    { label: "新鲜", short: "W", val: scores.W / 3 }
  ];
  const cx = 140, cy = 140, R = 95;
  const angles = [-Math.PI/2, 0, Math.PI/2, Math.PI]; // 上 右 下 左

  // 三层网格
  let grid = "";
  [0.33, 0.66, 1].forEach(ratio => {
    const pts = angles.map(a =>
      `${cx + Math.cos(a) * R * ratio},${cy + Math.sin(a) * R * ratio}`
    ).join(" ");
    grid += `<polygon points="${pts}" fill="none" stroke="rgba(31,26,23,.10)" stroke-width="1"/>`;
  });
  // 轴
  let axis = "";
  angles.forEach(a => {
    axis += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a)*R}" y2="${cy + Math.sin(a)*R}" stroke="rgba(31,26,23,.10)" stroke-width="1"/>`;
  });

  // 数据多边形
  const dataPts = dims.map((d, i) => {
    const a = angles[i];
    return `${cx + Math.cos(a) * R * d.val},${cy + Math.sin(a) * R * d.val}`;
  }).join(" ");

  // 数据点
  let dots = "";
  dims.forEach((d, i) => {
    const a = angles[i];
    const x = cx + Math.cos(a) * R * d.val;
    const y = cy + Math.sin(a) * R * d.val;
    dots += `<circle cx="${x}" cy="${y}" r="4" fill="#D8456C"/>`;
  });

  // 标签
  const labels = [
    { x: cx, y: cy - R - 14, text: "外向 ←→ 内敛", anchor: "middle" },
    { x: cx + R + 12, y: cy + 4, text: "美学 ←→ 极简", anchor: "start" },
    { x: cx, y: cy + R + 22, text: "感性 ←→ 理性", anchor: "middle" },
    { x: cx - R - 12, y: cy + 4, text: "新鲜 ←→ 稳定", anchor: "end" }
  ];
  let labelHtml = "";
  labels.forEach(l => {
    labelHtml += `<text x="${l.x}" y="${l.y}" text-anchor="${l.anchor}" font-size="11" fill="#4A413B" font-family="Noto Sans SC, sans-serif">${l.text}</text>`;
  });

  return `
    <svg class="radar-svg" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg">
      ${grid}
      ${axis}
      <polygon points="${dataPts}" fill="rgba(216,69,108,.22)" stroke="#D8456C" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
      ${labelHtml}
    </svg>
  `;
}

// ---------- 维度 chips ----------
function renderDimChips(scores, code) {
  const items = [
    { d: "EI", left: "外向 E", right: "内敛 I", lScore: scores.E, rScore: scores.I, pick: code[0] },
    { d: "MA", left: "极简 M", right: "美学 A", lScore: scores.M, rScore: scores.A, pick: code[1] },
    { d: "LR", left: "感性 L", right: "理性 R", lScore: scores.L, rScore: scores.R, pick: code[2] },
    { d: "SW", left: "稳定 S", right: "新鲜 W", lScore: scores.S, rScore: scores.W, pick: code[3] }
  ];
  return items.map(it => {
    const pickedSide = (it.pick === it.left.split(" ")[1]) ? "left" : "right";
    const winner = pickedSide === "left" ? it.left : it.right;
    const winScore = Math.max(it.lScore, it.rScore);
    return `<div class="dim-chip"><b>${winner}</b> · ${winScore}/3</div>`;
  }).join("");
}

// ---------- 渲染结果 ----------
function renderResult() {
  const scores = computeScores();
  const code = pickCode(scores);
  state.scores = scores;
  state.persona = code;
  const persona = PERSONAS[code];
  const gifts = recommendGifts();
  const hitKw = findHitKeywords();
  const strength = dimStrength(scores);

  // 弱维度提示
  const weakHints = [];
  if (strength.EI === "weak")
    weakHints.push(scores.E > scores.I ? "<b>I（内敛）</b>" : "<b>E（外向）</b>");
  if (strength.MA === "weak")
    weakHints.push(scores.M > scores.A ? "<b>A（美学）</b>" : "<b>M（极简）</b>");
  if (strength.LR === "weak")
    weakHints.push(scores.L > scores.R ? "<b>R（理性）</b>" : "<b>L（感性）</b>");
  if (strength.SW === "weak")
    weakHints.push(scores.S > scores.W ? "<b>W（新鲜）</b>" : "<b>S（稳定）</b>");

  // 侦探备注
  const rel = RELATIONS.find(r => r.id === state.relation);
  const budget = BUDGETS.find(b => b.id === state.budget);

  let detective = `侦探发现：TA 是 <b>「${persona.name}」</b>。`;
  detective += `${persona.desc}<br/>`;
  detective += `关系定位：<b>${rel.label}</b> · 预算带：<b>¥${budget.label}</b>。`;
  if (hitKw.length) {
    detective += `<br/>线索关键词：${hitKw.map(k => `<span class="kw-tag">${k}</span>`).join(" ")}`;
  }
  if (weakHints.length) {
    detective += `<br/><span style="color:var(--ink-mute);font-size:13px;">备注：TA 身上也有一点 ${weakHints.join("、")} 的影子。</span>`;
  }

  // 礼物卡片
  let giftsHtml = "";
  gifts.forEach((g, idx) => {
    giftsHtml += `
      <div class="gift-card">
        <div class="gift-emoji">${g.emoji}</div>
        <div class="gift-body">
          <div class="gift-top">
            <div class="gift-name">${idx+1}. ${g.name}</div>
            <div class="gift-price">¥${g.price}</div>
          </div>
          <div class="gift-reason">${g.reason}</div>
        </div>
      </div>
    `;
  });

  document.getElementById("resultRoot").innerHTML = `
    <div class="result-hero">
      <div class="case-no">CASE #${dateCode()} · 调查完毕</div>
      <div class="result-emoji">${persona.emoji}</div>
      <div class="result-code">${code}</div>
      <div class="result-name">${persona.name}</div>
      <div class="result-en">${persona.en.toUpperCase()}</div>
      <p class="result-tagline">${persona.tagline}</p>
    </div>

    <div class="radar-section">
      <div class="radar-title">TA 的礼物雷达</div>
      <div class="radar-wrap">${renderRadar(scores)}</div>
      <div class="dim-chips">${renderDimChips(scores, code)}</div>
    </div>

    <div class="detective-note">
      <div class="note-head">🔎 侦探备忘录</div>
      <div class="note-body">${detective}</div>
    </div>

    <div class="gifts-section">
      <div class="gifts-head">
        <div class="gifts-title">🎁 TA 的精选推荐</div>
        <div class="gifts-meta">¥${budget.label} · 严格区间 · ${gifts.length} 件</div>
      </div>
      ${gifts.length === 0 ? `
        <div class="gifts-empty">
          <div class="empty-emoji">🔍</div>
          <div class="empty-title">这个预算带里侦探暂时没找到合适的礼物</div>
          <div class="empty-sub">可以试试选择相邻的预算区间，或阅读「人格图鉴」中 ${persona.name} 的送礼思路。</div>
        </div>
      ` : giftsHtml}
      <button class="more-types-btn" id="moreTypesBtn">
        看看其他 15 型礼物人格 →
      </button>
    </div>
  `;
  // 绑定跳转
  setTimeout(() => {
    const mb = document.getElementById("moreTypesBtn");
    if (mb) mb.addEventListener("click", () => {
      renderGallery();
      goto("gallery");
    });
  }, 0);

  goto("result");
}

function dateCode() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900+100)}`;
}

// ---------- 分享：保存图片 ----------
async function saveAsImage() {
  const root = document.getElementById("resultRoot");
  const app = document.getElementById("app");
  app.classList.add("snapshot-mode");
  showToast("正在生成图片...");
  try {
    const canvas = await html2canvas(root, {
      backgroundColor: "#FBF6EE",
      scale: 2,
      useCORS: true,
      logging: false
    });
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `礼物侦探_${state.persona}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("已保存，去发给 TA 吧 ✨");
    });
  } catch (e) {
    showToast("生成失败，请重试");
    console.error(e);
  } finally {
    app.classList.remove("snapshot-mode");
  }
}

// ---------- 分享：微信 ----------
function shareToWechat() {
  const link = buildShareUrl();
  const p = PERSONAS[state.persona];
  const shareData = {
    title: `礼物侦探事务所 · ${p.name}`,
    text: `给「${p.name}」型的人选礼物 — 来这里查一份清单。`,
    url: link
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
    return;
  }
  // 否则弹出微信引导，同时复制链接到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).catch(() => {});
  }
  document.getElementById("wechatModal").hidden = false;
}

// ---------- 分享链接 ----------
function buildShareUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("from");
  url.hash = "";
  return url.toString();
}

function copyLink() {
  const link = buildShareUrl();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      showToast("链接已复制，去粘贴给 TA 吧");
    }).catch(() => fallbackCopy(link));
  } else {
    fallbackCopy(link);
  }
}
function fallbackCopy(link) {
  const t = document.createElement("textarea");
  t.value = link; document.body.appendChild(t); t.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(t);
  showToast("链接已复制");
}

// ---------- Toast ----------
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

// ---------- 重新开始 ----------
function restart() {
  state.relation = null;
  state.budget = null;
  state.answers = [];
  state.quizIdx = 0;
  state.open = { o1: "", o2: "", o3: "", o4: "" };
  state.persona = null;
  state.scores = null;
  document.querySelectorAll(".opt-card, .budget-card").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".open-field textarea").forEach(t => t.value = "");
  goto("cover");
}

// ---------- 16 型图鉴 ----------
const PERSONA_TONES = {
  EMLS:"p", EMLW:"o", EMRS:"y", EMRW:"g",
  EALS:"p", EALW:"o", EARS:"y", EARW:"g",
  IMLS:"p", IMLW:"o", IMRS:"y", IMRW:"g",
  IALS:"p", IALW:"o", IARS:"y", IARW:"g"
};

function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  if (grid.dataset.rendered === "1") return;
  grid.innerHTML = "";
  Object.keys(PERSONAS).forEach(code => {
    const p = PERSONAS[code];
    const card = document.createElement("button");
    card.className = "gallery-card";
    card.dataset.tone = PERSONA_TONES[code] || "p";
    card.innerHTML = `
      <div class="g-emoji">${p.emoji}</div>
      <div class="g-code">${code}</div>
      <div class="g-name">${p.name}</div>
      <div class="g-tag">${p.tagline}</div>
    `;
    card.addEventListener("click", () => openPersonaDrawer(code));
    grid.appendChild(card);
  });
  grid.dataset.rendered = "1";
}

function dimReadable(code) {
  return [
    { letter: code[0], pair: code[0] === "E" ? "外放 Extro" : "内敛 Intro" },
    { letter: code[1], pair: code[1] === "M" ? "极简 Minimal" : "美学 Aesthetic" },
    { letter: code[2], pair: code[2] === "L" ? "感性 Lovey" : "理性 Rational" },
    { letter: code[3], pair: code[3] === "S" ? "稳定 Steady" : "新鲜 Wild" }
  ];
}

function giftsForPersona(code, limit = 4) {
  const matched = GIFTS.filter(g => g.personas.includes(code));
  // 按价格适度排一下，优先中位段
  matched.sort((a, b) => Math.abs(a.price - 500) - Math.abs(b.price - 500));
  return matched.slice(0, limit);
}

function openPersonaDrawer(code) {
  const p = PERSONAS[code];
  if (!p) return;
  const dims = dimReadable(code);
  const gifts = giftsForPersona(code, 4);
  const giftsHtml = gifts.map(g => `
    <div class="dp-gift">
      <div class="dp-gift-emoji">${g.emoji}</div>
      <div class="dp-gift-name">${g.name}</div>
      <div class="dp-gift-price">¥${g.price}</div>
    </div>
  `).join("");

  document.getElementById("drawerBody").innerHTML = `
    <div class="dp-head">
      <div class="dp-emoji">${p.emoji}</div>
      <div class="dp-code">${code}</div>
      <div class="dp-name">${p.name}</div>
      <div class="dp-en">${p.en.toUpperCase()}</div>
      <p class="dp-tag">${p.tagline}</p>
    </div>
    <div class="dp-section">
      <div class="dp-label">🔍 人物画像</div>
      <div class="dp-text">${p.desc}</div>
    </div>
    <div class="dp-section">
      <div class="dp-label">🧭 四维度坐标</div>
      <div class="dp-dims">
        ${dims.map(d => `<div class="dp-dim"><b>${d.letter}</b> · ${d.pair}</div>`).join("")}
      </div>
    </div>
    <div class="dp-section">
      <div class="dp-label">🎁 送礼参考</div>
      <div class="dp-gifts">${giftsHtml || '<div class="dp-text">暴雨收集中…</div>'}</div>
    </div>
    <div class="dp-action">
      <button class="primary-btn" id="drawerStart">为「${p.name}」型的人测一次 →</button>
    </div>
  `;
  document.getElementById("personaDrawer").hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("drawerStart").addEventListener("click", () => {
    closeDrawer();
    restart();
    goto("relation");
  });
}

function closeDrawer() {
  document.getElementById("personaDrawer").hidden = true;
  document.body.style.overflow = "";
}

// ---------- 初始化 ----------
function init() {
  renderRelations();
  renderBudgets();
  goto("cover");

  document.getElementById("startBtn").addEventListener("click", () => goto("relation"));
  document.getElementById("restartBtn").addEventListener("click", restart);

  document.getElementById("quizBack").addEventListener("click", () => {
    if (state.quizIdx > 0) {
      state.quizIdx--;
      renderQuiz();
    }
  });

  // 开放题输入
  ["open1","open2","open3","open4"].forEach((id, i) => {
    document.getElementById(id).addEventListener("input", e => {
      state.open["o"+(i+1)] = e.target.value;
    });
  });

  document.getElementById("revealBtn").addEventListener("click", () => {
    // 校验
    if (state.answers.filter(a => a).length < 12) {
      showToast("还有问题没答完哦");
      goto("quiz");
      renderQuiz();
      return;
    }
    renderResult();
  });

  document.getElementById("saveImgBtn").addEventListener("click", saveAsImage);
  document.getElementById("wechatBtn").addEventListener("click", shareToWechat);
  document.getElementById("copyLinkBtn").addEventListener("click", copyLink);
  document.getElementById("retryBtn").addEventListener("click", restart);
  document.getElementById("closeWechatModal").addEventListener("click", () => {
    document.getElementById("wechatModal").hidden = true;
  });

  // 图鉴入口
  document.getElementById("gallery-entry").addEventListener("click", () => {
    renderGallery();
    goto("gallery");
  });
  document.getElementById("galleryStart").addEventListener("click", () => {
    restart();
    goto("relation");
  });
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("drawerMask").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !document.getElementById("personaDrawer").hidden) closeDrawer();
  });
}

document.addEventListener("DOMContentLoaded", init);
