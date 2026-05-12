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

// ---------- 开放题关键词词典 ----------
// 把用户可能输入的中文同义词、口语化表达映射到 GIFTS 里的 tag 关键词。
// 命中即视为「TA 在乎这个」，会优先推荐相关礼物。
// 词典以「输入关键词」为 key，值是 GIFTS tags 里出现的标签（用于打分 + 召回）。
const OPEN_KEYWORDS = [
  // 咖啡相关
  { match: ["咖啡","手冲","拿铁","美式","espresso","星巴克","瑞幸","挂耳","咖啡豆"], tags: ["咖啡","手冲"] },
  // 茶相关
  { match: ["茶","普洱","龙井","乌龙","茶叶","喝茶","茶具","紫砂"], tags: ["茶","紫砂","传统"] },
  // 数码 / 电脑 / 键盘 / 鼠标
  { match: ["键盘","机械键盘","客制化","轴体","打字"], tags: ["键盘","机械","数码","写代码"] },
  { match: ["耳机","降噪","airpods","无线耳机","头戴","听歌"], tags: ["耳机","音乐","降噪"] },
  { match: ["音箱","音响","喇叭","bgm"], tags: ["音乐","派对"] },
  { match: ["充电","快充","充电器","充电站","电池"], tags: ["充电","数码","效率"] },
  { match: ["数码","电子产品","科技","小家电","黑科技"], tags: ["数码","科技","小家电"] },
  // 游戏
  { match: ["游戏","打游戏","steam","主机","switch","ps5","xbox","网游","原神","王者"], tags: ["游戏","steam","宅"] },
  { match: ["二次元","动漫","手办","周边","acg","宅","漫画"], tags: ["手办","周边","二次元","宅"] },
  { match: ["盲盒","潮玩","泡泡玛特","labubu","molly"], tags: ["盲盒","潮玩","收藏"] },
  // 摄影 / 相机
  { match: ["摄影","拍照","相机","胶片","拍立得","vlog","记录"], tags: ["相机","摄影","复古","记录"] },
  // 阅读 / 书
  { match: ["书","读书","看书","小说","阅读","书店","kindle","杂志","诗集"], tags: ["书","阅读","书店","杂志","文艺"] },
  // 音乐
  { match: ["音乐","听歌","乐队","演唱会","livehouse","黑胶","唱片"], tags: ["音乐","黑胶","复古"] },
  // 香水 / 香氛 / 蜡烛
  { match: ["香水","香氛","留香","沙龙香"], tags: ["香水","香氛","气味"] },
  { match: ["香薰","蜡烛","扩香","精油"], tags: ["香薰","蜡烛","氛围","治愈"] },
  // 助眠 / 焦虑 / 加班
  { match: ["失眠","睡不着","睡眠","助眠","熬夜","晚睡","倒班"], tags: ["助眠","睡眠","眼罩"] },
  { match: ["加班","累","劳累","压力大","焦虑","emo","难受","emotion"], tags: ["助眠","治愈","焦虑","劳累","加班"] },
  { match: ["减肥","健身","瑜伽","跑步","运动"], tags: ["运动","户外"] },
  // 居家 / 收纳 / 极简
  { match: ["居家","在家","宅家","家里","摆件","装饰","布置"], tags: ["居家","摆件","氛围"] },
  { match: ["收纳","整理","桌面","工位","办公桌","整洁"], tags: ["收纳","桌面","极简","效率"] },
  { match: ["极简","简约","性冷淡","muji","无印"], tags: ["极简","基础款"] },
  // 穿搭 / 包 / 首饰
  { match: ["穿搭","穿衣","时尚","潮","潮牌"], tags: ["穿搭","潮流","设计"] },
  { match: ["包","包包","帆布包","托特","挎包","双肩包"], tags: ["包","穿搭"] },
  { match: ["首饰","项链","戒指","耳环","手链","银饰","金饰"], tags: ["首饰","项链","定制"] },
  { match: ["围巾","披肩","保暖","冬天","冷"], tags: ["围巾","保暖","冬天"] },
  // 文具 / 手账
  { match: ["文具","笔","钢笔","圆珠笔","签字","练字"], tags: ["书写","笔","签字"] },
  { match: ["手账","日记","本子","笔记本","打卡","手写"], tags: ["笔记本","书写","记录","交换日记","手写"] },
  // 植物 / 园艺
  { match: ["植物","花","鲜花","养花","多肉","绿植","盆栽","园艺"], tags: ["植物","园艺","鲜花"] },
  // 美食 / 做饭
  { match: ["做饭","下厨","烹饪","美食","吃货","零食","餐具"], tags: ["美食","做饭","陶瓷","餐具"] },
  // 体验 / 旅行
  { match: ["旅行","出去玩","度假","出游","探店","体验","陶艺","调香","课程","学一个","学一下"], tags: ["体验","旅行","新奇","课程","尝试"] },
  { match: ["露营","户外","徒步","爬山","野餐","骑行"], tags: ["户外","露营"] },
  // 神秘 / 塔罗 / 星座 / 天文
  { match: ["塔罗","星座","占卜","水晶","神秘","玄学"], tags: ["塔罗","神秘","占卜","小众"] },
  { match: ["天文","星空","望远镜","宇宙","星星"], tags: ["天文","星空","夜晚"] },
  // 传统 / 长辈
  { match: ["长辈","爸","妈","爷","奶","父母","传统","国风","汉服","中式"], tags: ["送长辈","传统","古典"] },
  // 派对 / 庆祝 / 酒
  { match: ["派对","聚会","庆祝","开party","开趴","生日"], tags: ["聚会","派对","庆祝"] },
  { match: ["酒","红酒","葡萄酒","威士忌","鸡尾酒","香槟","气泡酒","小酌"], tags: ["酒","庆祝","气泡水"] },
  // 桌游 / 解谜
  { match: ["桌游","剧本杀","狼人杀","密室","解谜"], tags: ["桌游","派对"] },
  // 治愈系 / 软软的
  { match: ["猫","撸猫","狗","撸狗","宠物","可爱","治愈","软软的","毛绒","抱枕"], tags: ["治愈","可爱","毛绒","软软的"] },
  // 看展 / 美术馆 / 艺术
  { match: ["看展","展览","美术馆","博物馆","画展","艺术","画","油画","插画"], tags: ["艺术","挂画","明信片","文艺"] },
  // 纪念日 / 仪式感
  { match: ["纪念日","周年","领证","结婚","恋爱","求婚"], tags: ["纪念日","定制","仪式感","刻字"] },
  // 工作 / 通勤 / 职场
  { match: ["上班","通勤","出差","职场","工作","升职","商务","白领"], tags: ["通勤","职场","商务"] }
];


// 把开放题原文匹配出 tag 集合 + 命中的关键词原文
function extractOpenSignals(openText) {
  const text = (openText || "").toLowerCase();
  const hitTags = new Set();
  const hitWords = new Set();
  if (!text.trim()) return { hitTags, hitWords };
  for (const rule of OPEN_KEYWORDS) {
    for (const w of rule.match) {
      if (text.includes(w.toLowerCase())) {
        hitWords.add(w);
        rule.tags.forEach(t => hitTags.add(t));
      }
    }
  }
  // 同时把礼物自带 tag 也直接命中（兼容旧词）
  GIFTS.forEach(g => g.tags.forEach(t => {
    if (text.includes(t.toLowerCase())) {
      hitTags.add(t);
      hitWords.add(t);
    }
  }));
  return { hitTags, hitWords };
}

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

  // 图鉴返回按钮：只在从结果页进入时显示
  const galleryBack = document.getElementById("galleryBack");
  if (galleryBack) {
    galleryBack.hidden = !(screen === "gallery" && state._galleryReturnTo === "result");
  }
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
        // 来自图鉴：已锁定人格，跳过 quiz/open 直接出结果
        if (state._presetPersona) {
          goto("result");
          renderResult();
          return;
        }
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

  // 下一题按钮：只有在已答过当前题、且不是最后一题时显示
  const nextBtn = document.getElementById("quizNext");
  const answered = !!state.answers[i];
  const hasMore = i < QUESTIONS.length - 1;
  if (answered && hasMore) {
    nextBtn.hidden = false;
    nextBtn.disabled = false;
  } else {
    nextBtn.hidden = true;
  }

  // 未答高亮：从 reveal 校验跳回时附加
  if (state._highlightUnanswered) {
    optsEl.classList.add("unanswered-highlight");
    state._highlightUnanswered = false;
  } else {
    optsEl.classList.remove("unanswered-highlight");
  }
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

// 从人格代码反推出满格得分（从图鉴锁定人格时使用）
function presetScoresFor(code) {
  const scores = { E:0, I:0, M:0, A:0, L:0, R:0, S:0, W:0 };
  scores[code[0]] = 3;
  scores[code[1]] = 3;
  scores[code[2]] = 3;
  scores[code[3]] = 3;
  return scores;
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
// 返回三组：
//   entityCards：识别出的专有名词（鬼灭/lululemon 等）生成的动态直达卡（最多 2 件）
//   personalized：根据开放题 tag 命中的礼物库礼物
//   personaPicks：按人格+关系补足
// 总共控制在 6 件
function recommendGifts() {
  const persona = state.persona;
  const budget = BUDGETS.find(b => b.id === state.budget);
  const relation = state.relation;
  const openText = Object.values(state.open).join(" ").toLowerCase();
  const TARGET_TOTAL = 6;
  const ENTITY_CAP = 2;
  const PRECISE_CAP = 4;     // 专有名词 + tag 命中 总计

  // 预算区间过滤：礼物采样区间 [priceMin, priceMax] 与预算带 [budget.min, budget.max] 有重叠即入选
  // （礼物价格本身是淘宝主流价区间不是单点，重叠判定比单点判定更贴近真实场景）
  const inBudget = g => g.priceMin <= budget.max && g.priceMax >= budget.min;
  const inBudgetGifts = GIFTS.filter(inBudget);

  // ====== Part 0：专有名词动态卡 ======
  const entities = (typeof extractEntities === "function")
    ? extractEntities(openText, ENTITY_CAP) : [];
  const entityCards = entities.map(e => makeEntityCard(e, "¥" + budget.label));

  // ====== Part A：开放题 tag 精准推荐 ======
  const { hitTags, hitWords } = extractOpenSignals(openText);

  const personalized = [];
  const usedNames = new Set();
  // 动态卡名也指入 usedNames，避免重复名字
  entityCards.forEach(ec => usedNames.add(ec.name));

  if (hitTags.size > 0) {
    // 为预算内的每件礼物计算开放题命中分
    const scored = inBudgetGifts.map(g => {
      let hits = 0;
      g.tags.forEach(t => { if (hitTags.has(t)) hits++; });
      // 额外：礼物名 / searchQuery 被开放题原文提起，极强信号
      const nameHit = openText && (
        openText.includes((g.name || "").toLowerCase()) ||
        (g.searchQuery && g.searchQuery.toLowerCase().split(/\s+/).some(w => w && openText.includes(w)))
      );
      let score = hits * 3;
      if (nameHit) score += 2;
      // 同人格+关系加一点点，用于同分时排序
      if (g.personas.includes(persona)) score += 0.6;
      if (g.relations.includes(relation)) score += 0.4;
      return { g, score, hits };
    }).filter(x => x.hits > 0)
      .sort((a, b) => b.score - a.score);

    // 精准位置 = PRECISE_CAP - 已经出现的动态卡数量
    const tagSlots = Math.max(0, PRECISE_CAP - entityCards.length);
    for (const x of scored) {
      if (personalized.length >= tagSlots) break;
      if (!usedNames.has(x.g.name)) {
        personalized.push(x.g);
        usedNames.add(x.g.name);
      }
    }
  }

  // ====== Part B：人格补足 ======
  // 1) 人格 + 关系（最强）
  const tier1 = inBudgetGifts.filter(g =>
    g.personas.includes(persona) && g.relations.includes(relation)
  );
  // 2) 同人格，关系不匹配
  const tier2 = inBudgetGifts.filter(g =>
    g.personas.includes(persona) && !g.relations.includes(relation)
  );
  // 3) 关系匹配，人格不匹配
  const tier3 = inBudgetGifts.filter(g =>
    !g.personas.includes(persona) && g.relations.includes(relation)
  );
  // 4) 其他范围内礼物
  const tier4 = inBudgetGifts.filter(g =>
    !g.personas.includes(persona) && !g.relations.includes(relation)
  );

  function scoreGift(g, tier) {
    let s = 0;
    if (tier === 1) s += 10;
    else if (tier === 2) s += 5;
    else if (tier === 3) s += 2;
    else s += 0.5;
    return s;
  }

  const personaPool = [
    ...tier1.map(g => ({ g, tier: 1, score: scoreGift(g, 1) })),
    ...tier2.map(g => ({ g, tier: 2, score: scoreGift(g, 2) })),
    ...tier3.map(g => ({ g, tier: 3, score: scoreGift(g, 3) })),
    ...tier4.map(g => ({ g, tier: 4, score: scoreGift(g, 4) }))
  ];
  personaPool.sort((a, b) => b.score - a.score);

  const personaPicks = [];
  for (const h of personaPool) {
    if (entityCards.length + personalized.length + personaPicks.length >= TARGET_TOTAL) break;
    if (!usedNames.has(h.g.name)) {
      personaPicks.push(h.g);
      usedNames.add(h.g.name);
    }
  }

  return { entityCards, personalized, personaPicks, hitWords: Array.from(hitWords) };
}

// 找到开放题里命中的关键词，结果页高亮用
function findHitKeywords() {
  const openText = Object.values(state.open).join(" ").toLowerCase();
  if (!openText.trim()) return [];
  const { hitWords } = extractOpenSignals(openText);
  return Array.from(hitWords).slice(0, 8);
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
  let code, scores;
  if (state._presetPersona) {
    // 来自图鉴：直接使用锁定的人格，不走问卷
    code = state._presetPersona;
    scores = presetScoresFor(code);
  } else {
    scores = computeScores();
    code = pickCode(scores);
  }
  state.scores = scores;
  state.persona = code;
  const persona = PERSONAS[code];
  const { entityCards, personalized, personaPicks } = recommendGifts();
  const totalCount = entityCards.length + personalized.length + personaPicks.length;
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

  // 礼物卡片生成器
  function buildGiftCard(g, idx, kind) {
    // 动态卡（entity）走自己的 tb/jd 搜索词；普通卡用 searchQuery 或 name
    const tbQ = encodeURIComponent(g.tbQuery || g.searchQuery || g.name);
    const jdQ = encodeURIComponent(g.jdQuery || g.searchQuery || g.name);
    const tbUrl = `https://s.taobao.com/search?q=${tbQ}`;
    const jdUrl = `https://search.jd.com/Search?keyword=${jdQ}&enc=utf-8`;
    // 线下渠道礼物：用大众点评 + 小红书搜索
    const offlineQ = encodeURIComponent(g.searchQuery || g.name);
    const dpUrl = `https://www.dianping.com/search/keyword/0/0_${offlineQ}`;
    const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${offlineQ}`;
    const isOffline = g.channel === 'offline';
    let badge;
    if (kind === "entity") {
      const tagLabel = g.canonical || g.name;
      badge = `<span class="gift-badge gift-badge-entity">📍 TA 提起的 · ${tagLabel}</span>`;
    } else if (kind === "personalized") {
      badge = `<span class="gift-badge gift-badge-precise">📌 根据你的描述</span>`;
    } else {
      badge = `<span class="gift-badge gift-badge-persona">🎯 人格推荐</span>`;
    }
    const cardClass = kind === "entity" ? "gift-card-entity"
      : (kind === "personalized" ? "gift-card-precise" : "");
    // 价格：动态卡走预算带字符串；普通卡走礼物采样区间 priceLabel
    const priceHtml = g.isDynamic
      ? `<div class="gift-price gift-price-range">${g.price}</div>`
      : `<div class="gift-price gift-price-label">${g.priceLabel}<span class="gift-price-note">参考</span></div>`;
    return `
      <div class="gift-card ${cardClass}">
        <div class="gift-emoji">${g.emoji}</div>
        <div class="gift-body">
          <div class="gift-top">
            <div class="gift-name">${idx+1}. ${g.name}</div>
            ${priceHtml}
          </div>
          <div class="gift-badge-row">${badge}</div>
          <div class="gift-reason">${g.reason}</div>
          <div class="gift-shop-row">
            ${isOffline ? `
            <a class="shop-btn dp" href="${dpUrl}" target="_blank" rel="noopener noreferrer">
              <span class="shop-mark dp-mark">点</span> 大众点评
            </a>
            <a class="shop-btn xhs" href="${xhsUrl}" target="_blank" rel="noopener noreferrer">
              <span class="shop-mark xhs-mark">书</span> 小红书
            </a>
            ` : `
            <a class="shop-btn tb" href="${tbUrl}" target="_blank" rel="noopener noreferrer">
              <span class="shop-mark">淘</span> 淘宝搜
            </a>
            <a class="shop-btn jd" href="${jdUrl}" target="_blank" rel="noopener noreferrer">
              <span class="shop-mark jd-mark">JD</span> 京东搜
            </a>
            `}
          </div>
          ${isOffline && g.channelHint ? `<div class="gift-channel-hint">🏪 ${g.channelHint}</div>` : ''}
        </div>
      </div>
    `;
  }

  let entityHtml = "";
  entityCards.forEach((g, i) => {
    entityHtml += buildGiftCard(g, i, "entity");
  });
  let personalizedHtml = "";
  personalized.forEach((g, i) => {
    personalizedHtml += buildGiftCard(g, entityCards.length + i, "personalized");
  });
  let personaHtml = "";
  personaPicks.forEach((g, i) => {
    personaHtml += buildGiftCard(g, entityCards.length + personalized.length + i, "persona");
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
        <div class="gifts-meta">¥${budget.label} · 严格区间 · ${totalCount} 件</div>
      </div>
      ${totalCount === 0 ? `
        <div class="gifts-empty">
          <div class="empty-emoji">🔍</div>
          <div class="empty-title">这个预算带里侦探暂时没找到合适的礼物</div>
          <div class="empty-sub">可以试试选择相邻的预算区间，或阅读「人格图鉴」中 ${persona.name} 的送礼思路。</div>
        </div>
      ` : `
        ${entityCards.length > 0 ? `
          <div class="gifts-subhead gifts-subhead-entity">
            <span class="sub-icon">📍</span>
            <span class="sub-text"><b>TA 提起的具体内容</b> · 直达搜索</span>
          </div>
          ${entityHtml}
        ` : ""}
        ${personalized.length > 0 ? `
          <div class="gifts-subhead gifts-subhead-precise">
            <span class="sub-icon">📌</span>
            <span class="sub-text"><b>${entityCards.length > 0 ? "按兴趣补充" : "根据你的描述精选"}</b> · 命中 TA 提起的兴趣</span>
          </div>
          ${personalizedHtml}
        ` : ""}
        ${personaPicks.length > 0 ? `
          <div class="gifts-subhead gifts-subhead-persona">
            <span class="sub-icon">🎯</span>
            <span class="sub-text"><b>${(entityCards.length + personalized.length) > 0 ? "按人格补充" : "按人格匹配"}</b> · 「${persona.name}」会喜欢的</span>
          </div>
          ${personaHtml}
        ` : ""}
      `}
      <button class="more-types-btn" id="moreTypesBtn">
        看看其他 15 型礼物人格 →
      </button>
    </div>
  `;
  // 绑定跳转
  setTimeout(() => {
    const mb = document.getElementById("moreTypesBtn");
    if (mb) mb.addEventListener("click", () => {
      state._galleryReturnTo = "result";
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
function isMobileUA() {
  return /Mobi|Android|iPhone|iPad|iPod|HarmonyOS/i.test(navigator.userAgent);
}
function isWechatUA() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

async function saveAsImage() {
  const root = document.getElementById("resultRoot");
  const app = document.getElementById("app");
  if (typeof html2canvas !== "function") {
    showToast("图片组件未加载，请检查网络");
    return;
  }
  app.classList.add("snapshot-mode");
  showToast("正在生成图片...");
  try {
    const canvas = await html2canvas(root, {
      backgroundColor: "#FBF6EE",
      scale: 2,
      useCORS: true,
      logging: false
    });
    const dataUrl = canvas.toDataURL("image/png");
    showImageModal(dataUrl);
  } catch (e) {
    showToast("生成失败，请重试");
    console.error(e);
  } finally {
    app.classList.remove("snapshot-mode");
  }
}

function showImageModal(dataUrl) {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("imageModalImg");
  const dl = document.getElementById("imageModalDownload");
  const hint = document.getElementById("imageModalHint");
  img.src = dataUrl;
  // 文件名用 ASCII 安全名，避免某些浏览器 download 属性必到中文被忽略
  const safeName = `gift-detective-${state.persona || "report"}-${Date.now()}.png`;
  dl.href = dataUrl;
  dl.download = safeName;
  // 提示文案适配环境
  if (isWechatUA()) {
    hint.textContent = "长按图片 · 选择「保存到相册」或「分享」";
    dl.hidden = true;
  } else if (isMobileUA()) {
    hint.textContent = "长按图片 · 选择「保存」到相册";
    dl.hidden = false;
  } else {
    hint.textContent = "右键「另存为」，或点下方按钮直接下载";
    dl.hidden = false;
  }
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeImageModal() {
  document.getElementById("imageModal").hidden = true;
  document.body.style.overflow = "";
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
  state._presetPersona = null;
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
      <div class="dp-gift-price">${g.priceLabel || ('¥' + (g.priceTypical || ''))}</div>
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
    // 锁定该人格，跳过 quiz 与 open，只走 关系 → 预算 → 结果
    state._presetPersona = code;
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

  document.getElementById("quizNext").addEventListener("click", () => {
    if (state.quizIdx < QUESTIONS.length - 1) {
      state.quizIdx++;
      renderQuiz();
    } else {
      goto("open");
    }
  });

  // 开放题输入
  ["open1","open2","open3","open4"].forEach((id, i) => {
    document.getElementById(id).addEventListener("input", e => {
      state.open["o"+(i+1)] = e.target.value;
    });
  });

  document.getElementById("revealBtn").addEventListener("click", () => {
    // 校验：找到第一题未答的题号
    const firstUnanswered = state.answers.findIndex((a, i) => i < QUESTIONS.length && !a);
    const missingCount = state.answers.slice(0, QUESTIONS.length).filter(a => !a).length
      + (QUESTIONS.length - state.answers.length > 0 ? QUESTIONS.length - state.answers.length : 0);
    if (firstUnanswered !== -1 || state.answers.length < QUESTIONS.length) {
      const idx = firstUnanswered !== -1 ? firstUnanswered : state.answers.length;
      const remain = QUESTIONS.length - state.answers.filter(Boolean).length;
      showToast(`还差 ${remain} 题未答 · 跳到第 ${idx + 1} 题`);
      state.quizIdx = idx;
      state._highlightUnanswered = true;
      goto("quiz");
      renderQuiz();
      return;
    }
    renderResult();
  });

  document.getElementById("saveImgBtn").addEventListener("click", saveAsImage);
  document.getElementById("closeImageModal").addEventListener("click", closeImageModal);
  // 点击遮罩关闭
  document.getElementById("imageModal").addEventListener("click", e => {
    if (e.target.id === "imageModal") closeImageModal();
  });
  document.getElementById("wechatBtn").addEventListener("click", shareToWechat);
  document.getElementById("copyLinkBtn").addEventListener("click", copyLink);
  document.getElementById("retryBtn").addEventListener("click", restart);
  document.getElementById("closeWechatModal").addEventListener("click", () => {
    document.getElementById("wechatModal").hidden = true;
  });

  // 图鉴入口
  document.getElementById("gallery-entry").addEventListener("click", () => {
    // 记住来源屏：在结果页点进可返回结果，其他场景返回首页
    const cur = document.querySelector(".screen.active")?.dataset.screen;
    state._galleryReturnTo = (cur === "result") ? "result" : "cover";
    renderGallery();
    goto("gallery");
  });

  document.getElementById("galleryBack").addEventListener("click", () => {
    if (state._galleryReturnTo === "result") {
      goto("result");
    } else {
      goto("cover");
    }
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
