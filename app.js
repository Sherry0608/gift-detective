// ============================================================
// 礼物侦探事务所 · 交互层
// ============================================================

const SCREENS = ["cover", "relation", "basic", "budget", "quiz", "open", "result", "gallery"];
const TOTAL_STEPS = 5;
const STEP_OF_SCREEN = {       // 进度条对应步骤（0 = 不显示）
  cover: 0, relation: 1, basic: 2, budget: 3, quiz: 4, open: 5, result: 5, gallery: 0
};

const state = {
  screen: "cover",
  relation: null,
  basic: { gender: null, age: null, job: null },
  budget: null,
  answers: [],            // 长度 12 的数组，存 "E"/"I"/"M" 等
  quizIdx: 0,
  open: { o1: "", o2: "", o3: "", o4: "" },
  persona: null,
  scores: null,
  // 盲盒模式存储 7 个字段
  blind: { budget: null, gender: null, age: null, job: null, occasion: null, vibe: null, closeness: null },
  _blindShuffle: 0
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
    fill.style.width = (step / TOTAL_STEPS * 100) + "%";
    txt.textContent = `第 ${step} 步 / 共 ${TOTAL_STEPS} 步`;
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
      setTimeout(() => { renderBasicForm(); goto("basic"); }, 280);
    });
    grid.appendChild(btn);
  });

  // (已移除 Step 1 末尾的“不太了解 TA”入口;封面的盲盒按钮保留)
}

// ---------- 渲染 Step 2 TA 的轮廓（可选 3 字段） ----------
function renderBasicForm() {
  const mounts = {
    gender: { el: document.getElementById("basicGender"), opts: BLIND_FIELDS.gender },
    age:    { el: document.getElementById("basicAge"),    opts: BLIND_FIELDS.age },
    job:    { el: document.getElementById("basicJob"),    opts: BLIND_FIELDS.job },
  };
  Object.entries(mounts).forEach(([key, { el, opts }]) => {
    if (!el) return;
    el.innerHTML = "";
    opts.forEach(o => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "blind-chip";
      b.textContent = o.label;
      if (state.basic[key] === o.id) b.classList.add("picked");
      b.addEventListener("click", () => {
        // 点同一个已选中的 chip = 取消选择
        if (state.basic[key] === o.id) {
          state.basic[key] = null;
          b.classList.remove("picked");
        } else {
          state.basic[key] = o.id;
          el.querySelectorAll(".blind-chip").forEach(x => x.classList.remove("picked"));
          b.classList.add("picked");
        }
      });
      el.appendChild(b);
    });
  });
  document.getElementById("basicNextBtn").onclick = () => goto("budget");
  document.getElementById("basicSkipBtn").onclick = () => {
    state.basic = { gender: null, age: null, job: null };
    goto("budget");
  };
}

// ---------- 渲染 Step 3 预算 ----------
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
      // 同步刷新“下一题/提交”按钮
      updateQuizNextBtn();
      optsEl.classList.remove("unanswered-highlight");
      // 自动跳转下一题(最后一题不自动提交,交由用户点提交按钮,避免误提交)
      // 跳转前还能改主意：同一题再次点击会重置计时器
      if (state.quizIdx < QUESTIONS.length - 1) {
        clearTimeout(state._autoNextTimer);
        state._autoNextTimer = setTimeout(() => {
          // 再次确认当前题仍是这一题且已答
          if (state.quizIdx === i && state.answers[i]) {
            state.quizIdx++;
            renderQuiz();
          }
        }, 380);
      }
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

  // 下一题/提交按钮：每题都展示。未答时禁用,最后一题文案改为“提交答案”
  updateQuizNextBtn();

  // 未答高亮：从 reveal 校验跳回时附加
  if (state._highlightUnanswered) {
    optsEl.classList.add("unanswered-highlight");
    state._highlightUnanswered = false;
  } else {
    optsEl.classList.remove("unanswered-highlight");
  }
}

// 统一刷新“下一题/提交答案”按钮的可点状态与文案
function updateQuizNextBtn() {
  const i = state.quizIdx;
  const nextBtn = document.getElementById("quizNext");
  if (!nextBtn) return;
  nextBtn.hidden = false;
  const isLast = i === QUESTIONS.length - 1;
  nextBtn.textContent = isLast ? "提交答案 →" : "下一题 →";
  nextBtn.classList.toggle("submit", isLast);
  const answered = !!state.answers[i];
  nextBtn.disabled = !answered;
}

// =========================================================
// 礼物盲盒模式
// =========================================================

const BLIND_FIELDS = {
  gender: [
    { id: "m",   label: "男生",   tags: ["职场","数码","机械","运动","户外"] },
    { id: "f",   label: "女生",   tags: ["香水","香氛","穿搭","小众","设计","治愈"] },
    { id: "any", label: "不确定", tags: [] }
  ],
  age: [
    { id: "student", label: "学生时代", tags: ["潮流","二次元","盲盒","治愈","可爱","潮玩"] },
    { id: "young",   label: "职场新人", tags: ["通勤","职场","效率","数码"] },
    { id: "mid",     label: "中青年",   tags: ["养生","茶","实用","健康","品质"] },
    { id: "senior",  label: "长辈",     tags: ["养生","健康","传统","茶","丝巾","实用"] }
  ],
  job: [
    { id: "student",  label: "学生",     tags: ["学生","潮流","二次元","盲盒","治愈","可爱","潮玩","文具","文艺"] },
    { id: "brain",    label: "脑力劳动", tags: ["数码","键盘","耳机","阅读"] },
    { id: "body",     label: "体力/户外", tags: ["运动","户外","露营","健康","实用"] },
    { id: "creative", label: "创意/设计", tags: ["设计","设计师","文具","手账","文艺","小众"] },
    { id: "other",    label: "其他",     tags: [] }
  ],
  occasion: [
    { id: "birthday", label: "生日",     tags: ["庆祝","仪式感","礼盒"] },
    { id: "holiday",  label: "节日/节庆", tags: ["庆祝","派对","礼盒","仪式感"] },
    { id: "thanks",   label: "表示感谢", tags: ["茶","商务","职场","礼盒"] },
    { id: "casual",   label: "随手送送", tags: ["治愈","实用"] },
    { id: "farewell", label: "告别/纪念", tags: ["纪念","仪式感","传统"] }
  ],
  vibe: [
    { id: "useful",   label: "实用才是硬道理", tags: ["实用","效率"] },
    { id: "warm",     label: "有点心意就行",   tags: ["仪式感","治愈","文艺"] },
    { id: "fun",      label: "热闹气氛拉满",   tags: ["派对","聚会","桌游","盲盒","潮玩"] },
    { id: "luxe",     label: "高级感上去",   tags: ["设计师","小众","皮具","香水","品质"] }
  ],
  closeness: [
    { id: "close",    label: "很熟, 什么都能送", tags: [], blockTags: [] },
    { id: "normal",   label: "一般熟悉",         tags: [],
      blockTags: ["香水"] },
    { id: "distant",  label: "不太熟, 小心送",   tags: ["职场","商务","茶","礼盒","实用","通勤"],
      blockTags: ["香水","二次元","潮玩","盲盒"], strict: true }
  ]
};

function enterBlindMode() {
  // 进入盲盒:重置人格流状态,初始化 7 字段
  state.relation = null;
  state.basic = { gender: null, age: null, job: null };
  state.budget = null;
  state.answers = [];
  state.persona = null;
  state.blind = { budget: null, gender: null, age: null, job: null, occasion: null, vibe: null, closeness: null };
  state._blindShuffle = 0;
  renderBlindForm();
  goto("blind");
}

function renderBlindForm() {
  const mounts = {
    budget:    { el: document.getElementById("blindBudget"),    opts: BUDGETS.map(b => ({ id: b.id, label: b.label })) },
    gender:    { el: document.getElementById("blindGender"),    opts: BLIND_FIELDS.gender },
    age:       { el: document.getElementById("blindAge"),       opts: BLIND_FIELDS.age },
    job:       { el: document.getElementById("blindJob"),       opts: BLIND_FIELDS.job },
    occasion:  { el: document.getElementById("blindOccasion"),  opts: BLIND_FIELDS.occasion },
    vibe:      { el: document.getElementById("blindVibe"),      opts: BLIND_FIELDS.vibe },
    closeness: { el: document.getElementById("blindCloseness"), opts: BLIND_FIELDS.closeness }
  };
  Object.entries(mounts).forEach(([key, { el, opts }]) => {
    if (!el) return;
    el.innerHTML = "";
    opts.forEach(o => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "blind-chip";
      b.textContent = o.label;
      if (state.blind[key] === o.id) b.classList.add("picked");
      b.addEventListener("click", () => {
        state.blind[key] = o.id;
        el.querySelectorAll(".blind-chip").forEach(x => x.classList.remove("picked"));
        b.classList.add("picked");
      });
      el.appendChild(b);
    });
  });
  document.getElementById("blindRevealBtn").onclick = handleBlindReveal;
}

function handleBlindReveal() {
  // 预算为必填,其他字段依然处理:未选则不加分、不过滤
  if (!state.blind.budget) {
    showToast("预算为必选项,先选一个吧");
    return;
  }
  state._blindShuffle = 0;
  renderBlindResult();
}

// 返回结构化信号:按字段组织,让打分能区分"命中哪个字段"
// 人格流 Step 2 “TA 的轮廓” 输出的正向 tag 集合（复用 BLIND_FIELDS 里的 gender/age/job 词表）
function basicSignalTags() {
  const out = new Set();
  const b = state.basic || {};
  ["gender", "age", "job"].forEach(field => {
    const id = b[field];
    if (!id) return;
    const def = BLIND_FIELDS[field];
    if (!def) return;
    const o = def.find(x => x.id === id);
    if (!o || !o.tags) return;
    o.tags.forEach(t => out.add(t));
  });
  return out;
}

function blindSignalTags() {
  const negative = new Set();
  let strictAllow = null;
  const b = state.blind;
  const byField = {}; // { job: Set<tag>, ... }
  const allPositive = new Set();

  function addField(field, id) {
    if (!id) return;
    const def = BLIND_FIELDS[field];
    if (!def) return;
    const o = def.find(x => x.id === id);
    if (!o) return;
    const tags = o.tags || [];
    if (tags.length) {
      byField[field] = new Set(tags);
      tags.forEach(t => allPositive.add(t));
    }
    (o.blockTags || []).forEach(t => negative.add(t));
    if (o.strict && tags.length) {
      strictAllow = new Set([...(strictAllow || []), ...tags]);
    }
  }
  ["gender","age","job","occasion","vibe","closeness"].forEach(f => addField(f, b[f]));
  return { byField, positive: allPositive, negative, strictAllow };
}

// 理由文案库:按命中的主导 tag 选不同表达,避免千篇一律
// 写法目标:像朋友推荐礼物时随口一句的语气,不写"贴 X / Y, 适合 Z"这种生硬拼接
const BLIND_REASON_LIB = {
  // 职业/职场向
  "职场":     ["上班拿出来不太张扬,但显得你认真挑过", "放在工位上不出戏,送出去也不踩雷", "懂行的人一眼能看出选过料"],
  "商务":     ["送顺手不会跳脸,也不会让人不好收下", "体面这件事它拿捏得刚好", "不张扬但能看出你上了心"],
  "通勤":     ["每天出门都用得上,越用越顺手", "上班路上多带一件也不嫌烦", "陪过 TA 几十个早晨之后就变成日常的一部分"],
  "效率":     ["能悄悄把 TA 的桌面收拾干净", "帮 TA 把那堆乱七八糟的东西理一理", "用过的人都说'怎么不早买'"],
  "数码":     ["不是张牙舞爪那种科技货,小小一件但很加分", "桌面上多它一件不算多,少它一件又缺点什么", "能用很久的那种小装备"],
  "键盘":     ["手感讲究过,但不是圈内卷到飞起的那种", "打字是 TA 每天的主业,手感舒服点不亏"],
  "耳机":     ["戴上就能从人群里抽身一会儿", "出门、吃饭、加班都用得上"],

  // 设计/文艺向
  "设计":     ["不贵但看得出推敲过", "拿出门不会显土,也不会扎眼", "设计感住在细节里,不外露"],
  "设计师":   ["有点小心思,送出手能拉一点观感", "小众但不冷僻,送出去不撞款"],
  "小众":     ["不会和 TA 朋友圈撞款", "看起来不像随手在购物车顺手拍的", "送出去会被问'这哪儿买的'"],
  "文艺":     ["不是赶潮流那种货,送了比一束花耐看", "静下来的时候才明白选得好"],
  "手账":     ["一看就是'愿意静下来记点什么'的选择", "写字这件事装备跟上了,才能坚持得下来"],
  "文具":     ["不贵不张扬,但是 TA 每天会摸到的东西"],
  "阅读":     ["送一本书太冒险,送一份'让 TA 自己挑'刚好"],

  // 生活/治愈向
  "治愈":     ["不求多重要,只是'提醒 TA 有你'", "一件能让 TA 抱着发呆的东西", "下班回到家看见它,会会心一笑"],
  "实用":     ["不打嘴炮多贴心,能用上才是真爱", "脸上不炫,生活里管用", "TA 自己可能不会买,但别人送会很高兴"],
  "养生":     ["可能 30 岁后开始真香", "体面、有温度、又不跳脸"],
  "健康":     ["送这件总会被说'还是你贴心'", "不炫但记在心里"],
  "茶":       ["送谁都不容易出错,是那种省事的选择", "可以摆在那里压压气场,要拿出手又能拿出手"],
  "传统":     ["不会太跳,送长辈送问候都不出错"],

  // 户外/运动向
  "户外":     ["能塞进背包里出门一起走", "TA 下次出门就能用上", "独行、露营、出差都不耽误"],
  "运动":     ["让'决心动起来'这件事变得容易一点", "出过汗之后会多一点成就感"],
  "露营":     ["户外资深的人会拿出来顺嘴说几句的那种"],

  // 潮玩/气氛向
  "潮玩":     ["拆盒那一下能拍个视频发朋友圈", "夏天拿出来装、冬天拿出来玩都行"],
  "盲盒":     ["拆的过程就是礼物本礼,拆出什么都不会输"],
  "二次元":   ["TA 嘴上不会承认,但会偷偷拿给朋友看"],
  "可爱":     ["一看就让人'哇'一声,送了不吃亏"],
  "潮流":     ["不是热搜爆款那种,但能跟上 TA 朋友圈的更新速度"],
  "聚会":     ["被拉着玩到深夜的那种素材"],
  "派对":     ["热闹场合拿出来不冷场"],
  "桌游":     ["一群人玩到凌晨的那种相遇"],

  // 机械/香氛/服饰
  "机械":     ["机械控、装备控会送出手一句'你懂我'"],
  "香水":     ["被记住的那种礼物,不动声色却在鼻子里留下"],
  "香氛":     ["点上就能把 TA 的小宇宙调静"],
  "穿搭":     ["看起来不大件,但出现频率会越来越高"],
  "皮具":     ["质感能撑起来,放久了反而越用越顺"],
  "丝巾":     ["体面,看起来是存心选过的,不出错"],

  // 仪式感/礼盒/纪念
  "仪式感":   ["跟'随手凑数那种'拉开距离", "送出去能让'这一天'多一些重量"],
  "礼盒":     ["拆盒本身就是过程的一部分", "打开后不会被问'这是什么'"],
  "庆祝":     ["适合拿出来纪念一件之后才慢慢明白的事"],
  "纪念":     ["现在选它不是因为今天,是因为之后每次拿出来都会被记起"],

  // 默认兜底
  "_":         ["送出手不太能踩雷的那种", "不张扬但也不寒酸,刚刚好", "属于'不太可能选错'的那一类"]
};

// 盲盒卡片文案:优先用每件礼物自己的 blindBlurb(货品句 + 场景句)
// 若没有 blindBlurb(向后兼容),才回退到按 tag 选模板
function blindBlurbFor(g, byField, seedSalt) {
  if (g.blindBlurb && g.blindBlurb.item && g.blindBlurb.scene) {
    return { item: g.blindBlurb.item, scene: g.blindBlurb.scene };
  }
  // 兜底:按 tag 选一句(无 item / scene 区分)
  const fieldOrder = ["job", "occasion", "vibe", "age", "gender"];
  let primary = null;
  for (const f of fieldOrder) {
    const set = byField[f];
    if (!set) continue;
    const hit = (g.tags || []).find(t => set.has(t) && BLIND_REASON_LIB[t]);
    if (hit) { primary = hit; break; }
  }
  if (!primary) {
    const fallback = (g.tags || []).find(t => BLIND_REASON_LIB[t]);
    if (fallback) primary = fallback;
  }
  const pool = (primary && BLIND_REASON_LIB[primary]) || BLIND_REASON_LIB["_"];
  let h = 0;
  const key = (g.name || "") + "|" + (primary || "") + "|" + (seedSalt || 0);
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0x7fffffff;
  return { item: pool[h % pool.length], scene: "" };
}

function blindRecommend(shuffleSeed) {
  const budget = BUDGETS.find(x => x.id === state.blind.budget);
  if (!budget) return [];
  // 严格按典型价过滤:priceTypical 必须落在预算带内(±15% 容差,防止数据边缘卡死)
  // 没有 priceTypical 的礼物降级用 (priceMin+priceMax)/2
  const tol = 0.15;
  const lo = budget.min * (1 - tol);
  const hi = budget.max * (1 + tol);
  const typicalOf = g => (typeof g.priceTypical === "number" ? g.priceTypical : (g.priceMin + g.priceMax) / 2);
  const inBudget = g => { const t = typicalOf(g); return t >= lo && t <= hi; };
  const { byField, negative, strictAllow } = blindSignalTags();

  let pool = GIFTS.filter(inBudget);
  // 严格过滤(不太熟):只保留 strictAllow 里的 tag
  if (strictAllow) {
    pool = pool.filter(g => g.tags.some(t => strictAllow.has(t)));
  }
  // 负过滤:包含任一 negative tag 的踢出
  if (negative.size) {
    pool = pool.filter(g => !g.tags.some(t => negative.has(t)));
  }

  // 评分逻辑:job(职业)是最硬的轴——选了"体力/户外"就不能抽出一堆治愈礼盒
  // job 命中:+100 (护航分、礼物一定优先);其他字段:occasion +5 / vibe +5 / age +3 / gender +2
  const W = { job: 100, occasion: 5, vibe: 5, age: 3, gender: 2, closeness: 0 };
  const hasJob = !!byField.job;
  const scored = pool.map(g => {
    let weighted = 0;
    let jobHit = false;
    Object.entries(byField).forEach(([field, set]) => {
      const hit = (g.tags || []).some(t => set.has(t));
      if (hit) {
        weighted += (W[field] || 1);
        if (field === "job") jobHit = true;
      }
    });
    return { g, weighted, jobHit };
  });

  // 排序:加权分高的在前。由于 job=+100,命中 job 的一定走在前面
  scored.sort((a, b) => b.weighted - a.weighted);

  // 如果选了 job,且命中 job 的礼物 >= 6 件:只从命中池里抽。
  // 命中池 < 6 件:护航命中的那几件,剩下从次优池随机补足
  const TOP = 6;
  let candidates;
  if (hasJob) {
    const jobHits = scored.filter(x => x.jobHit);
    const others = scored.filter(x => !x.jobHit);
    if (jobHits.length >= TOP * 2) {
      // 命中池够大:从命中池里随机抽 6
      candidates = jobHits.slice(0, Math.max(12, TOP * 2));
    } else if (jobHits.length >= 1) {
      // 命中池不够:全部命中 + 从次优池抽足 12 件
      const need = Math.max(12, TOP * 2) - jobHits.length;
      candidates = jobHits.concat(others.slice(0, need));
    } else {
      // 一件都没命中 job(概率低):退回按总分抽
      candidates = scored.slice(0, Math.max(12, TOP * 2));
    }
  } else {
    const POOL_FOR_SHUFFLE = Math.min(scored.length, Math.max(12, TOP * 2));
    candidates = scored.slice(0, POOL_FOR_SHUFFLE);
  }
  const seed = (shuffleSeed || 0) * 1009 + 17;
  const shuffled = seededShuffle(candidates, seed);
  return shuffled.slice(0, TOP).map(x => x.g);
}

function renderBlindResult() {
  const gifts = blindRecommend(state._blindShuffle);
  const budget = BUDGETS.find(x => x.id === state.blind.budget);
  const root = document.getElementById("resultRoot");
  state._isBlindResult = true;

  // 拼一个人话描述
  const labelOf = (field, id) => {
    const def = BLIND_FIELDS[field];
    if (!def) return "";
    const o = def.find(x => x.id === id);
    return o ? o.label : "";
  };
  const desc = [
    labelOf("gender", state.blind.gender),
    labelOf("age", state.blind.age),
    labelOf("job", state.blind.job),
  ].filter(Boolean).join(" · ");

  const occLabel = labelOf("occasion", state.blind.occasion);
  const vibeLabel = labelOf("vibe", state.blind.vibe);
  const { byField } = blindSignalTags();

  let html = `
    <div class="blind-result-head">
      <div class="case-no">礼物盲盒 #${dateCode()}</div>
      <h2 class="blind-result-title">为这位 ${desc || "TA"} 拍到了 ${gifts.length} 件礼物</h2>
      <p class="blind-result-sub">
        预算 ¥${budget.label}
        ${occLabel ? " · " + escapeHtml(occLabel) : ""}
        ${vibeLabel ? " · " + escapeHtml(vibeLabel) : ""}
      </p>
    </div>
    <div class="gift-list">
  `;

  if (!gifts.length) {
    html += `<div class="blind-empty">按这个组合没拽出合适的礼物,试试换个预算档或放宽一下“熟不熟”?</div>`;
  } else {
    gifts.forEach(g => {
      const q = encodeURIComponent(g.searchQuery || g.name);
      const tbUrl = `https://s.taobao.com/search?q=${q}`;
      const xhsUrl = `https://www.xiaohongshu.com/search_result?keyword=${q}`;
      html += `
        <div class="gift-card">
          <div class="gift-emoji">${g.emoji || "🎁"}</div>
          <div class="gift-body">
            <div class="gift-top">
              <div class="gift-name">${escapeHtml(g.name)}</div>
              <div class="gift-price">${escapeHtml(g.priceLabel || "")}</div>
            </div>
            ${(() => {
              const b = blindBlurbFor(g, byField, state._blindShuffle);
              if (b.scene) {
                return `<div class="gift-blurb">
                  <div class="gift-blurb-item">${escapeHtml(b.item)}</div>
                  <div class="gift-blurb-scene">${escapeHtml(b.scene)}</div>
                </div>`;
              }
              return `<div class="gift-reason">${escapeHtml(b.item)}</div>`;
            })()}
            <div class="gift-shop-row">
              <a class="shop-btn tb" href="${tbUrl}" target="_blank" rel="noopener noreferrer">
                <span class="shop-mark">淘</span> 淘宝搜
              </a>
              <a class="shop-btn xhs" href="${xhsUrl}" target="_blank" rel="noopener noreferrer">
                <span class="shop-mark xhs-mark">书</span> 小红书搜
              </a>
            </div>
          </div>
        </div>
      `;
    });
  }
  html += `</div>
    <div class="save-case-bar">
      <button class="save-case-btn save-case-btn-ghost" id="blindShuffleBtn">🎲 抽下一批</button>
      <button class="save-case-btn save-case-btn-ghost" id="blindBackEditBtn">✏️ 改改条件</button>
      <button class="save-case-btn save-case-btn-ghost" id="blindBackHomeBtn">← 返回首页</button>
    </div>
  `;

  root.innerHTML = html;
  root.classList.add("is-blind");
  root.querySelector("#blindShuffleBtn").addEventListener("click", () => {
    state._blindShuffle++;
    renderBlindResult();
  });
  root.querySelector("#blindBackEditBtn").addEventListener("click", () => {
    goto("blind");
    renderBlindForm();
  });
  root.querySelector("#blindBackHomeBtn").addEventListener("click", restart);

  goto("result");
  // 隐藏人格结果专属的 share-bar(它位于 screen 末尾),避免错位
  const shareBar = document.querySelector(".screen[data-screen='result'] .share-bar");
  const resultFoot = document.querySelector(".screen[data-screen='result'] .result-foot");
  if (shareBar) shareBar.style.display = "none";
  if (resultFoot) resultFoot.style.display = "none";
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

  // 提前计算轮廓信号：Part A / Part B 都要用
  const basicTags = basicSignalTags();
  function basicBonus(g) {
    if (basicTags.size === 0 || !g.tags || !g.tags.length) return 0;
    let hit = 0;
    for (const t of g.tags) {
      if (basicTags.has(t)) hit++;
      if (hit >= 4) break;
    }
    return Math.min(hit, 4) * 0.8;
  }

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
      // 轮廓加分（同分时优先靠轮廓的礼物）
      score += basicBonus(g);
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
    // 轮廓命中：每个 tag 命中 +0.8，最多加 3.2 分（不抢人格×关系主权重）
    s += basicBonus(g);
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
  resultRoot.classList.remove("is-blind");
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
      <button class="save-case-btn save-case-btn-ghost" id="backHomeBtn">← 返回首页</button>
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
  const bh = resultRoot.querySelector("#backHomeBtn");
  if (bh) bh.addEventListener("click", restart);
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
  state.basic = { gender: null, age: null, job: null };
  state.budget = null;
  state.answers = [];
  state.quizIdx = 0;
  state.open = { o1: "", o2: "", o3: "", o4: "" };
  state.persona = null;
  state.scores = null;
  state._presetPersona = null;
  state._historyLabel = null;
  state._shuffleCount = 0;
  state._isBlindResult = false;
  state.blind = { budget: null, gender: null, age: null, job: null, occasion: null, vibe: null, closeness: null };
  state._blindShuffle = 0;
  document.querySelectorAll(".opt-card, .budget-card").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".open-field textarea").forEach(t => t.value = "");
  // 恢复人格结果页的底部菜单(被盲盒隐藏过)
  const sb = document.querySelector(".screen[data-screen='result'] .share-bar");
  const rf = document.querySelector(".screen[data-screen='result'] .result-foot");
  if (sb) sb.style.display = "";
  if (rf) rf.style.display = "";
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
  renderBasicForm();
  renderBudgets();
  goto("cover");

  document.getElementById("startBtn").addEventListener("click", () => goto("relation"));
  const coverBlind = document.getElementById("coverBlindBtn");
  if (coverBlind) coverBlind.addEventListener("click", enterBlindMode);
  document.getElementById("restartBtn").addEventListener("click", restart);

  document.getElementById("quizBack").addEventListener("click", () => {
    clearTimeout(state._autoNextTimer);
    if (state.quizIdx > 0) {
      state.quizIdx--;
      renderQuiz();
    }
  });

  document.getElementById("quizNext").addEventListener("click", () => {
    clearTimeout(state._autoNextTimer);
    // 未答时按钮 disabled,这里只处理已答情况
    if (!state.answers[state.quizIdx]) {
      // 兜底:提示用户先选一项
      const optsEl = document.getElementById("quizOptions");
      optsEl.classList.add("unanswered-highlight");
      showToast("先选一个再下一题吧");
      return;
    }
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
