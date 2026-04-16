#!/usr/bin/env python3
"""
Orchestration script for skill evaluation loop.
Runs evals with and without skill using claude -p, grades results,
aggregates benchmark, and generates static HTML.
"""

import argparse
import json
import os
import select
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

SKILL_CREATOR = Path("/Users/ahoo/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator/skills/skill-creator")
GRADER_PROMPT = SKILL_CREATOR / "agents/grader.md"
AGGREGATE_SCRIPT = SKILL_CREATOR / "scripts/aggregate_benchmark.py"
GENERATE_REVIEW_SCRIPT = SKILL_CREATOR / "eval-viewer/generate_review.py"


def find_project_root() -> Path:
    """Find project root by walking up for .claude/."""
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return current


def run_claude_prompt(
    query: str,
    project_root: Path,
    skill_path: Path | None = None,
    timeout: int = 120,
) -> tuple[str, float, int]:
    """Run a prompt via claude -p and return (output, duration_seconds, tokens)."""
    unique_id = uuid.uuid4().hex[:8]
    clean_name = f"eval-{unique_id}"
    project_commands_dir = project_root / ".claude" / "commands"
    command_file = project_commands_dir / f"{clean_name}.md"

    # Build skill description for with_skill runs
    if skill_path:
        skill_md = (skill_path / "SKILL.md").read_text()
        # Parse description from frontmatter
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

        indented_desc = "\n  ".join(skill_md.split("\n"))
        command_content = (
            f"---\n"
            f"description: |\n"
            f"  {indented_desc}\n"
            f"---\n\n"
            f"# {skill_path.name}\n\n"
            f"{skill_md}"
        )
        command_file.write_text(command_content)

    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    cmd = [
        "claude", "-p", query,
        "--output-format", "stream-json",
        "--verbose",
        "--include-partial-messages",
    ]

    start_time = time.time()
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(project_root),
        env=env,
    )

    output_lines = []
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
            output_lines.append(chunk.decode("utf-8", errors="replace"))
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()

    duration = time.time() - start_time
    full_output = "".join(output_lines)

    # Try to parse tokens from verbose output
    tokens = 0
    for line in full_output.split("\n"):
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
            if event.get("type") == "result":
                usage = event.get("usage", {})
                tokens = usage.get("output_tokens", 0) or usage.get("total_tokens", 0)
        except json.JSONDecodeError:
            continue

    # Cleanup command file
    if skill_path and command_file.exists():
        command_file.unlink()

    return full_output, duration, tokens


def grade_run(
    eval_id: int,
    eval_name: str,
    prompt: str,
    assertions: list[str],
    transcript_path: Path,
    outputs_dir: Path,
    project_root: Path,
) -> dict:
    """Use claude -p to grade the run outputs."""
    grader_prompt_path = GRADER_PROMPT
    grader_instructions = grader_prompt_path.read_text()

    grading_prompt = f"""You are the Grader Agent. Evaluate expectations against execution outputs.

## Inputs
- eval_id: {eval_id}
- eval_name: {eval_name}
- prompt: {prompt}
- assertions: {json.dumps(assertions, indent=2)}
- transcript_path: {transcript_path}
- outputs_dir: {outputs_dir}

## Grader Instructions
{grader_instructions}

## Task
Read the transcript at {transcript_path} and output files in {outputs_dir}, then produce a grading.json at {outputs_dir}/../grading.json

Produce the grading.json with this structure:
{{
  "expectations": [
    {{"text": "...", "passed": true/false, "evidence": "..."}}
  ],
  "summary": {{"passed": N, "failed": N, "total": N, "pass_rate": 0.0}},
  "execution_metrics": {{...}},
  "timing": {{...}},
  "claims": [...],
  "user_notes_summary": {{...}},
  "eval_feedback": {{"suggestions": [], "overall": "..."}}
}}

IMPORTANT: Save the grading.json to {outputs_dir}/../grading.json (sibling to outputs_dir).
"""

    cmd = [
        "claude", "-p", grading_prompt,
        "--output-format", "stream-json",
    ]

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        cwd=str(project_root),
        env={k: v for k, v in os.environ.items() if k != "CLAUDECODE"},
    )

    output = b""
    try:
        while process.poll() is None:
            ready, _, _ = select.select([process.stdout], [], [], 30.0)
            if ready:
                chunk = os.read(process.stdout.fileno(), 8192)
                if chunk:
                    output += chunk
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()

    return output.decode("utf-8", errors="replace")


def main():
    parser = argparse.ArgumentParser(description="Run skill evaluation loop")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--workspace", required=True, help="Workspace directory")
    parser.add_argument("--evals-file", required=True, help="Path to evals.json")
    parser.add_argument("--timeout", type=int, default=120, help="Timeout per eval in seconds")
    args = parser.parse_args()

    skill_path = Path(args.skill_path)
    workspace = Path(args.workspace)
    evals_file = Path(args.evals_file)
    project_root = find_project_root()

    # Load evals
    evals_data = json.loads(evals_file.read_text())
    evals = evals_data["evals"]
    skill_name = evals_data.get("skill_name", skill_path.name)

    print(f"Skill: {skill_name}")
    print(f"Workspace: {workspace}")
    print(f"Evals: {len(evals)}")

    # Process each eval
    all_runs = []
    for eval_item in evals:
        eval_id = eval_item["id"]
        prompt = eval_item["prompt"]
        assertions = eval_item.get("assertions", [])
        expected_output = eval_item.get("expected_output", "")

        # Determine eval name from assertions/prompt or use id
        eval_name = f"eval-{eval_id}"

        print(f"\n--- Eval {eval_id}: {eval_name} ---")
        print(f"Prompt: {prompt[:80]}...")

        for config in ["with_skill", "without_skill"]:
            run_uuid = uuid.uuid4().hex[:8]
            run_name = f"run-1"  # Single run per config
            run_dir = workspace / f"eval-{eval_id}" / config / run_name
            outputs_dir = run_dir / "outputs"
            outputs_dir.mkdir(parents=True, exist_ok=True)

            print(f"  Running {config}...")

            # Execute
            use_skill = (config == "with_skill")
            skill_for_run = skill_path if use_skill else None

            start = time.time()
            transcript, duration, tokens = run_claude_prompt(
                prompt,
                project_root,
                skill_path=skill_for_run,
                timeout=args.timeout,
            )
            duration = time.time() - start

            # Save transcript
            transcript_file = outputs_dir / "transcript.txt"
            transcript_file.write_text(transcript)

            # Save timing
            timing = {
                "total_tokens": tokens,
                "duration_ms": int(duration * 1000),
                "total_duration_seconds": round(duration, 2),
            }
            timing_file = run_dir / "timing.json"
            timing_file.write_text(json.dumps(timing, indent=2))

            # Grade (use claude as grader)
            print(f"    Grading {config}...")
            grading_output = grade_run(
                eval_id=eval_id,
                eval_name=eval_name,
                prompt=prompt,
                assertions=assertions,
                transcript_path=transcript_file,
                outputs_dir=outputs_dir,
                project_root=project_root,
            )

            # Parse grading from the output - look for JSON
            grading_json = None
            for line in grading_output.split("\n"):
                line = line.strip()
                if not line:
                    continue
                try:
                    parsed = json.loads(line)
                    if parsed.get("type") == "result":
                        content = parsed.get("content", [])
                        for block in content:
                            if block.get("type") == "text":
                                text = block.get("text", "")
                                # Try to find JSON in the text
                                import re
                                json_matches = re.findall(r'\{[^{}]*"expectations"[^{}]*\}', text, re.DOTALL)
                                if json_matches:
                                    grading_json = json.loads(json_matches[0])
                except (json.JSONDecodeError, AttributeError, KeyError):
                    continue

            if grading_json:
                grading_file = run_dir / "grading.json"
                grading_file.write_text(json.dumps(grading_json, indent=2))
                print(f"    Graded: {grading_json.get('summary', {}).get('passed', 0)}/{grading_json.get('summary', {}).get('total', 0)} passed")
            else:
                # Save raw output for debugging
                raw_file = run_dir / "grading_raw.txt"
                raw_file.write_text(grading_output)
                print(f"    WARNING: Could not parse grading JSON, saved raw output")

            all_runs.append({
                "eval_id": eval_id,
                "eval_name": eval_name,
                "config": config,
                "run_dir": str(run_dir),
            })

    # Aggregate benchmark
    print(f"\n--- Aggregating benchmark ---")
    agg_cmd = [
        sys.executable, "-m", "scripts.aggregate_benchmark",
        str(workspace),
        "--skill-name", skill_name,
        "--skill-path", str(skill_path),
    ]
    result = subprocess.run(
        agg_cmd,
        capture_output=True,
        text=True,
        cwd=str(SKILL_CREATOR),
    )
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)

    # Generate static HTML
    print(f"\n--- Generating static HTML ---")
    benchmark_json = workspace / "benchmark.json"
    static_html = workspace / "review.html"
    review_cmd = [
        sys.executable, str(GENERATE_REVIEW_SCRIPT),
        str(workspace),
        "--skill-name", skill_name,
        "--benchmark", str(benchmark_json),
        "--static", str(static_html),
    ]
    result = subprocess.run(
        review_cmd,
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)

    print(f"\nDone! Static HTML: {static_html}")
    print(f"Benchmark: {benchmark_json}")


if __name__ == "__main__":
    main()
