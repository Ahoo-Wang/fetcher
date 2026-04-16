#!/usr/bin/env python3
"""
Sequential trigger evaluation script using claude -p.
Uses TMPDIR for command files to avoid sandbox restrictions.
"""

import json
import os
import select
import subprocess
import sys
import time
import uuid
import tempfile
from pathlib import Path
from datetime import datetime, timezone


def find_project_root() -> Path:
    """Find project root by walking up for .claude/."""
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return current


def run_single_query(
    query: str,
    skill_name: str,
    skill_description: str,
    timeout: int,
    project_root: Path,
) -> tuple[bool, float, int]:
    """Run a single query and return (triggered, duration, tokens)."""
    unique_id = uuid.uuid4().hex[:8]
    clean_name = f"{skill_name}-skill-{unique_id}"

    # Use TMPDIR for command file to avoid sandbox restrictions
    tmpdir = Path(os.environ.get('TMPDIR', '/tmp'))
    commands_dir = tmpdir / "claude-commands"
    commands_dir.mkdir(exist_ok=True)
    command_file = commands_dir / f"{clean_name}.md"

    try:
        indented_desc = "\n  ".join(skill_description.split("\n"))
        command_content = (
            f"---\n"
            f"description: |\n"
            f"  {indented_desc}\n"
            f"---\n\n"
            f"# {skill_name}\n\n"
            f"This skill handles: {skill_description}\n"
        )
        command_file.write_text(command_content)

        cmd = [
            "claude", "-p", query,
            "--output-format", "stream-json",
            "--include-partial-messages",
        ]

        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

        start_time = time.time()
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(project_root),
            env=env,
        )

        triggered = False
        pending_tool_name = None
        accumulated_json = ""

        try:
            while time.time() - start_time < timeout:
                if process.poll() is not None:
                    break

                ready, _, _ = select.select([process.stdout], [], [], 1.0)
                if not ready:
                    continue

                chunk = os.read(process.stdout.fileno(), 8192)
                if not chunk:
                    break

                buffer = chunk.decode("utf-8", errors="replace")
                for line in buffer.split("\n"):
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    if event.get("type") == "stream_event":
                        se = event.get("event", {})
                        se_type = se.get("type", "")

                        if se_type == "content_block_start":
                            cb = se.get("content_block", {})
                            if cb.get("type") == "tool_use":
                                tool_name = cb.get("name", "")
                                if tool_name in ("Skill", "Read"):
                                    pending_tool_name = tool_name
                                    accumulated_json = ""

                        elif se_type == "content_block_delta" and pending_tool_name:
                            delta = se.get("delta", {})
                            if delta.get("type") == "input_json_delta":
                                accumulated_json += delta.get("partial_json", "")
                                if clean_name in accumulated_json:
                                    triggered = True

                        elif se_type in ("content_block_stop", "message_stop"):
                            if pending_tool_name and clean_name in accumulated_json:
                                triggered = True
                            pending_tool_name = None
                            if se_type == "message_stop":
                                break

                    elif event.get("type") == "assistant":
                        message = event.get("message", {})
                        for content_item in message.get("content", []):
                            if content_item.get("type") != "tool_use":
                                continue
                            tool_name = content_item.get("name", "")
                            tool_input = content_item.get("input", {})
                            if tool_name == "Skill" and clean_name in tool_input.get("skill", ""):
                                triggered = True
                            elif tool_name == "Read" and clean_name in tool_input.get("file_path", ""):
                                triggered = True

                    elif event.get("type") == "result":
                        break

        finally:
            if process.poll() is None:
                process.kill()
                process.wait()

        duration = time.time() - start_time
        return triggered, duration, 0

    finally:
        if command_file.exists():
            command_file.unlink()


def main():
    if len(sys.argv) != 3:
        print("Usage: python run_trigger_eval.py <skill_path> <trigger_evals_json>")
        sys.exit(1)

    skill_path = Path(sys.argv[1])
    trigger_evals_file = Path(sys.argv[2])
    project_root = find_project_root()

    # Parse skill description
    skill_md = (skill_path / "SKILL.md").read_text()
    lines = skill_md.split("\n")
    description = ""
    in_frontmatter = False
    for line in lines:
        if line.strip() == "---":
            if not in_frontmatter:
                in_frontmatter = True
                continue
            else:
                break
        if in_frontmatter and line.startswith("description:"):
            description = line[len("description:"):].strip().strip('"').strip("'")
            break

    skill_name = skill_path.name

    # Load trigger evals
    trigger_evals = json.loads(trigger_evals_file.read_text())

    print(f"Evaluating skill: {skill_name}")
    print(f"Description: {description[:100]}...")
    print(f"Queries: {len(trigger_evals)}")
    print()

    results = []
    for i, item in enumerate(trigger_evals):
        query = item["query"]
        should_trigger = item.get("should_trigger", True)

        print(f"[{i+1}/{len(trigger_evals)}] Running query: {query[:60]}...")

        triggered, duration, tokens = run_single_query(
            query=query,
            skill_name=skill_name,
            skill_description=description,
            timeout=60,
            project_root=project_root,
        )

        passed = triggered == should_trigger
        print(f"  Triggered: {triggered}, Expected: {should_trigger}, Pass: {passed}, Duration: {duration:.1f}s")

        results.append({
            "query": query,
            "should_trigger": should_trigger,
            "triggered": triggered,
            "trigger_rate": 1.0 if triggered else 0.0,
            "triggers": 1 if triggered else 0,
            "runs": 1,
            "pass": passed,
            "duration": duration,
        })

    passed_count = sum(1 for r in results if r["pass"])
    print()
    print(f"Results: {passed_count}/{len(results)} passed")

    # Save results
    output = {
        "skill_name": skill_name,
        "description": description,
        "results": results,
        "summary": {
            "total": len(results),
            "passed": passed_count,
            "failed": len(results) - passed_count,
        },
    }

    output_file = Path(__file__).parent / "trigger_eval_results.json"
    output_file.write_text(json.dumps(output, indent=2))
    print(f"Saved to: {output_file}")


if __name__ == "__main__":
    main()
