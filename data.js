// ============================================================
// 礼物侦探 · 数据层
// 16型人格定义 + 礼物数据库
// ============================================================

// ---------- 16 型人格画像 ----------
const PERSONAS = {
  EMLS: { name: "派对小太阳", en: "Sunny Host", emoji: "🥂",
    tagline: "朋友圈照片最多，请客最积极",
    desc: "TA 是房间里最亮的那颗星，天生擅长把人聚在一起，从来不让气氛冷场。" },
  EMLW: { name: "潮流冒险家", en: "Trend Scout", emoji: "🛼",
    tagline: "新店首发日常打卡，爱晒新奇物",
    desc: "TA 永远比朋友圈早三个月种草，对一切新鲜事物都有雷达。" },
  EMRS: { name: "高光主理人", en: "Polished Lead", emoji: "💼",
    tagline: "职场稳扎稳打，讲究体面",
    desc: "TA 把生活当作品在打磨，每一个细节都要经得起放大。" },
  EMRW: { name: "玩物鉴赏家", en: "Curious Collector", emoji: "🎮",
    tagline: "什么新玩具都要第一个拥有",
    desc: "TA 是行走的新品发布会，桌面永远在迭代。" },
  EALS: { name: "氛围感大师", en: "Vibe Maker", emoji: "🕯️",
    tagline: "桌面永远有鲜花和蜡烛",
    desc: "TA 把日常过成电影，灯光、香气、配色一样都不能少。" },
  EALW: { name: "文艺冒险王", en: "Artsy Nomad", emoji: "🎨",
    tagline: "看展+citywalk+独立音乐节常客",
    desc: "TA 的周末日程比工作日还满，永远在追逐下一场灵感。" },
  EARS: { name: "仪式感企划", en: "Ritual Planner", emoji: "🎁",
    tagline: "生日纪念日提前一个月准备",
    desc: "TA 把每个值得纪念的日子都做成纪录片。" },
  EARW: { name: "跨界玩家", en: "Crossover Player", emoji: "🧩",
    tagline: "什么都懂一点，爱跨圈层交友",
    desc: "TA 是社交场里的万能接口，能和任何人聊上半小时。" },
  IMLS: { name: "温柔治愈系", en: "Gentle Healer", emoji: "🍵",
    tagline: "说话软、爱照顾人，自己却低需求",
    desc: "TA 是朋友圈里那个永远在递纸巾的人，对自己却最克制。" },
  IMLW: { name: "隐秘文青", en: "Quiet Poet", emoji: "📖",
    tagline: "日记本永远写不完，爱小众电影",
    desc: "TA 的内心世界比朋友圈丰富一百倍，只对极少数人打开。" },
  IMRS: { name: "极简高效派", en: "Minimalist Pro", emoji: "⚪",
    tagline: "东西少而精，讨厌花里胡哨",
    desc: "TA 信奉 less is more，每一件物品都要通过严格面试。" },
  IMRW: { name: "深宅极客", en: "Deep Geek", emoji: "⌨️",
    tagline: "一个人能研究一个领域到精通",
    desc: "TA 是垂直领域的隐藏大佬，能为一个细节研究三天三夜。" },
  IALS: { name: "慢生活家", en: "Slow Soul", emoji: "🌿",
    tagline: "周末种花做饭，岁月静好人设",
    desc: "TA 把日子过得像散文诗，时间在 TA 身上走得格外温柔。" },
  IALW: { name: "赛博诗人", en: "Cyber Dreamer", emoji: "👾",
    tagline: "二次元/虚拟偶像/独立游戏爱好者",
    desc: "TA 的精神故乡不在地球，在某个像素和代码构成的次元。" },
  IARS: { name: "古典守护者", en: "Classic Keeper", emoji: "🏺",
    tagline: "穿衣守旧、喜欢传统工艺",
    desc: "TA 相信经过时间考验的东西才有真正的分量。" },
  IARW: { name: "暗夜探索者", en: "Midnight Explorer", emoji: "🌙",
    tagline: "深夜活跃，爱小众神秘向话题",
    desc: "TA 在白天是普通人，到了深夜才开始真正运转。" }
};

// ---------- 12 道人格题 ----------
// 每题：{ dim: 维度, options: [{label, value}], }  value = "E" / "I" 等
const QUESTIONS = [
  // E/I 能量维度
  { dim: "EI", q: "TA 过生日最想要的庆祝方式是？",
    options: [
      { label: "大家一起办派对，越热闹越好", value: "E" },
      { label: "和最亲近的 1–2 人安静吃饭", value: "I" }
    ]},
  { dim: "EI", q: "周末 TA 更常出现在？",
    options: [
      { label: "热闹的街区、livehouse、聚会", value: "E" },
      { label: "家里、咖啡馆角落、图书馆", value: "I" }
    ]},
  { dim: "EI", q: "收到礼物后 TA 的反应更像？",
    options: [
      { label: "立刻发朋友圈或群里炫耀一下", value: "E" },
      { label: "私下默默收好、单独谢你", value: "I" }
    ]},
  // M/A 审美维度
  { dim: "MA", q: "TA 的房间或工位更接近？",
    options: [
      { label: "干净清爽、东西很少", value: "M" },
      { label: "摆件、挂画、氛围灯一大堆", value: "A" }
    ]},
  { dim: "MA", q: "TA 买东西最在意？",
    options: [
      { label: "实用耐用、不花哨", value: "M" },
      { label: "好看、能拍照、有故事感", value: "A" }
    ]},
  { dim: "MA", q: "TA 的穿搭风格更像？",
    options: [
      { label: "基础色系、合身剪裁", value: "M" },
      { label: "有设计感、敢撞色或复古", value: "A" }
    ]},
  // L/R 决策维度
  { dim: "LR", q: "TA 选礼物给别人时更在意？",
    options: [
      { label: "有没有心意、有没有故事", value: "L" },
      { label: "对方是不是真的用得上", value: "R" }
    ]},
  { dim: "LR", q: "TA 更容易被打动的瞬间？",
    options: [
      { label: "你记住了 TA 一个小细节", value: "L" },
      { label: "你帮 TA 省了时间或解决了问题", value: "R" }
    ]},
  { dim: "LR", q: "如果只能二选一，TA 会选？",
    options: [
      { label: "一封手写长信", value: "L" },
      { label: "一张高额购物卡", value: "R" }
    ]},
  // S/W 生活态度维度
  { dim: "SW", q: "TA 对新品牌的态度？",
    options: [
      { label: "经过时间检验的经典款更放心", value: "S" },
      { label: "越新越小众越兴奋", value: "W" }
    ]},
  { dim: "SW", q: "TA 的旅行偏好？",
    options: [
      { label: "路线规划好、住熟悉的连锁", value: "S" },
      { label: "临时起意、爱去冷门地", value: "W" }
    ]},
  { dim: "SW", q: "TA 最近一次主动尝试的新事物？",
    options: [
      { label: "想不太起来", value: "S" },
      { label: "立刻能说出 2–3 个", value: "W" }
    ]}
];

// ---------- 关系 & 预算 ----------
const RELATIONS = [
  { id: "lover",    label: "恋人",      emoji: "💌", hint: "把心意拉满" },
  { id: "friend",   label: "朋友",      emoji: "🫂", hint: "送一份默契" },
  { id: "family",   label: "家人",      emoji: "🏠", hint: "藏在日常里" },
  { id: "colleague",label: "同事",      emoji: "☕", hint: "得体不越界" },
  { id: "crush",    label: "暗恋对象",  emoji: "🌷", hint: "刚刚好的距离" }
];

const BUDGETS = [
  { id: "b1", label: "100 以下",    min: 0,    max: 100 },
  { id: "b2", label: "100–300",     min: 100,  max: 300 },
  { id: "b3", label: "300–500",     min: 300,  max: 500 },
  { id: "b4", label: "500–1000",    min: 500,  max: 1000 },
  { id: "b5", label: "1000+",       min: 1000, max: 99999 }
];

// ---------- 礼物数据库 ----------
// 字段：name, price, emoji, tags(关键词，用于开放题匹配),
// personas(适配的人格代号数组), relations(适配关系), reason(推荐理由模板)
const GIFTS = [
  // ===== 派对/外向/聚会型 =====
  { name: "香槟金气泡礼盒", searchQuery: "香槟礼盒 起泡酒", priceMin: 90, priceMax: 230, priceTypical: 120, priceLabel: "¥90–230", emoji: "🍾",
    tags: ["聚会","派对","庆祝","酒","气泡水"],
    personas: ["EMLS","EMRS","EALS","EARS","EARW"],
    relations: ["lover","friend","colleague"],
    reason: "TA 是天生的氛围发起人，让 TA 在下一次小聚里成为开场担当。" },
  { name: "便携蓝牙音箱（设计师款）", searchQuery: "蓝牙音箱 便携 设计师", priceMin: 300, priceMax: 800, priceTypical: 500, priceLabel: "¥300–800", emoji: "🔊",
    tags: ["音乐","聚会","派对","户外","露营"],
    personas: ["EMLS","EMLW","EARW","EALW"],
    relations: ["lover","friend","family"],
    reason: "走到哪里热闹就到哪里，正好配 TA 这种自带 BGM 的体质。" },
  { name: "复古桌游礼盒", searchQuery: "桌游礼盒 派对游戏", priceMin: 20, priceMax: 90, priceTypical: 49, priceLabel: "¥20–90", emoji: "🎲",
    tags: ["桌游","聚会","朋友","派对"],
    personas: ["EMLS","EARW","EMRW"],
    relations: ["friend","colleague","family"],
    reason: "下一次聚会的破冰神器，TA 一定会拉着所有人玩到深夜。" },

  // ===== 潮流/新奇/小众 =====
  { name: "设计师联名帆布包", searchQuery: "设计师联名 帆布包", priceMin: 60, priceMax: 200, priceTypical: 120, priceLabel: "¥60–200", emoji: "👜",
    tags: ["设计","潮流","穿搭","包"],
    personas: ["EMLW","EALW","EARW","EALS"],
    relations: ["lover","friend","crush"],
    reason: "小众但不冷门，TA 背出门会被同温层秒认出来。" },
  { name: "家用陶艺手揉 DIY 材料包", searchQuery: "陶艺DIY材料包 软陶", priceMin: 16, priceMax: 40, priceTypical: 25, priceLabel: "¥16–40", emoji: "🏺",
    tags: ["DIY","新奇","动手","尝试","陶艺"],
    personas: ["EMLW","EALW","EARW","IALW"],
    relations: ["lover","friend","crush"],
    reason: "两个人窝在桌前捏一下午，比一束花更难忘。" },
  { name: "潮玩盲盒大礼包", searchQuery: "潮玩盲盒 礼盒", priceMin: 30, priceMax: 60, priceTypical: 40, priceLabel: "¥30–60", emoji: "🧸",
    tags: ["盲盒","收藏","治愈","摆件","可爱"],
    personas: ["EMRW","EALS","IALW","IMLW"],
    relations: ["lover","friend","colleague","crush"],
    reason: "拆盒的快乐 × 摆桌的快乐，TA 两样都不会放过。" },

  // ===== 体面/职场/轻奢 =====
  { name: "轻奢真皮卡包", searchQuery: "真皮卡包 轻奢", priceMin: 30, priceMax: 160, priceTypical: 80, priceLabel: "¥30–160", emoji: "👛",
    tags: ["皮具","职场","通勤","穿搭"],
    personas: ["EMRS","IMRS","EARS","IARS"],
    relations: ["lover","family","colleague"],
    reason: "出现在 TA 工位上的每一个物件，都是 TA 自我介绍的一部分。" },
  { name: "进口品牌钢笔", searchQuery: "钢笔 进口 商务礼盒", priceMin: 90, priceMax: 730, priceTypical: 290, priceLabel: "¥90–730", emoji: "🖋️",
    tags: ["书写","职场","签字","笔"],
    personas: ["EMRS","IMRS","IARS"],
    relations: ["lover","family","colleague"],
    reason: "一支会跟着 TA 签下很多重要时刻的笔。" },
  { name: "沙龙香水（小众款）", searchQuery: "沙龙香水 小众 礼盒", priceMin: 120, priceMax: 460, priceTypical: 200, priceLabel: "¥120–460", emoji: "🌸",
    tags: ["香水","香氛","气味","穿搭"],
    personas: ["EMRS","EALS","EARS","IALS"],
    relations: ["lover","crush","friend"],
    reason: "气味是 TA 留在房间里最低调的签名。" },

  // ===== 科技/极客 =====
  { name: "客制化机械键盘", searchQuery: "客制化机械键盘", priceMin: 300, priceMax: 500, priceTypical: 400, priceLabel: "¥300–500", emoji: "⌨️",
    tags: ["键盘","电脑","数码","机械","写代码","打字"],
    personas: ["EMRW","IMRW","IMRS"],
    relations: ["lover","friend","colleague"],
    reason: "每一次敲击都是 TA 给自己写的 BGM。" },
  { name: "降噪头戴耳机", searchQuery: "降噪头戴耳机", priceMin: 150, priceMax: 300, priceTypical: 220, priceLabel: "¥150–300", emoji: "🎧",
    tags: ["耳机","音乐","通勤","数码","降噪"],
    personas: ["IMRW","IMRS","IMLW","EMRW"],
    relations: ["lover","family","colleague","friend"],
    reason: "送 TA 一个能屏蔽世界、只留下喜欢之物的开关。" },
  { name: "创意桌面小风扇加湿器礼盒", searchQuery: "桌面小风扇 加湿器", priceMin: 29, priceMax: 50, priceTypical: 39, priceLabel: "¥29–50", emoji: "💨",
    tags: ["数码","科技","小家电","桌面"],
    personas: ["EMRW","IMRW","EARW"],
    relations: ["friend","colleague","family"],
    reason: "TA 桌面的下一个网红物件，提前帮 TA 拿下。" },

  // ===== 氛围/香薰/居家 =====
  { name: "手工大豆香薰蜡烛套装", searchQuery: "大豆蜡烛 香薰礼盒", priceMin: 70, priceMax: 140, priceTypical: 100, priceLabel: "¥70–140", emoji: "🕯️",
    tags: ["香薰","蜡烛","居家","氛围","治愈","睡眠"],
    personas: ["EALS","IALS","IMLS","IMLW","EARS"],
    relations: ["lover","friend","family","crush"],
    reason: "点上的那一刻，TA 的小宇宙就开机了。" },
  { name: "原创艺术家联名挂画", searchQuery: "艺术挂画 原创", priceMin: 200, priceMax: 600, priceTypical: 380, priceLabel: "¥200–600", emoji: "🖼️",
    tags: ["挂画","艺术","居家","设计","氛围"],
    personas: ["EALS","EALW","IALW","IARW"],
    relations: ["lover","friend","family"],
    reason: "TA 家空着的那面墙，等的就是这种作品。" },
  { name: "复古胶片相机", searchQuery: "胶片相机 复古", priceMin: 120, priceMax: 240, priceTypical: 180, priceLabel: "¥120–240", emoji: "📷",
    tags: ["相机","摄影","复古","记录","拍照"],
    personas: ["EALS","EALW","IMLW","IALW"],
    relations: ["lover","friend","crush"],
    reason: "TA 拍东西不为发朋友圈，只为以后某天能翻出来。" },

  // ===== 仪式感/定制 =====
  { name: "刻字银饰小项链", searchQuery: "刻字项链 银饰 定制", priceMin: 100, priceMax: 220, priceTypical: 160, priceLabel: "¥100–220", emoji: "📿",
    tags: ["首饰","项链","定制","刻字","仪式感"],
    personas: ["EARS","EALS","IALS","IMLS"],
    relations: ["lover","crush","family"],
    reason: "把一句只有你们懂的话，挂在 TA 锁骨之间。" },
  { name: "纪念日定制相册", searchQuery: "纪念日相册 定制", priceMin: 20, priceMax: 80, priceTypical: 32, priceLabel: "¥20–80", emoji: "📔",
    tags: ["相册","纪念日","定制","回忆","照片"],
    personas: ["EARS","IMLS","IALS","IMLW"],
    relations: ["lover","family","friend"],
    reason: "比起朋友圈，TA 更想被认真地翻看。" },
  { name: "高端原叶茶礼盒", searchQuery: "原叶茶 礼盒", priceMin: 160, priceMax: 300, priceTypical: 198, priceLabel: "¥160–300", emoji: "🍵",
    tags: ["茶","养生","送长辈","传统","居家"],
    personas: ["IARS","EARS","IALS","IMRS"],
    relations: ["family","colleague","lover"],
    reason: "得体、暖手、又给得出手，三件事一次完成。" },

  // ===== 温柔治愈/居家 =====
  { name: "毛绒抱枕 + 法兰绒毯套装", searchQuery: "抱枕毛毯套装 礼盒", priceMin: 30, priceMax: 80, priceTypical: 50, priceLabel: "¥30–80", emoji: "🛋️",
    tags: ["治愈","毛绒","居家","睡眠","保暖","软软的"],
    personas: ["IMLS","IALS","EALS","IMLW"],
    relations: ["lover","friend","family","crush"],
    reason: "TA 嘴上说不需要，钻进去之后绝对不会再起来。" },
  { name: "温感变色马克杯", searchQuery: "变色马克杯 礼物", priceMin: 20, priceMax: 50, priceTypical: 30, priceLabel: "¥20–50", emoji: "☕",
    tags: ["杯子","咖啡","茶","办公室","治愈","可爱"],
    personas: ["IMLS","EALS","IALS","IMLW","EMRS"],
    relations: ["colleague","friend","crush"],
    reason: "一杯热水的小心机，每天都能让 TA 笑一下。" },
  { name: "手写贺卡套组（一年份）", searchQuery: "贺卡套装 一年份", priceMin: 10, priceMax: 20, priceTypical: 15, priceLabel: "¥10–20", emoji: "💌",
    tags: ["贺卡","信","写字","心意","治愈"],
    personas: ["IMLS","EARS","IMLW","IALS"],
    relations: ["lover","friend","family","crush"],
    reason: "365 天里，你可以悄悄给 TA 留下很多个'惊喜下一秒'。" },

  // ===== 文艺/独处 =====
  { name: "独立出版杂志半年订阅", searchQuery: "独立杂志 订阅", priceMin: 150, priceMax: 420, priceTypical: 240, priceLabel: "¥150–420", emoji: "📰",
    tags: ["杂志","阅读","书","文艺","订阅"],
    personas: ["IMLW","EALW","IALW","IARW"],
    relations: ["lover","friend","colleague","crush"],
    reason: "每个月，TA 都会收到一次来自你的延迟惊喜。" },
  { name: "黑胶唱片入门套装", searchQuery: "黑胶唱片 入门", priceMin: 600, priceMax: 1500, priceTypical: 999, priceLabel: "¥600–1500", emoji: "💿",
    tags: ["黑胶","音乐","复古","收藏"],
    personas: ["IMLW","IALW","EALW","IARS"],
    relations: ["lover","friend","family"],
    reason: "TA 听音乐这件事，值得有一个专门的仪式。" },
  { name: "当当 / 京东读书电子礼品卡", searchQuery: "当当 京东读书 礼品卡", priceMin: 99, priceMax: 499, priceTypical: 199, priceLabel: "¥99–499", emoji: "📖",
    tags: ["书","阅读","书店","文艺"],
    personas: ["IMLW","IMRS","IALW","IARS","IALS"],
    relations: ["lover","friend","colleague","family","crush"],
    reason: "比起替 TA 选书，让 TA 自己挑半天，才是礼物。" },

  // ===== 极简/高效 =====
  { name: "MUJI 风桌面收纳一体站", searchQuery: "桌面收纳 一体 简约", priceMin: 20, priceMax: 90, priceTypical: 40, priceLabel: "¥20–90", emoji: "🗂️",
    tags: ["收纳","桌面","办公","极简","效率"],
    personas: ["IMRS","EMRS","IMRW"],
    relations: ["colleague","friend","family"],
    reason: "TA 喜欢把桌面整理成一张设计图，这件正合适。" },
  { name: "多口快充一体充电站", searchQuery: "多口充电站 快充", priceMin: 40, priceMax: 120, priceTypical: 80, priceLabel: "¥40–120", emoji: "🔌",
    tags: ["充电","数码","桌面","效率","通勤"],
    personas: ["IMRS","IMRW","EMRS","EMRW"],
    relations: ["lover","friend","family","colleague"],
    reason: "TA 桌上那一堆线，今天起退休。" },
  { name: "高品质基础款羊毛围巾", searchQuery: "羊毛围巾 基础款", priceMin: 100, priceMax: 180, priceTypical: 138, priceLabel: "¥100–180", emoji: "🧣",
    tags: ["围巾","保暖","穿搭","基础款","冬天"],
    personas: ["IMRS","EMRS","IARS","IMLS"],
    relations: ["lover","family","colleague"],
    reason: "颜色克制、剪裁讲究，TA 会戴很多年。" },

  // ===== 慢生活/家 =====
  { name: "桌面园艺小盆栽套装", searchQuery: "桌面盆栽 礼物", priceMin: 10, priceMax: 50, priceTypical: 20, priceLabel: "¥10–50", emoji: "🪴",
    tags: ["植物","园艺","治愈","居家","绿色"],
    personas: ["IALS","EALS","IMLS","IARS"],
    relations: ["friend","family","colleague","crush"],
    reason: "TA 喜欢照顾的东西，又多一个。" },
  { name: "手工陶瓷餐具一人份套组", searchQuery: "手工陶瓷餐具 一人份", priceMin: 50, priceMax: 190, priceTypical: 120, priceLabel: "¥50–190", emoji: "🍽️",
    tags: ["陶瓷","餐具","做饭","居家","美食"],
    personas: ["IALS","EALS","IARS","IMLS"],
    relations: ["lover","family","friend"],
    reason: "TA 一个人吃饭也想要好好吃饭。" },
  { name: "手冲咖啡入门套装", searchQuery: "手冲咖啡 入门套装", priceMin: 100, priceMax: 310, priceTypical: 160, priceLabel: "¥100–310", emoji: "☕",
    tags: ["咖啡","手冲","居家","早晨","治愈"],
    personas: ["IALS","EALW","IMRS","IMLW","EALS"],
    relations: ["lover","friend","family","colleague"],
    reason: "TA 的早晨，从此有了一段属于自己的 10 分钟。" },

  // ===== 二次元/游戏/赛博 =====
  { name: "Steam 数字礼品卡", searchQuery: "Steam 礼品卡", priceMin: 30, priceMax: 50, priceTypical: 40, priceLabel: "¥30–50", emoji: "🎮",
    tags: ["游戏","steam","数码","宅","虚拟"],
    personas: ["IALW","IMRW","EMRW","IARW"],
    relations: ["friend","lover","family","colleague","crush"],
    reason: "把选游戏的快乐和折扣季的心动都留给 TA。" },
  { name: "限量手办 / 周边盲盒", searchQuery: "限量手办 盲盒", priceMin: 70, priceMax: 130, priceTypical: 79, priceLabel: "¥70–130", emoji: "🗿",
    tags: ["手办","周边","二次元","收藏","盲盒"],
    personas: ["IALW","EMRW","IARW","IMLW"],
    relations: ["lover","friend","crush"],
    reason: "TA 的桌面博物馆，又多一件镇馆之宝。" },
  { name: "像素风 LED 桌面摆件", searchQuery: "像素 LED 桌面摆件", priceMin: 120, priceMax: 400, priceTypical: 159, priceLabel: "¥120–400", emoji: "🕹️",
    tags: ["桌面","摆件","像素","赛博","灯"],
    personas: ["IALW","EMRW","IARW"],
    relations: ["friend","colleague","crush","lover"],
    reason: "TA 桌面那点赛博气息，全靠这种小物件撑起来。" },

  // ===== 古典/传统 =====
  { name: "苏绣团扇礼盒", searchQuery: "苏绣团扇 礼盒", priceMin: 10, priceMax: 30, priceTypical: 20, priceLabel: "¥10–30", emoji: "🪭",
    tags: ["传统","手工","收藏","送长辈","古典"],
    personas: ["IARS","EARS","IALS","IMRS"],
    relations: ["family","lover","colleague"],
    reason: "TA 欣赏的是真正经得起时间放慢看的东西。" },
  { name: "古籍复刻精装本", searchQuery: "古籍复刻 精装", priceMin: 80, priceMax: 400, priceTypical: 180, priceLabel: "¥80–400", emoji: "📜",
    tags: ["书","古籍","收藏","文艺","传统"],
    personas: ["IARS","IMLW","IALS"],
    relations: ["family","friend","colleague"],
    reason: "TA 翻它的样子，本身就是一幅画。" },
  { name: "宜兴紫砂入门茶具", searchQuery: "紫砂茶具 入门", priceMin: 50, priceMax: 270, priceTypical: 165, priceLabel: "¥50–270", emoji: "🫖",
    tags: ["茶","紫砂","传统","居家","送长辈"],
    personas: ["IARS","EARS","IALS","IMRS"],
    relations: ["family","colleague","lover"],
    reason: "一套能用十年的东西，比一时的新奇更接近 TA 的口味。" },

  // ===== 神秘/小众/夜 =====
  { name: "塔罗牌精装礼盒", searchQuery: "塔罗牌 精装", priceMin: 80, priceMax: 180, priceTypical: 111, priceLabel: "¥80–180", emoji: "🔮",
    tags: ["塔罗","神秘","占卜","小众"],
    personas: ["IARW","IALW","IMLW","EALW"],
    relations: ["friend","crush","lover"],
    reason: "TA 不一定真信，但 TA 一定喜欢摊牌时的氛围感。" },
  { name: "天文望远镜入门款", searchQuery: "天文望远镜 入门", priceMin: 500, priceMax: 1200, priceTypical: 999, priceLabel: "¥500–1200", emoji: "🔭",
    tags: ["天文","星空","小众","户外","夜晚"],
    personas: ["IARW","IALW","EMRW","IMRW"],
    relations: ["lover","friend","family","crush"],
    reason: "下一次约 TA，不在咖啡馆而在天台。" },
  { name: "DIY 调香材料盒（精油 + 香基）", searchQuery: "DIY调香 精油材料包", priceMin: 15, priceMax: 60, priceTypical: 25, priceLabel: "¥15–60", emoji: "🌿",
    tags: ["香","实验","小众","DIY","气味"],
    personas: ["IARW","EALS","IALS","EALW"],
    relations: ["lover","friend","crush"],
    reason: "TA 喜欢的东西，从来不是货架上能直接找到的——亲手调一瓶。" },

  // ===== 万能补位（覆盖低预算/通用） =====
  { name: "精致手写感贺卡 + 鲜花单束", searchQuery: "鲜花贺卡 礼盒", priceMin: 10, priceMax: 40, priceTypical: 20, priceLabel: "¥10–40", emoji: "🌹",
    tags: ["鲜花","贺卡","治愈","心意"],
    personas: ["IMLS","EARS","EALS","IALS","IMLW"],
    relations: ["lover","crush","friend","family","colleague"],
    reason: "金额不大，但'你今天被人放在心上'这件事价值最大。" },
  { name: "联名设计师笔记本", searchQuery: "设计师 笔记本", priceMin: 20, priceMax: 60, priceTypical: 30, priceLabel: "¥20–60", emoji: "📓",
    tags: ["笔记本","书写","设计","文艺"],
    personas: ["IMLW","IMRS","EALW","IARS","EARS"],
    relations: ["friend","colleague","crush","lover"],
    reason: "TA 写下的下一段重要的事，希望发生在你送的本子里。" },
  { name: "星巴克实体礼品卡", searchQuery: "星巴克 实体礼品卡", priceMin: 95, priceMax: 195, priceTypical: 100, priceLabel: "¥95–195", emoji: "☕",
    tags: ["咖啡","下午茶","通勤","治愈"],
    personas: ["IMLS","IMRS","EMRS","IALS","IMLW","EALS"],
    relations: ["colleague","friend","crush"],
    reason: "得体、不越界、又能让 TA 想起你三五次。" },

  // ===== 100 元以下补充 =====
  { name: "手工香薰小蜡烛", searchQuery: "手工香薰蜡烛", priceMin: 60, priceMax: 160, priceTypical: 89, priceLabel: "¥60–160", emoji: "🕯️",
    tags: ["香薰","焦虑","助眠","治愈","居家"],
    personas: ["IMLS","IALS","IMLW","EALS","IARS"],
    relations: ["lover","friend","colleague","family","crush"],
    reason: "深夜点一枚，帮 TA 把一整天的紧绷轻轻化掉。" },
  { name: "云朵棉眼罩（热敷款）", searchQuery: "蒸汽眼罩 热敷", priceMin: 30, priceMax: 80, priceTypical: 50, priceLabel: "¥30–80", emoji: "😴",
    tags: ["助眠","眼罩","倒班","加班","治愈","劳累"],
    personas: ["IMLS","IMRS","IMLW","IALS","IARS"],
    relations: ["family","colleague","friend","lover"],
    reason: "TA 嘴上不说累，但你知道 TA 揉过眼睛到深夜几点。" },
  { name: "手冲单品咖啡豆 250g", searchQuery: "单品咖啡豆 250g", priceMin: 40, priceMax: 100, priceTypical: 55, priceLabel: "¥40–100", emoji: "☕",
    tags: ["咖啡","手冲","早餐","品质","生活"],
    personas: ["IMRS","EMRS","IMLW","IARS","EARS","IALS"],
    relations: ["colleague","friend","family","lover"],
    reason: "不是贵礼物，但 TA 每个早上都会谢你一次。" },
  { name: "口袋打卡小本 · 一年交换", searchQuery: "口袋本 交换日记", priceMin: 20, priceMax: 60, priceTypical: 35, priceLabel: "¥20–60", emoji: "📒",
    tags: ["记录","交换日记","仪式感","手写","文艺"],
    personas: ["IMLW","IMRS","EALS","IARS","EARS","IALS"],
    relations: ["lover","crush","friend","family"],
    reason: "送 TA 一整年都会拿出来用的东西，比一次性贵礼更走心。" },
  { name: "美术馆明信片套装（6 张）", searchQuery: "美术馆 明信片套装", priceMin: 10, priceMax: 70, priceTypical: 25, priceLabel: "¥10–70", emoji: "💌",
    tags: ["明信片","小众","文艺","小东西","走心"],
    personas: ["IMLW","IALW","EALW","IARW","EARS"],
    relations: ["crush","friend","lover"],
    reason: "金额轻、心意重，适合「还不太熟但想送点什么」的那一刻。" },
  { name: "治愈系梦幻夜灯", searchQuery: "治愈系夜灯 摆件", priceMin: 20, priceMax: 90, priceTypical: 50, priceLabel: "¥20–90", emoji: "💡",
    tags: ["夜灯","治愈","居家","可爱","摆件"],
    personas: ["IMLS","IMRW","IALS","IALW","EMRW"],
    relations: ["lover","friend","crush","family"],
    reason: "不是必需品，但 TA 每晚拍照都会提起你。" }
];
