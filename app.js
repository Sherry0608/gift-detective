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
  { match: ["上班","通勤","出差","职场","工作","升职","商务","白领","老板","同事","开会","汇报","项目","deadline"], tags: ["通勤","职场","商务","办公","效率"] },

  // ====== 下面是补充的高频信号 ======
  // 追剧 / 看综艺 / 影视
  { match: ["追剧","看剧","剧荒","netflix","奈飞","综艺","乐队的夏天","纪录片","剧集","短剧","老剧","番剧","动漫","二次元"], tags: ["文艺","治愈","居家","氛围"] },
  // 健身 / 运动 / 减肥 加强
  { match: ["健身房","撸铁","举铁","跑步","跑马拉松","足球","羽毛球","打球","网球","骑行","骑车","游泳","跳操","普拉提","卡路里","减脂","塑形"], tags: ["运动","户外","健康"] },
  // 加班 / 累 / 内卷 加强
  { match: ["考研","考公","考学","复习","考试","写代码","写论文","赶报告","加班到凌晨","通宵","赶项目","deadline"], tags: ["加班","劳累","职场","效率","助眠"] },
  // 海外 / 旅居
  { match: ["出国","海外","留学","东京","伦敦","纽约","游学","海外党","在国外","日本","欧洲"], tags: ["旅行","礼盒","仪式感"] },
  // 摸鱼 / 工作状态
  { match: ["摸鱼","点外卖","打卡","脱发","黑眼圈","什么都不想干","上班如上坟","工位","工位摆件"], tags: ["效率","办公","桌面","治愈"] },
  // 宅在家 / 宅文化
  { match: ["宅宅","宅家","宅在家","足不出户","不出门","周末不出门","被窝","沙发土豆"], tags: ["居家","治愈","桌面","氛围"] },
  // Z 世代黑话
  { match: ["上头","上头了","入坑","爷青回","姐妹","yyds","家人们","绝绝子","集美","宝贝","种草","安利","emo","破防"], tags: ["治愈","可爱","潮流","小众"] },
  // 婴儿 / 送同事朋友生孩子
  { match: ["宝宝","婴儿","新生儿","产后","满月","百天","孩子出生","临产","生孩子","升级当爸","升级当妈"], tags: ["婴儿","礼盒","治愈"] },
  // 书法 / 手工
  { match: ["书法","练字","拓印","手工艺","手作","陶艺","陶瓷","独立手作","调香","羊毛毡","刺绣"], tags: ["DIY","传统","仪式","文艺","手工"] },
  // 打卡 / 探店 / 生活方式博主感
  { match: ["探店","网红店","下午茶","咖啡馆","city walk","citywalk","逛马路","逛街","小红书"], tags: ["体验","文艺","氛围","打卡"] },
  // 学习 / 兴趣班
  { match: ["学吉他","学钢琴","瑜伽","吉他","民谣","插花","调酒课","兴趣班","课程","绘画课","陶艺课"], tags: ["体验","仪式","课程","文艺"] },
  // 深夜 / 一个人
  { match: ["一个人住","一个人看电影","深夜","独居","夜猫子","凌晨三点","安静的夜晚","失眠"], tags: ["助眠","治愈","氛围","居家"] },
  // 颈椎 / 肩颈 / 久坐
  { match: ["眼袋","颈椎","肩颈","肩膀酸","腰酸","腰疼","肌肉酸痛","职业病","坐久了","久坐","按摩"], tags: ["按摩","颈椎","健康","劳累"] },
  // 节日 / 节气
  { match: ["中秋","春节","过年","元宵","端午","七夕","农历","节气","二十四节气"], tags: ["节日","传统","礼盒","仪式感"] },
  // 乔迁 / 装修
  { match: ["改造","装修","入住","乔迁","新家","新居","公寓","搬家"], tags: ["乔迁","居家","摆件","装饰"] },
  // 商务 / 送长辈
  { match: ["业务","拜访","拜年","走动","上门","领导","客户","重要场合","长辈","父母"], tags: ["商务","送长辈","传统","高端","礼盒"] },
  // 吃货 / 美食
  { match: ["甜品","吃货","吃点好的","马卡龙","蛋糕","烘焙","做饭","做菜","美食","下厨"], tags: ["烘焙","餐具","陶瓷","礼盒"] },
  // 生病 / 养生
  { match: ["生病","出院","住院","体检","发烧","头疼","不舒服","养生","中医","养生壶"], tags: ["健康","养生","送长辈"] },
  // 愿望 / 仪式
  { match: ["愿望清单","心愿","人生清单","梦想","状态很好","状态越来越好","新年新气象"], tags: ["仪式感","定制","纪念日"] },
  // 数码控 / 极客
  { match: ["数码","极客","科技","电子产品","耳机","键盘","机械键盘","显示器","游戏机","switch","ps5"], tags: ["数码","桌面","办公"] },
  // 摄影 / vlog
  { match: ["摄影","拍照","拍视频","vlog","相机","胶片","拍立得","剪辑"], tags: ["数码","小众","文艺"] },
  // 香氛 / 氛围
  { match: ["香薰","香水","香氛","蜡烛","精油","香气","气味"], tags: ["香氛","氛围","居家","治愈"] },
  // 阅读 / 文艺
  { match: ["看书","读书","小说","散文","诗集","村上春树","卡夫卡","播客","podcast"], tags: ["文艺","小众","治愈","居家"] },
  // 收藏 / 手办
  { match: ["手办","潮玩","盲盒","泡泡玛特","乐高","模型","高达","周边"], tags: ["收藏","小众","潮流"] }
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

  // 封面：刷新档案列表
  if (screen === "cover" && typeof renderHistoryOnCover === "function") {
    renderHistoryOnCover();
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
// 纯函数随机数生成器（用 seed 让摇一摇可重复）
function seededShuffle(arr, seed) {
  if (!seed) return arr.slice();
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function recommendGifts(shuffleSeed) {
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

  // 反查：每条 OPEN_KEYWORDS 命中后，找出原文里实际出现的词
  function findEchoWordsForTags(targetTags) {
    const echoes = [];
    for (const rule of OPEN_KEYWORDS) {
      const ruleHitsTag = rule.tags.some(t => targetTags.includes(t));
      if (!ruleHitsTag) continue;
      for (const w of rule.match) {
        if (openText.includes(w.toLowerCase()) && !echoes.includes(w)) {
          echoes.push(w);
        }
      }
    }
    return echoes;
  }

  if (hitTags.size > 0) {
    // 为预算内的每件礼物计算开放题命中分
    const scored = inBudgetGifts.map(g => {
      let hits = 0;
      const matchedTags = [];
      g.tags.forEach(t => { if (hitTags.has(t)) { hits++; matchedTags.push(t); } });
      // 额外：礼物名 / searchQuery 被开放题原文提起，极强信号
      const nameHit = openText && (
        openText.includes((g.name || "").toLowerCase()) ||
        (g.searchQuery && g.searchQuery.toLowerCase().split(/\s+/).some(w => w && openText.includes(w)))
      );
      let score = hits * 5;
      if (nameHit) score += 4;
      // 同人格+关系加一点点，用于同分时排序
      if (g.personas.includes(persona)) score += 0.6;
      if (g.relations.includes(relation)) score += 0.4;
      return { g, score, hits, matchedTags };
    }).filter(x => x.hits > 0)
      .sort((a, b) => b.score - a.score);

    // shuffle 模式下：同分互换顺序
    if (shuffleSeed) {
      const sgroups = {};
      scored.forEach(x => {
        const k = x.score.toFixed(2);
        if (!sgroups[k]) sgroups[k] = [];
        sgroups[k].push(x);
      });
      const sk = Object.keys(sgroups).sort((a, b) => parseFloat(b) - parseFloat(a));
      const reshuffled = [];
      sk.forEach((k, ki) => {
        reshuffled.push(...seededShuffle(sgroups[k], shuffleSeed + 100 + ki * 3));
      });
      scored.length = 0;
      scored.push(...reshuffled);
    }

    // 精准位置 = PRECISE_CAP - 已经出现的动态卡数量
    const tagSlots = Math.max(0, PRECISE_CAP - entityCards.length);
    for (const x of scored) {
      if (personalized.length >= tagSlots) break;
      if (!usedNames.has(x.g.name)) {
        // 浅拷贝礼物对象，附加 _echo 字段（命中的原文词，最多 2 个）
        const echoes = findEchoWordsForTags(x.matchedTags).slice(0, 2);
        const giftWithEcho = Object.assign({}, x.g, { _echo: echoes });
        personalized.push(giftWithEcho);
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

  // 同档位内随机打乱（摇一摇时），同档位之间还是按优先级处理
  const t1 = seededShuffle(tier1, shuffleSeed);
  const t2 = seededShuffle(tier2, shuffleSeed ? shuffleSeed + 1 : 0);
  const t3 = seededShuffle(tier3, shuffleSeed ? shuffleSeed + 2 : 0);
  const t4 = seededShuffle(tier4, shuffleSeed ? shuffleSeed + 3 : 0);
  const personaPool = [
    ...t1.map(g => ({ g, tier: 1, score: scoreGift(g, 1) })),
    ...t2.map(g => ({ g, tier: 2, score: scoreGift(g, 2) })),
    ...t3.map(g => ({ g, tier: 3, score: scoreGift(g, 3) })),
    ...t4.map(g => ({ g, tier: 4, score: scoreGift(g, 4) }))
  ];
  // 不再可一次性按 score 排序——同 tier 的顺序保留 shuffle 后的隆位
  // 但高 tier 依然在前
  personaPool.sort((a, b) => b.score - a.score);

  // 如果在 shuffle 模式下，对同分的礼物随机互换顺序
  if (shuffleSeed) {
    // 按 score 分组，组内 shuffle
    const groups = {};
    personaPool.forEach(h => {
      const k = h.score.toFixed(2);
      if (!groups[k]) groups[k] = [];
      groups[k].push(h);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => parseFloat(b) - parseFloat(a));
    const newPool = [];
    sortedKeys.forEach((k, ki) => {
      const shuffled = seededShuffle(groups[k], shuffleSeed + ki * 7);
      newPool.push(...shuffled);
    });
    personaPool.length = 0;
    personaPool.push(...newPool);
  }

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
function renderResult(opts) {
  opts = opts || {};
  let code, scores;
  if (opts.keepPersona && state.persona) {
    // 摇一摇时不重新计算人格
    code = state.persona;
    scores = state.scores;
  } else if (state._presetPersona) {
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
  const { entityCards, personalized, personaPicks, hitWords } = recommendGifts(opts.shuffleSeed);
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
    // 动态卡（entity）走自己的 tb 搜索词；普通卡用 searchQuery 或 name
    const tbQ = encodeURIComponent(g.tbQuery || g.searchQuery || g.name);
    const tbUrl = `https://s.taobao.com/search?q=${tbQ}`;
    // 小红书搜索（适合看真实用后感、送礼示范、拍照参考）
    const xhsQ = encodeURIComponent(g.searchQuery || g.name);
    const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${xhsQ}`;
    // 线下渠道礼物：用大众点评 + 小红书搜索
    const offlineQ = encodeURIComponent(g.searchQuery || g.name);
    const dpUrl = `https://www.dianping.com/search/keyword/0/0_${offlineQ}`;
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
          ${kind === "personalized" && g._echo && g._echo.length ? `<div class="gift-echo">💬 你说 TA <b>${g._echo.join("、")}</b> →</div>` : ""}
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
            <a class="shop-btn xhs" href="${xhsUrl}" target="_blank" rel="noopener noreferrer">
              <span class="shop-mark xhs-mark">书</span> 小红书搜
            </a>
            `}
          </div>
          ${isOffline && g.channelHint ? `<div class="gift-channel-hint">🏪 ${g.channelHint}</div>` : ''}
          ${kind !== "entity" ? `
          <div class="gift-letter-wrap" data-gift-idx="${idx}">
            <button class="gift-letter-btn" data-gift-name="${escapeHtml(g.name)}" data-gift-reason="${escapeHtml(g.reason)}" data-gift-echoes='${JSON.stringify(g._echo || [])}'>✉️ 生成送礼留言</button>
            <div class="gift-letter-output" hidden></div>
          </div>
          ` : ""}
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

  const resultRoot = document.getElementById("resultRoot");
  resultRoot.innerHTML = `
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

    ${hitWords && hitWords.length > 0 ? `
      <div class="hit-clues">
        <div class="hit-clues-head">
          <span class="hit-clues-icon">🔥</span>
          <span class="hit-clues-title">从 TA 的描述里抓到的线索</span>
          <span class="hit-clues-count">${hitWords.length} 个关键词</span>
        </div>
        <div class="hit-clues-chips">
          ${hitWords.map(w => `<span class="hit-chip">${w}</span>`).join("")}
        </div>
        <div class="hit-clues-foot">下面「根据你的描述」那块的推荐，都是顺着这些线索选的</div>
      </div>
    ` : ""}

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

    <div class="save-case-bar">
      <button class="save-case-btn" id="saveCaseBtn">📂 把这份报告存进档案</button>
      ${state._historyLabel ? `<span class="save-case-tag">当前档案：${escapeHtml(state._historyLabel)}</span>` : ""}
    </div>
  `;
  // 绑定交互（同步绑定，避免 setTimeout 被 iframe 环境调度抢先）
  const mb = resultRoot.querySelector("#moreTypesBtn");
  if (mb) mb.addEventListener("click", () => {
    state._galleryReturnTo = "result";
    renderGallery();
    goto("gallery");
  });
  const sb = resultRoot.querySelector("#saveCaseBtn");
  if (sb) sb.addEventListener("click", promptSaveCase);
  resultRoot.querySelectorAll(".gift-letter-btn").forEach(btn => {
    btn.addEventListener("click", () => handleGenerateLetter(btn));
  });

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
  state._historyLabel = null;
  state._shuffleCount = 0;
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
      <button class="primary-btn" id="drawerStart">该给「${p.name}」型送什么 →</button>
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
  document.getElementById("retryBtn").addEventListener("click", restart);
  document.getElementById("reshuffleBtn").addEventListener("click", () => {
    state._shuffleCount = (state._shuffleCount || 0) + 1;
    const seed = Date.now() % 100000 + state._shuffleCount * 1000;
    renderResult({ keepPersona: true, shuffleSeed: seed });
    // 滚动到礼物区
    setTimeout(() => {
      const el = document.querySelector(".gifts-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    showToast("🎲 换了一批礼物");
  });
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

// ============================================================
// 本地历史档案  存 localStorage
// ============================================================
const HISTORY_KEY = "gd_history_v1";
const HISTORY_MAX = 20;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch (e) {}
}

function addHistoryEntry(label) {
  if (!state.persona) return null;
  const list = loadHistory();
  // 取当前推荐的前 3 件作为预览
  const rec = recommendGifts();
  const top3 = [...rec.entityCards, ...rec.personalized, ...rec.personaPicks]
    .slice(0, 3)
    .map(g => ({ name: g.name, emoji: g.emoji || "🎁" }));
  const persona = PERSONAS[state.persona];
  const entry = {
    id: "c" + Date.now().toString(36) + Math.floor(Math.random() * 99),
    ts: Date.now(),
    label: (label || "").trim() || `未命名档案`,
    code: state.persona,
    personaName: persona ? persona.name : "",
    personaEmoji: persona ? persona.emoji : "🎁",
    relation: state.relation,
    budget: state.budget,
    open: { ...state.open },
    top3
  };
  // 去重：同 label + persona + 同一天只保留最新一条
  const dayMs = 24 * 60 * 60 * 1000;
  const filtered = list.filter(e =>
    !(e.label === entry.label && e.code === entry.code && Math.abs(e.ts - entry.ts) < dayMs)
  );
  filtered.unshift(entry);
  saveHistory(filtered);
  return entry;
}

function removeHistoryEntry(id) {
  const list = loadHistory().filter(e => e.id !== id);
  saveHistory(list);
}

function openHistoryEntry(id) {
  const entry = loadHistory().find(e => e.id === id);
  if (!entry) return;
  // 重建 state 以还原结果
  state.relation = entry.relation;
  state.budget = entry.budget;
  state.open = entry.open || { o1: "", o2: "", o3: "", o4: "" };
  state.persona = entry.code;
  state.scores = presetScoresFor(entry.code);
  state._presetPersona = entry.code;  // 跳过 quiz
  state._historyLabel = entry.label;
  renderResult();
}

// 在封面顶部渲染档案抽屉
function renderHistoryOnCover() {
  const wrap = document.getElementById("historyWrap");
  if (!wrap) return;
  const list = loadHistory();
  if (list.length === 0) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  const items = list.slice(0, 4).map(e => {
    const top3Str = e.top3.map(g => g.emoji).join(" ");
    const dateStr = formatRelTime(e.ts);
    return `
      <button class="hist-card" data-id="${e.id}">
        <div class="hist-emoji">${e.personaEmoji}</div>
        <div class="hist-body">
          <div class="hist-label">${escapeHtml(e.label)}</div>
          <div class="hist-meta">${e.personaName} · ${dateStr}</div>
          <div class="hist-top3">${top3Str}</div>
        </div>
        <span class="hist-del" data-del="${e.id}" aria-label="删除">×</span>
      </button>
    `;
  }).join("");
  wrap.innerHTML = `
    <div class="hist-head">
      <span class="hist-head-title">📂 你的送礼档案</span>
      <span class="hist-head-count">${list.length} 条</span>
    </div>
    <div class="hist-list">${items}</div>
  `;
  // 点击打开 / 删除
  wrap.querySelectorAll(".hist-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("hist-del")) {
        const did = e.target.getAttribute("data-del");
        removeHistoryEntry(did);
        renderHistoryOnCover();
        e.stopPropagation();
        return;
      }
      const id = card.getAttribute("data-id");
      openHistoryEntry(id);
    });
  });
}

function formatRelTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  const date = new Date(ts);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>\"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

// ============================================================
// 生成送礼留言（优先后端 LLM，失败或无后端限降级到本地模板池）
// ============================================================
async function handleGenerateLetter(btn) {
  const wrap = btn.closest(".gift-letter-wrap");
  const out = wrap.querySelector(".gift-letter-output");
  const giftName = btn.getAttribute("data-gift-name");
  const reason = btn.getAttribute("data-gift-reason");
  let echoes = [];
  try { echoes = JSON.parse(btn.getAttribute("data-gift-echoes") || "[]"); } catch (e) {}

  btn.disabled = true;
  btn.textContent = "✉️ 推敲中...";
  out.hidden = false;
  out.innerHTML = `<div class="letter-loading">✨ 侦探正在为这份礼物推敲措辞...</div>`;

  const persona = PERSONAS[state.persona];
  const rel = RELATIONS.find(r => r.id === state.relation);
  const openText = Object.values(state.open).join(" ");

  const payload = {
    gift_name: giftName,
    persona_name: persona ? persona.name : "",
    relation: rel ? rel.label : "",
    open_text: openText,
    echo_words: echoes,
    reason: reason
  };

  // 尝试后端（存在时）
  let result = null;
  try {
    const resp = await fetch("/api/letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // 12s 超时
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.ok && (data.warm || data.witty)) {
        result = { warm: data.warm, witty: data.witty, source: "ai" };
      }
    }
  } catch (e) {
    // 静默失败，走本地模板
  }

  // 降级到本地模板
  if (!result) {
    result = generateLetterFromTemplates(giftName, persona, rel, echoes);
  }

  renderLetter(out, result);
  btn.disabled = false;
  btn.textContent = "🔄 再写一版";
}

function renderLetter(container, r) {
  const note = r.source === "ai" ? "AI 为你生成" : "从侦探素材库组合";
  container.innerHTML = `
    <div class="letter-card">
      <div class="letter-meta">✨ ${note}</div>
      ${r.warm ? `<div class="letter-block"><span class="letter-tag warm">温暖款</span><p>${escapeHtml(r.warm)}</p></div>` : ""}
      ${r.witty ? `<div class="letter-block"><span class="letter-tag witty">俏皮款</span><p>${escapeHtml(r.witty)}</p></div>` : ""}
      <div class="letter-actions">
        <button class="letter-copy-btn" data-text="${escapeHtml((r.warm || "") + (r.witty ? "\n\n" + r.witty : ""))}">📋 复制全部</button>
      </div>
    </div>
  `;
  const cb = container.querySelector(".letter-copy-btn");
  if (cb) {
    cb.addEventListener("click", () => {
      const txt = cb.getAttribute("data-text") || "";
      // 解码 HTML entities 回原文
      const tmp = document.createElement("textarea");
      tmp.innerHTML = txt;
      const plain = tmp.value;
      navigator.clipboard && navigator.clipboard.writeText(plain).then(
        () => showToast("已复制，去给 TA 发吧 💌"),
        () => showToast("复制失败，请手动选取")
      );
    });
  }
}

// ============================================================
// 本地模板池：纯静态环境下的降级方案
// 设计目标：按「关系 × 情境(echo) × 语气」多维组合,自然有人味
// ============================================================
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 关系语气库:不同关系下,温暖款和俏皮款各 6-7 条
const LETTER_BY_RELATION = {
  lover: {
    warm: [
      g => `没什么特别的日子,只是看到这件${g},脑子里第一个跳出来的是你。`,
      g => `给你买了件${g}。该说的话都不太会说,就让它替我说吧。`,
      g => `最近老想给你做点什么,想来想去,先从这件${g}开始。`,
      g => `送你一件${g}。不为什么,就是想让你知道,你被我认真看着。`,
      g => `你最近不太对劲,我都看在眼里。这件${g},希望能让你松一点。`,
      g => `这件${g}给你。说不出口的那些,先放一放。`,
      g => `挑了好久挑了这件${g}。我没什么大本事,就在这种小事上多上点心。`,
    ],
    witty: [
      g => `为了选这件${g},我研究了你,也研究了我钱包。两边都不容易。`,
      g => `别说我不浪漫。这件${g}是我点开三个购物车挑出来的,凭良心说挺努力的。`,
      g => `事先声明,这件${g}不附赠“随叫随到”服务。但你可以试试。`,
      g => `这件${g}你要是不喜欢——也退不了了,认了吧。`,
      g => `这件${g}给你。我这个月的浪漫额度也到此为止了,下个月再续。`,
      g => `这件${g}是你的。请不要看吊牌,更不要算单价。`,
      g => `挑这件${g}的时候我想了你一整天。你回我一句“谢谢”就行,别的不用问。`,
    ],
  },
  friend: {
    warm: [
      g => `看到这件${g}的时候,第一个想到你。`,
      g => `不是什么大礼。就是看到这件${g},觉得是为你留的。`,
      g => `认识这么多年,送礼我还会紧张。这件${g}你看看,不喜欢直接说。`,
      g => `这件${g}给你。你那些没说出口的,我大概是听进去了的。`,
      g => `送你这件${g}。没什么场合,就是想到了你。`,
      g => `够熟才能送这件${g}——换别人我还得纠结半天。`,
      g => `成年以后被人记着是挺难的事。这件${g}给你,别客气。`,
      g => `这件${g}你拿着。我也不知道合不合适,就当我尽力了。`,
    ],
    witty: [
      g => `这件${g}给你。不准转送,不准退货,不准吐槽颜色。`,
      g => `送你这件${g},是上次你随口一句话被我记住了。下次说话注意点。`,
      g => `这件${g}是我自作主张挑的。你要是不喜欢,我们各退一步——你装喜欢。`,
      g => `送贵的我心疼,送便宜的你嫌弃。最后选了这件${g},别问价钱。`,
      g => `这件${g}给你,反正说了你也不听,逼你现场拆。`,
      g => `分工明确:我负责挑这件${g}和付钱,你负责夸我眼光好。`,
      g => `别谢,但记账。下顿饭你请。`,
      g => `本来想写张卡片,写到一半发现这件${g}已经替我说完了。`,
    ],
  },
  family: {
    warm: [
      g => `这件${g}给你。不为什么特殊的日子,就是想让你用上。`,
      g => `看到这件${g}就想到你,顺手就买了。你那句“买这个干嘛”我提前替你说了。`,
      g => `你说什么都不要,我都记着。今年从这件${g}开始。`,
      g => `送你这件${g}。别舍不得用,别收柜子里。是要用的。`,
      g => `离得远,能送到你手里的东西不多,这件${g}算一件。`,
      g => `你不说我也猜得到。这件${g},算补上你那个没说出口的“想要”。`,
      g => `寄给你这件${g}。收到回一句话就行,别的不用。`,
    ],
    witty: [
      g => `别问多少钱。你用上,就是给我的回报。`,
      g => `这件${g}送你。下次见面不许再说“别买”。`,
      g => `你反正又要客气一通。我把${g}先送了,话也替你说了,你用就行。`,
      g => `这件${g}不能折现,不能转送邻居,只能你自己用。`,
      g => `你总叫我多学习,瞧,我学会送礼了。证据在此——${g}。`,
      g => `这件${g}给你。再听见“浪费钱”三个字,我可不高兴。`,
      g => `这件${g}给你用。我知道你会念叨我两句,你念吧,我听着。`,
    ],
  },
  colleague: {
    warm: [
      g => `小心意。这件${g}你看着用,用不上也没关系。`,
      g => `听说你最近在忙那个大项目。这件${g}帮不上忙,但愿你这段日子能过得舒服点。`,
      g => `同事一场,有些话不太好说。这件${g},算我说了句“辛苦了”。`,
      g => `这件${g}是谢你上次接住我那个活。不贵,顺手挑的。`,
      g => `共事一场,谢谢你。这件${g}请收下。`,
      g => `挑这件${g}的时候想了想——不太贵,也不太轻,刚好。`,
    ],
    witty: [
      g => `就是个小东西。这件${g}你能用、能送人、也能拿着碎碎念五分钟。`,
      g => `这件${g}给你。不包加班费,不包减肥成功,不包升职。`,
      g => `这件${g}就是“同事送礼”该有的样子:不贵、不闹、不留把柄。收吧。`,
      g => `都说同事不适合送太私人的东西。所以我挑了这件${g},仅限工作日使用。`,
      g => `这件${g}比你工位上那堆东西轻多了。拿去。`,
      g => `送礼如发邮件,简洁第一。这件${g},祝周一愉快。`,
    ],
  },
  crush: {
    warm: [
      g => `这件${g}给你。不是什么表白,就是什么都不说也太可惜。`,
      g => `记得你随口说过一句。这件${g},是那句话后面我没说出来的那一步。`,
      g => `这个距离挺难的——送贵了像越界,送轻了又不甘心。这件${g},希望刚好。`,
      g => `不算什么贵的东西,但出现在你面前之前,我想过不止一次。`,
      g => `这是别人不太好开口、只能我送的那种礼物。这件${g}。`,
      g => `送你这件${g}。不用回礼。你说一句“喜欢”就够我高兴半天。`,
      g => `想了好久要不要送。最后还是放进了袋子里——这件${g}。`,
    ],
    witty: [
      g => `事先声明,这件${g}和我本人是两回事。喜欢哪个你自己选。`,
      g => `送你这件${g}。重点不是它,是“我、记得、你说过”这三件事。别问太多。`,
      g => `本来只是随便看看,看着看着就买了这件${g}。你别多想。(可以多想一点点。)`,
      g => `挑这件${g}之前我问了闺蜜、查了你星座、看了三十条评论。请务必喜欢。`,
      g => `说是顺手买的。顺了一个多月的手。`,
      g => `这件${g}给你。谢谢你什么都不问。`,
      g => `递给你这件${g}的时候我会装作很自然。麻烦你也装一下。`,
    ],
  },
};

// echo 场景词库:命中后温暖款用场景文案,俏皮款 70% 也用场景版,30% 保留关系版以避免“换一版”重复
const ECHO_SCENES = [
  {
    keys: ["加班", "凌晨", "通宵", "996", "加班到", "赶项目", "deadline", "ddl"],
    warm: [
      (g, e) => `你最近${e},一听就累。这件${g}帮不了什么,就想让你松一秒。`,
      (g, e) => `知道你在${e}。这件${g}给你,中间累了就拿出来看看。`,
      (g, e) => `${e}这几个字听着轻,扛着重。这件${g}给你,别再硬撑了。`,
    ],
    witty: [
      (g, e) => `听说你又在${e}。这件${g}给你——我不说加油,就说一句别太拼。`,
      (g, e) => `${e}的人不配收礼?偏不。这件${g}你拿着,公司不会谢你,我谢你。`,
      (g, e) => `${e}的解药我没研究出来,先送你件${g}试试,不行再来骂我。`,
    ],
  },
  {
    keys: ["失眠", "睡不着", "多梦", "黑眼圈", "熬夜"],
    warm: [
      (g, e) => `你说你最近${e}。这件${g}给你,希望夜里能踏实几个钟头。`,
      (g, e) => `${e}的夜最难熬。这件${g}给你,陪你过几个安静的夜。`,
      (g, e) => `知道你${e}很久了。这件${g}不是解药,只想让你知道有人记得。`,
    ],
    witty: [
      (g, e) => `${e}这事光靠意志力扛不住。这件${g}先试试,不行回来骂我。`,
      (g, e) => `${e}的方法有三种:运动、冥想、和这件${g}。前两个你做不到,第三个我替你买了。`,
    ],
  },
  {
    keys: ["颈椎", "肩颈", "腰痛", "背痛", "鼠标手", "腱鞘"],
    warm: [
      (g, e) => `一身的${e},是你这些年扛下来的账。这件${g},替我说一句“辛苦了”。`,
      (g, e) => `你这${e}不是一两天了。这件${g}给你,别再说“等忙完再看”。`,
      (g, e) => `${e}的事你提过好几次了。这次别拖,先用上这件${g}。`,
    ],
    witty: [
      (g, e) => `你这${e},估计一天里就剩“坐”这一个动作了。${g}先用着,后面看你了。`,
      (g, e) => `${e}是上班的副作用。这件${g}先顶着,别拖到去医院才想起我。`,
    ],
  },
  {
    keys: ["考研", "考公", "复习", "考试", "雅思", "考研人", "上岸"],
    warm: [
      (g, e) => `你为${e}拼了这么久。这件${g},陪你走到下一程。`,
      (g, e) => `${e}这条路不好走。这件${g}没什么大用,就当我替你点的一盏灯。`,
      (g, e) => `知道你最近全扑在${e}上。这件${g}给你,不催你,陪着就行。`,
    ],
    witty: [
      (g, e) => `${e}期间不好乱送礼,那就送件不闹的——${g}。剩下的你负责上岸。`,
      (g, e) => `${e}人专属:这件${g}许愿用。真没用就当个摆件。`,
    ],
  },
  {
    keys: ["减肥", "健身", "减脂", "跑步", "骑行", "瑜伽", "撸铁"],
    warm: [
      (g, e) => `你${e}这么久,挺让我佩服的。这件${g}给你,算我加油的一份。`,
      (g, e) => `${e}不容易。这件${g}给你,我也在偷偷努力,算是同伙。`,
    ],
    witty: [
      (g, e) => `给${e}的人送礼最难。送吃的怕你纠结,不送吃的你说什么都不缺。那就这件${g}。`,
      (g, e) => `${e}打卡第无数天。这件${g}送你,别拿它当不练的借口。`,
    ],
  },
  {
    keys: ["猫", "狗", "养狗", "养猫", "主子", "铲屎", "毛孩子"],
    warm: [
      (g, e) => `都说${e}的人,身上还留着点软。这件${g},是送你们两位的。`,
      (g, e) => `${e}的人,家里总是有声音的。这件${g}给你,愿你们都好。`,
    ],
    witty: [
      (g, e) => `主要是看${e}过得比你好。这件${g}是给你的——不许转手。`,
      (g, e) => `${e}的家里东西总会神秘失踪。这件${g}请你看牢,出事别找我。`,
    ],
  },
  {
    keys: ["咖啡", "手冲", "拿铁", "美式", "豆子", "V60", "挂耳"],
    warm: [
      (g, e) => `你迷上${e}是从哪天开始的我都记得。这件${g},加入你的小习惯里。`,
      (g, e) => `${e}这事你一聊就是半小时。这件${g}给你,凑个趣。`,
    ],
    witty: [
      (g, e) => `你这个${e}爱好者。这件${g}你拿好,记住——人比豆子香。`,
      (g, e) => `给${e}爱好者送礼最怕选错。这件${g}保底——它和${e}一点不冲突。`,
    ],
  },
  {
    keys: ["追剧", "看剧", "追星", "演唱会", "粉丝", "爱豆"],
    warm: [
      (g, e) => `你说你${e}的时候只会“啊啊啊”。这件${g},就是给那些“啊啊啊”留的位置。`,
      (g, e) => `${e}是你这段日子里最开心的部分。这件${g}陪你继续开心。`,
    ],
    witty: [
      (g, e) => `看在你${e}不在线的份上,送你这件${g}。下次安利记得叫我。`,
      (g, e) => `${e}的人最不需要劝。这件${g}给你,我懂,你继续。`,
    ],
  },
  {
    keys: ["旅行", "出差", "新城市", "搬家", "异地", "出国"],
    warm: [
      (g, e) => `要${e}了。这件${g}装进行李,愿你到哪儿都能快点安顿下来。`,
      (g, e) => `${e}总要带点让人心里踏实的东西。这件${g}算一个。`,
    ],
    witty: [
      (g, e) => `你又${e}。这件${g}带着,不占地方,还顶用。`,
      (g, e) => `${e}前的最后一份礼物。请保护好它,还有你自己。`,
    ],
  },
  {
    keys: ["生日", "生辰"],
    warm: [
      (g, e) => `生日快乐。这件${g},是我这一年看见你的那部分。`,
      (g, e) => `生日快乐。挑了挺久,最后选了这件${g}——你应该懂的。`,
    ],
    witty: [
      (g, e) => `生日快乐。礼物是这件${g}——随便拆,反正它跑不了。`,
      (g, e) => `生日只许愿不还愿的人本来没资格收礼,你例外——这件${g}给你。`,
    ],
  },
  {
    keys: ["离职", "裸辞", "gap", "间隔年", "转行", "转职", "辞职"],
    warm: [
      (g, e) => `${e}的事我听说了。不说加油,也不问你想清楚没。这件${g},是我能给的那部分。`,
      (g, e) => `${e}之后这段空档,不容易。这件${g}给你,慢慢来。`,
    ],
    witty: [
      (g, e) => `${e}是大事,这件${g}是小事。以小接大,三餐随你。`,
      (g, e) => `${e}人专属问候:这件${g}请收下,顺便确认一下你最近睡得着吗。`,
    ],
  },
  {
    keys: ["新工作", "入职", "升职", "新身份", "试用期"],
    warm: [
      (g, e) => `${e}了,送你这件${g}。新位置上的头几天总有点冷,愿它能挡一挡。`,
      (g, e) => `恭喜${e}。这件${g}给你,陪你慢慢把新角色穿合身。`,
    ],
    witty: [
      (g, e) => `${e}就得有${e}的样子。这件${g}你拿好,先把行头补齐再说。`,
      (g, e) => `${e}礼物别太喜庆。这件${g}低调又顺手,跟你新名片挺配。`,
    ],
  },
  {
    keys: ["分手", "失恋", "前任"],
    warm: [
      (g, e) => `${e}的事我不多问。这件${g}给你,什么时候用,你说了算。`,
      (g, e) => `${e}之后这段路你自己走。我能陪一段算一段,这件${g}先收下。`,
    ],
    witty: [
      (g, e) => `${e}这种事我懂得不多,挑礼物倒是会。这件${g},别拿来砸前任。`,
      (g, e) => `${e}专属:这件${g}不解恨,但能转移一下注意力。`,
    ],
  },
];

function generateLetterFromTemplates(giftName, persona, rel, echoes) {
  const relId = rel && rel.id ? rel.id : "friend";
  const pool = LETTER_BY_RELATION[relId] || LETTER_BY_RELATION.friend;

  // 默认从关系池中抽一温一俏
  let warm = pick(pool.warm)(giftName);
  let witty = pick(pool.witty)(giftName);

  // 如果有 echo 词,尝试命中场景词库
  const echoStr = echoes && echoes.length > 0 ? echoes[0] : "";
  if (echoStr) {
    const scene = ECHO_SCENES.find(s => s.keys.some(k => echoStr.includes(k)));
    if (scene) {
      // 温暖款走场景,俏皮款也随机从场景抽(保留 30% 几率用关系池以防换一版最后变重复)
      warm = pick(scene.warm)(giftName, echoStr);
      if (Math.random() > 0.3) {
        witty = pick(scene.witty)(giftName, echoStr);
      }
    } else {
      // 未命中场景词,发一个通用“你说过 X”上下文插入
      warm = `你说过${echoStr}。这件${giftName},不多不少,刚好接着那件事。`;
    }
  }

  return { warm, witty, source: "template" };
}

// 提存按钮点击——使用自建 modal（纯静态 / iframe 环境下 window.prompt 会被拦）
function promptSaveCase() {
  const modal = document.getElementById("caseNameModal");
  const input = document.getElementById("caseNameInput");
  const okBtn = document.getElementById("caseNameOk");
  const cancelBtn = document.getElementById("caseNameCancel");
  if (!modal || !input || !okBtn || !cancelBtn) {
    // 底备方案：如果 modal 元素不在，走原生 prompt
    const fallback = window.prompt("给这份档案起个名字：", state._historyLabel || "");
    if (fallback === null) return;
    const entry = addHistoryEntry(fallback);
    if (entry) {
      state._historyLabel = entry.label;
      showToast("✅ 已存入档案「" + entry.label + "」");
    }
    return;
  }

  input.value = state._historyLabel || "";
  modal.hidden = false;
  // 下一个 tick 再 focus，让 iOS 键盘能弹出
  setTimeout(() => { input.focus(); input.select(); }, 60);

  function cleanup() {
    modal.hidden = true;
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
    input.removeEventListener("keydown", onKey);
    modal.removeEventListener("click", onMaskClick);
  }
  function onOk() {
    const val = input.value.trim();
    cleanup();
    const entry = addHistoryEntry(val);
    if (entry) {
      state._historyLabel = entry.label;
      showToast("✅ 已存入档案「" + entry.label + "」");
      // 重新渲染 result 以显示「当前档案」标签
      try { renderResult({ keepPersona: true, shuffleSeed: state._shuffleCount || 0 }); } catch(e) {}
    }
  }
  function onCancel() { cleanup(); }
  function onKey(e) {
    if (e.key === "Enter") { e.preventDefault(); onOk(); }
    else if (e.key === "Escape") { onCancel(); }
  }
  function onMaskClick(e) { if (e.target === modal) onCancel(); }

  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
  input.addEventListener("keydown", onKey);
  modal.addEventListener("click", onMaskClick);
}

document.addEventListener("DOMContentLoaded", init);
