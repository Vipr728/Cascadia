import json
import os
import sys
from typing import Any, Dict

try:
    # AG2 / AutoGen
    from autogen import ConversableAgent, LLMConfig
except Exception as e:
    sys.stderr.write(
        "Failed to import AG2 (autogen). Ensure you ran 'pip install -r agents/requirements.txt' and have Python available.\n"
    )
    raise


def build_agent() -> ConversableAgent:
    # Configure LLM via environment variables
    # OPENAI_API_KEY required when api_type="openai"
    api_type = os.environ.get("AG2_API_TYPE", "openai")
    model = os.environ.get("AG2_MODEL", os.environ.get("OPENAI_MODEL", "gpt-4o-mini"))

    llm_config = LLMConfig(api_type=api_type, model=model, api_key=os.environ.get("OPENAI_API_KEY"))

    system_message = (
        "You are a precise multilingual language reviewer for language learning. Given a conversation transcript, "
        "identify only the learner's weaknesses that would most improve language ability. Return STRICT JSON ONLY with this exact schema: "
        "{\n  \"weaknesses\": [\n    {\n      \"severity\": \"critical|moderate|minor\",\n      \"title\": string,\n      \"description\": string,\n      \"focus\": string\n    }\n  ]\n}. "
        "Rules: (1) No extra keys, no trailing commentary. (2) Severity must be one of critical, moderate, minor. (3) Title is short (<= 6 words). "
        "(4) Description is concise and specific to the transcript. (5) Focus is a brief learning focus to improve this weakness."
    )

    agent = ConversableAgent(
        name="language_analysis_agent",
        system_message=system_message,
        llm_config=llm_config,
    )
    return agent


def make_prompt(transcript: str, language: str | None) -> str:
    lang_hint = f"Language: {language}." if language else "Language: auto-detect."
    return (
        f"{lang_hint}\n"
        "Task: From the transcript below, extract only learner weaknesses for language learning. "
        "Output STRICT JSON matching the schema described previously (no extra keys). "
        "Aim for 3-8 weaknesses total.\n\n"
        "Transcript:\n" + transcript
    )


def read_input() -> Dict[str, Any]:
    # Accept JSON via stdin
    try:
        raw = sys.stdin.read()
        if not raw:
            return {}
        return json.loads(raw)
    except Exception:
        return {}


def main() -> None:
    payload = read_input()
    transcript = payload.get("transcript", "").strip()
    language = payload.get("language")

    if not transcript:
        print(json.dumps({
            "error": "Missing 'transcript'",
        }))
        return

    agent = build_agent()
    prompt = make_prompt(transcript, language)

    try:
        response = agent.send_message(prompt)
        content = getattr(response, "content", None) or str(response)

        # Parse model output to expected schema
        parsed: Dict[str, Any]
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {}

        # Normalize to expected shape: { weaknesses: [ {severity,title,description,focus} ] }
        weaknesses: Any = parsed.get("weaknesses") if isinstance(parsed, dict) else None

        def coerce_item(item: Dict[str, Any]) -> Dict[str, str]:
            severity_raw = str(item.get("severity", "moderate")).lower().strip()
            severity = severity_raw if severity_raw in {"critical", "moderate", "minor"} else "moderate"
            title = str(item.get("title", "General weakness")).strip()
            description = str(item.get("description", "Observed issue in the transcript.")).strip()
            focus = str(item.get("focus", "Practice targeted exercises to improve this area.")).strip()
            return {
                "severity": severity,
                "title": title,
                "description": description,
                "focus": focus,
            }

        normalized: Dict[str, Any]
        if isinstance(weaknesses, list) and weaknesses:
            normalized_list = [coerce_item(w) for w in weaknesses if isinstance(w, dict)]
            normalized = {"weaknesses": normalized_list}
        else:
            # Fallback: map from prior schema if present
            fallback_items: list[Dict[str, Any]] = []
            if isinstance(parsed, dict):
                issues = parsed.get("issues")
                if isinstance(issues, list) and issues:
                    for it in issues:
                        if not isinstance(it, dict):
                            continue
                        t = str(it.get("type", "Weakness")).strip()
                        txt = str(it.get("text", "")).strip()
                        sug = str(it.get("suggestion", "")).strip()
                        title = t if len(t) <= 40 else t[:37] + "..."
                        description = txt or t
                        focus = sug or "Targeted drills and spaced repetition."
                        fallback_items.append(coerce_item({
                            "severity": "moderate",
                            "title": title or "Weakness",
                            "description": description,
                            "focus": focus,
                        }))
            if not fallback_items:
                # Last resort: provide an empty list, but include raw for debugging
                normalized = {"weaknesses": []}
            else:
                normalized = {"weaknesses": fallback_items}

        print(json.dumps(normalized, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            "error": "AG2 agent failed",
            "details": str(e),
        }))


if __name__ == "__main__":
    main()



