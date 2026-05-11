// ============================================================
// 礼物侦探事务所 · 专有名词识别库
// ============================================================
// 用于识别用户在开放题里提到的「具体 IP / 品牌 / 品种」，
// 生成直达搜索的动态礼物卡片。
//
// 每个条目：
//   names: 可能的别名/缩写（全小写匹配）
//   canonical: 归一名（卡片标题用）
//   kind: "acg" 动漫游戏IP | "platform" 游戏平台 | "brand" 品牌
//        | "coffee" 咖啡豆 | "tea" 茶品种 | "book" 作家/书 | "music" 艺人
// ============================================================

const ENTITY_LIBRARY = [
  // ===== 动漫 / 游戏 IP =====
  { names: ["鬼灭之刃","鬼灭","kimetsu"], canonical: "鬼灭之刃", kind: "acg" },
  { names: ["咒术回战","咒术"], canonical: "咒术回战", kind: "acg" },
  { names: ["间谍过家家","spy family"], canonical: "间谍过家家", kind: "acg" },
  { names: ["进击的巨人","巨人"], canonical: "进击的巨人", kind: "acg" },
  { names: ["海贼王","one piece"], canonical: "海贼王", kind: "acg" },
  { names: ["火影忍者","火影","naruto"], canonical: "火影忍者", kind: "acg" },
  { names: ["jojo","jojo的奇妙冒险"], canonical: "JOJO", kind: "acg" },
  { names: ["银魂"], canonical: "银魂", kind: "acg" },
  { names: ["名侦探柯南","柯南"], canonical: "名侦探柯南", kind: "acg" },
  { names: ["哆啦a梦","哆啦梦","机器猫"], canonical: "哆啦A梦", kind: "acg" },
  { names: ["宝可梦","pokemon","皮卡丘"], canonical: "宝可梦", kind: "acg" },
  { names: ["千与千寻","龙猫","宫崎骏","吉卜力","魔女宅急便"], canonical: "吉卜力", kind: "acg" },
  { names: ["chiikawa","吉伊卡瓦"], canonical: "Chiikawa", kind: "acg" },
  { names: ["loopy","露皮"], canonical: "Loopy", kind: "acg" },
  { names: ["三丽鸥","sanrio","库洛米","肉桂狗","大耳狗","美乐蒂","酷洛米"], canonical: "三丽鸥", kind: "acg" },
  { names: ["jellycat","杰利猫"], canonical: "Jellycat", kind: "acg" },
  { names: ["迪士尼","disney","米奇","米妮","唐老鸭","小熊维尼"], canonical: "迪士尼", kind: "acg" },
  { names: ["高达","gundam"], canonical: "高达", kind: "acg" },
  { names: ["奥特曼"], canonical: "奥特曼", kind: "acg" },
  { names: ["蜡笔小新"], canonical: "蜡笔小新", kind: "acg" },
  { names: ["哈利波特","harry potter"], canonical: "哈利波特", kind: "acg" },
  // 潮玩 / 谷子 IP
  { names: ["labubu"], canonical: "LABUBU", kind: "acg" },
  { names: ["molly"], canonical: "MOLLY", kind: "acg" },
  { names: ["crybaby"], canonical: "CRYBABY", kind: "acg" },
  { names: ["sonny angel"], canonical: "Sonny Angel", kind: "acg" },
  { names: ["line friends","布朗熊","可妮兔"], canonical: "Line Friends", kind: "acg" },
  // 游戏 IP
  { names: ["原神","genshin"], canonical: "原神", kind: "acg" },
  { names: ["崩坏星穹铁道","崩铁"], canonical: "崩坏星穹铁道", kind: "acg" },
  { names: ["王者荣耀","王者"], canonical: "王者荣耀", kind: "acg" },
  { names: ["和平精英","吃鸡"], canonical: "和平精英", kind: "acg" },
  { names: ["明日方舟"], canonical: "明日方舟", kind: "acg" },
  { names: ["恋与深空","恋与制作人","乙游"], canonical: "恋与深空", kind: "acg" },
  { names: ["鸣潮"], canonical: "鸣潮", kind: "acg" },
  { names: ["剑网3","剑三","jx3"], canonical: "剑网3", kind: "acg" },
  { names: ["英雄联盟","lol"], canonical: "英雄联盟", kind: "acg" },
  { names: ["奇迹暖暖","暖暖"], canonical: "奇迹暖暖", kind: "acg" },
  { names: ["塞尔达","zelda","旷野之息","王国之泪"], canonical: "塞尔达", kind: "acg" },
  { names: ["马里奥","mario"], canonical: "马里奥", kind: "acg" },
  { names: ["动物森友会","动森"], canonical: "动物森友会", kind: "acg" },

  // ===== 游戏平台 =====
  { names: ["switch","ns"], canonical: "Nintendo Switch", kind: "platform" },
  { names: ["ps5","ps4","playstation"], canonical: "PlayStation", kind: "platform" },
  { names: ["xbox"], canonical: "Xbox", kind: "platform" },
  { names: ["steam deck"], canonical: "Steam Deck", kind: "platform" },
  { names: ["steam"], canonical: "Steam", kind: "platform" },

  // ===== 品牌 =====
  { names: ["lululemon","露露柠檬"], canonical: "lululemon", kind: "brand" },
  { names: ["aesop","伊索"], canonical: "Aesop", kind: "brand" },
  { names: ["diptyque","蒂普提克"], canonical: "Diptyque", kind: "brand" },
  { names: ["jo malone","祖马龙"], canonical: "Jo Malone", kind: "brand" },
  { names: ["戴森","dyson"], canonical: "戴森", kind: "brand" },
  { names: ["apple","苹果","iphone","ipad","macbook","airpods"], canonical: "Apple", kind: "brand" },
  { names: ["始祖鸟","arcteryx"], canonical: "始祖鸟", kind: "brand" },
  { names: ["patagonia","巴塔哥尼亚"], canonical: "Patagonia", kind: "brand" },
  { names: ["snow peak","雪诺必克"], canonical: "Snow Peak", kind: "brand" },
  { names: ["stanley","史丹利"], canonical: "Stanley", kind: "brand" },
  { names: ["小米","xiaomi"], canonical: "小米", kind: "brand" },
  { names: ["华为","huawei"], canonical: "华为", kind: "brand" },
  { names: ["muji","无印良品"], canonical: "无印良品", kind: "brand" },
  { names: ["宜家","ikea"], canonical: "宜家", kind: "brand" },
  { names: ["hario"], canonical: "Hario", kind: "brand" },
  { names: ["bialetti","摩卡壶"], canonical: "Bialetti", kind: "brand" },
  { names: ["%arabica","arabica"], canonical: "%Arabica", kind: "brand" },
  { names: ["manner"], canonical: "Manner", kind: "brand" },
  { names: ["瑞幸","luckin"], canonical: "瑞幸", kind: "brand" },
  { names: ["星巴克","starbucks"], canonical: "星巴克", kind: "brand" },
  { names: ["lego","乐高"], canonical: "乐高", kind: "brand" },
  { names: ["polaroid","宝丽来"], canonical: "Polaroid", kind: "brand" },
  { names: ["德龙","delonghi"], canonical: "德龙", kind: "brand" },
  { names: ["rimowa","日默瓦"], canonical: "Rimowa", kind: "brand" },
  { names: ["on昂跑","昂跑"], canonical: "On 昂跑", kind: "brand" },
  { names: ["nike","耐克"], canonical: "Nike", kind: "brand" },
  { names: ["adidas","阿迪达斯"], canonical: "adidas", kind: "brand" },
  { names: ["new balance","纽巴伦","nb"], canonical: "New Balance", kind: "brand" },
  { names: ["uniqlo","优衣库"], canonical: "优衣库", kind: "brand" },
  { names: ["北面","the north face","tnf"], canonical: "The North Face", kind: "brand" },
  { names: ["哈根达斯","haagen"], canonical: "哈根达斯", kind: "brand" },
  { names: ["chanel","香奈儿"], canonical: "Chanel", kind: "brand" },
  { names: ["lv","路易威登","louis vuitton"], canonical: "LV", kind: "brand" },
  { names: ["gucci","古驰"], canonical: "Gucci", kind: "brand" },
  { names: ["lamy","凌美"], canonical: "LAMY", kind: "brand" },
  { names: ["midori"], canonical: "MIDORI", kind: "brand" },

  // ===== 咖啡豆 / 品种 =====
  { names: ["瑰夏","geisha"], canonical: "瑰夏", kind: "coffee" },
  { names: ["耶加雪菲","yirgacheffe"], canonical: "耶加雪菲", kind: "coffee" },
  { names: ["肯尼亚aa","肯尼亚"], canonical: "肯尼亚 AA", kind: "coffee" },
  { names: ["哥伦比亚","哥伦比亚咖啡"], canonical: "哥伦比亚", kind: "coffee" },
  { names: ["蓝山","牙买加咖啡"], canonical: "蓝山", kind: "coffee" },
  { names: ["云南小粒","云南咖啡"], canonical: "云南小粒", kind: "coffee" },
  { names: ["巴拿马","花蝴蝶"], canonical: "巴拿马", kind: "coffee" },
  { names: ["危地马拉"], canonical: "危地马拉", kind: "coffee" },

  // ===== 茶 =====
  { names: ["龙井"], canonical: "龙井", kind: "tea" },
  { names: ["普洱","生普","熟普"], canonical: "普洱", kind: "tea" },
  { names: ["大红袍"], canonical: "大红袍", kind: "tea" },
  { names: ["金骏眉"], canonical: "金骏眉", kind: "tea" },
  { names: ["白茶","寿眉","白牡丹"], canonical: "白茶", kind: "tea" },
  { names: ["铁观音"], canonical: "铁观音", kind: "tea" },
  { names: ["碧螺春"], canonical: "碧螺春", kind: "tea" },
  { names: ["凤凰单丛","单丛"], canonical: "凤凰单丛", kind: "tea" },

  // ===== 作家 / 书 =====
  { names: ["村上春树"], canonical: "村上春树", kind: "book" },
  { names: ["东野圭吾"], canonical: "东野圭吾", kind: "book" },
  { names: ["余华"], canonical: "余华", kind: "book" },
  { names: ["三体","刘慈欣"], canonical: "三体", kind: "book" },
  { names: ["原子习惯"], canonical: "《原子习惯》", kind: "book" },
  { names: ["蛤蟆先生"], canonical: "《蛤蟆先生去看心理医生》", kind: "book" },
  { names: ["人间游戏"], canonical: "《人间游戏》", kind: "book" },
  { names: ["明朝那些事"], canonical: "《明朝那些事儿》", kind: "book" },
  { names: ["史铁生"], canonical: "史铁生", kind: "book" },
  { names: ["王小波"], canonical: "王小波", kind: "book" },

  // ===== 音乐人 =====
  { names: ["taylor swift","霉霉","霉公主","taylor"], canonical: "Taylor Swift", kind: "music" },
  { names: ["五月天","mayday"], canonical: "五月天", kind: "music" },
  { names: ["周杰伦","jay chou"], canonical: "周杰伦", kind: "music" },
  { names: ["林俊杰","jj"], canonical: "林俊杰", kind: "music" },
  { names: ["陶喆","陶哥"], canonical: "陶喆", kind: "music" },
  { names: ["薛之谦"], canonical: "薛之谦", kind: "music" },
  { names: ["毛不易"], canonical: "毛不易", kind: "music" },
  { names: ["黄霄雲","黄龄"], canonical: "黄龄", kind: "music" },
  { names: ["告五人"], canonical: "告五人", kind: "music" },
  { names: ["万能青年旅店","万青"], canonical: "万能青年旅店", kind: "music" },
  { names: ["newjeans"], canonical: "NewJeans", kind: "music" },
  { names: ["blackpink"], canonical: "BLACKPINK", kind: "music" },
  { names: ["bts","防弹"], canonical: "BTS", kind: "music" },
  { names: ["aespa"], canonical: "aespa", kind: "music" },
  { names: ["coldplay","酷玩"], canonical: "Coldplay", kind: "music" }
];

// 根据类别生成卡片资讯：emoji、搜索词、礼物名、说明
function makeEntityCard(entity, budgetLabel) {
  const k = entity.kind;
  const c = entity.canonical;
  let emoji = "🎁", subtitle = "", tbQuery = c, jdQuery = c, reason = "";
  if (k === "acg") {
    emoji = "🗿"; subtitle = "手办 / 周边 / 吧唧";
    tbQuery = `${c} 手办 周边`;
    jdQuery = `${c} 谷子 周边`;
    reason = `TA 提到「${c}」——直接搜 TA 最爱的手办 / 周边 / 吧唧。`;
  } else if (k === "platform") {
    emoji = "🎮"; subtitle = "游戏 / 礼品卡";
    tbQuery = `${c} 礼品卡 游戏`;
    jdQuery = `${c} 游戏 充值卡`;
    reason = `TA 玩 ${c}——送一份 TA 能立刻打开的游戏或卡。`;
  } else if (k === "brand") {
    emoji = "🛍️"; subtitle = "品牌专区";
    tbQuery = `${c} 礼盒`;
    jdQuery = `${c} 旗舰店`;
    reason = `TA 认「${c}」这个牌——不必猜，直接在这家挑就行。`;
  } else if (k === "coffee") {
    emoji = "☕"; subtitle = "单品咖啡豆";
    tbQuery = `${c} 精品咖啡豆`;
    jdQuery = `${c} 咖啡豆`;
    reason = `TA 在喝「${c}」——直接搜这个产地的咖啡豆。`;
  } else if (k === "tea") {
    emoji = "🍵"; subtitle = "茶叶礼盒";
    tbQuery = `${c} 茶叶 礼盒`;
    jdQuery = `${c} 礼盒`;
    reason = `TA 喝「${c}」——挑一份带得出手的礼盒。`;
  } else if (k === "book") {
    emoji = "📚"; subtitle = "作家精装 / 全集";
    tbQuery = `${c} 精装 书`;
    jdQuery = `${c} 精装合集`;
    reason = `TA 看「${c}」——送一本 TA 还没买的精装本。`;
  } else if (k === "music") {
    emoji = "🎤"; subtitle = "专辑 / 周边";
    tbQuery = `${c} 周边 专辑`;
    jdQuery = `${c} 周边`;
    reason = `TA 是「${c}」的粉丝——送点 TA 的"本命"。`;
  }
  return {
    name: `${c} · ${subtitle}`,
    emoji,
    price: budgetLabel,        // 动态卡片不显示具体价，显示预算区间
    isDynamic: true,
    canonical: c,
    kind: k,
    searchQuery: tbQuery,       // 兼容：用 searchQuery 作为默认搜索词
    tbQuery,
    jdQuery,
    reason
  };
}

// 从开放题原文里抽取专有名词（最多返 cap 个，去重）
function extractEntities(openText, cap = 2) {
  const text = (openText || "").toLowerCase();
  if (!text.trim()) return [];
  const matches = [];
  const seen = new Set();
  // 先按 name 长度倒序，让"鬼灭之刃"优先于"鬼灭"匹配
  const all = ENTITY_LIBRARY.flatMap(ent =>
    ent.names.map(n => ({ name: n.toLowerCase(), ent }))
  ).sort((a, b) => b.name.length - a.name.length);
  for (const item of all) {
    if (text.includes(item.name)) {
      if (!seen.has(item.ent.canonical)) {
        seen.add(item.ent.canonical);
        matches.push(item.ent);
        if (matches.length >= cap) break;
      }
    }
  }
  return matches;
}
