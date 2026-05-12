"""礼物侦探事务所 · FastAPI 后端
仅一个职责:接 LLM 生成「送礼卡片留言」。
其余前端文件均为静态资源。
"""
import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from anthropic import Anthropic

app = FastAPI()

# --- LLM client ---
_anthropic = Anthropic()
MODEL = "claude_sonnet_4_6"

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))


# 礼物动作类别 → 描述这件礼物在生活里"怎么被使用、会触发什么画面"
# 用于给 LLM 提示,让留言围绕礼物本身的动作/意象而不是只塞礼物名
ACT_HINTS = {
    "writing":  '"写下"、"落笔"、"记录"、一页页纸、一句在意的话',
    "shoot":    '"拍下"、"按下快门"、记住某个瞬间、镜头里那个人',
    "drink":    '"冲/煮/点一杯"、一天中那几分钟的慢、醒来/加班/受挫时的那一口',
    "scent":    '"点上"、"喷上"、屋里的气息、被味道记住的那一瞬',
    "music":    '"戴上"、"听一首"、在高铁上/夜里/加班时被音乐抱一下',
    "tech":     '桌面多一件趁手的装备、"打开它去做喜欢的事"',
    "read":     '"读到某一句"、一本书里那个刚好需要的句子',
    "wear":     '"戴上/穿上/围上"、出门那天多一件"撑场面"的东西',
    "outdoor":  '"带上它出门/上路/动起来"、下一个周末的路',
    "care":     '"用它五分钟/泡一泡/踏一踏"、身体这件被拖太久的事',
    "comfort":  '"抱着它发呆"、"点着夜灯睡一觉"、一个人住的夜',
    "play":     '"拆包装/拼一拼/打一场"、成年人也需要玩一下',
    "kitchen":  '"为自己做一顿饭/烘一炉"、饭桌上那些心性的瘦点',
    "decor":    '"摆在哪里看一眼都喜欢"、屋里空间的呼吸',
    "memo":     '"装进去、留下来、以后翻出来看"、这一段值得被记住',
    "make":     '亲手做一件出来的成就感、手忙起来脑子就静了',
    "generic":  '',
}


@app.post("/api/letter")
async def generate_letter(req: Request):
    try:
        payload = await req.json()
    except Exception:
        return JSONResponse({"ok": False, "error": "invalid_json"}, status_code=400)

    gift_name = (payload.get("gift_name") or "").strip()
    gift_act = (payload.get("gift_act") or "generic").strip()
    persona_name = (payload.get("persona_name") or "").strip()
    relation = (payload.get("relation") or "").strip()
    open_text = (payload.get("open_text") or "").strip()
    echo_words = payload.get("echo_words") or []
    reason = (payload.get("reason") or "").strip()

    if not gift_name:
        return JSONResponse({"ok": False, "error": "missing_gift"}, status_code=400)

    echo_str = "、".join(echo_words[:4]) if isinstance(echo_words, list) else ""
    act_hint = ACT_HINTS.get(gift_act, "")
    act_hint_line = f"参考意象:{act_hint}" if act_hint else ""

    prompt = f"""你是一位贴心又带点烟火气的送礼卡文案人。请写 2 段中文短文案(温暖款 + 俏皮款),严格的 JSON 格式输出。

【送礼场景】
- 收礼者关系:{relation or "朋友"}
- 收礼者画像:{persona_name or "未知"}
- 礼物:{gift_name}
- 选这件礼的理由:{reason or "(无)"}
- 送礼人提到的 TA 近况关键词:{echo_str or "(无)"}
- 送礼人写的近况描述:{open_text or "(无)"}

【最重要的要求 — 留言必须和「这件礼物本身」挂钩】
不能只是把礼物名塞进一句话(比如"送你这件 X,希望你喜欢"),而要在句子里提到这件礼物【怎么被使用、会触发什么生活画面、为 TA 带来什么具体的体验】。
{act_hint_line}
正例(送钢笔):"送你这支钢笔,愿你用它写下的,都是让自己开心的字。" ← 提到了"写"这个动作和"开心的字"这个画面
正例(送香薰蜡烛):"点上它的那一会儿,屋里就多了一点只属于你的气息。" ← 提到了"点上"和"屋里的气息"
正例(送相机):"多拍一点,过几年翻照片,会感谢现在这个按快门的你。" ← 提到了"拍"和"翻照片"
反例(不要这样写):"送你这件 X,希望你喜欢。" / "祝你一切都好。" — 太空泛、和礼物没关系

【其他要求】
1. 输出严格 JSON,不加任何解释或代码块标记,以 {{ 开头
2. 结构:
{{
  "warm": "温暖款,1-2 句,真挚不肉麻,要能看出这件礼物会怎么出现在 TA 生活里",
  "witty": "俏皮款,1-2 句,可以拿礼物本身开点小玩笑"
}}
3. 每段 25-50 字,用「你」称呼
4. 如果近况关键词里有 TA 烦恼(加班/失眠/颈椎等),顺势呼应那个情绪
5. 不要写「亲爱的」「祝你」「愿你一切顺利」这种空话开头,也不要落款
6. 输出必须是合法 JSON
"""

    try:
        msg = _anthropic.messages.create(
            model=MODEL,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in msg.content if hasattr(b, "text")).strip()
        # 尝试解析 JSON
        import json, re
        # 去掉可能的 ```json 包裹
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        try:
            data = json.loads(text)
        except Exception:
            # 兜底:返回原文一句作为 warm,witty 留空
            data = {"warm": text[:80], "witty": ""}
        return JSONResponse({"ok": True, "warm": data.get("warm", ""), "witty": data.get("witty", "")})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:120]}, status_code=500)


# 静态资源:挂载 / 直接 serve 整个项目目录
# 用 html=True 让 / 自动返回 index.html
app.mount("/", StaticFiles(directory=PROJECT_DIR, html=True), name="static")
