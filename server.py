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


@app.post("/api/letter")
async def generate_letter(req: Request):
    try:
        payload = await req.json()
    except Exception:
        return JSONResponse({"ok": False, "error": "invalid_json"}, status_code=400)

    gift_name = (payload.get("gift_name") or "").strip()
    persona_name = (payload.get("persona_name") or "").strip()
    relation = (payload.get("relation") or "").strip()
    open_text = (payload.get("open_text") or "").strip()
    echo_words = payload.get("echo_words") or []
    reason = (payload.get("reason") or "").strip()

    if not gift_name:
        return JSONResponse({"ok": False, "error": "missing_gift"}, status_code=400)

    echo_str = "、".join(echo_words[:4]) if isinstance(echo_words, list) else ""

    prompt = f"""你是一位文案大师,专门为送礼的人写卡片留言。请基于以下信息,写 2 段中文短文案:

【送礼场景】
- 收礼者关系:{relation or "朋友"}
- 收礼者画像:{persona_name or "未知"}
- 礼物:{gift_name}
- 选这件礼的理由:{reason or "(无)"}
- 送礼人提到的 TA 近况关键词:{echo_str or "(无)"}
- 送礼人写的近况描述:{open_text or "(无)"}

【要求】
1. 输出严格的 JSON 格式,不要任何解释或代码块标记,直接以 {{ 开头
2. 输出结构:
{{
  "warm": "温暖款留言,1-2 句,真挚不肉麻",
  "witty": "俏皮款留言,1-2 句,有梗有点小调皮"
}}
3. 每段 25-45 字之间,可以用「你」称呼对方
4. 必须自然融入「{gift_name}」这件礼物
5. 如果近况关键词里出现 TA 的烦恼(加班/失眠/颈椎等),留言要呼应那个情绪
6. 不要写「亲爱的」「祝你」这种空泛开头,也不要落款
7. 输出必须是合法 JSON
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
