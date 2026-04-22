"""Shared task for running Node.js ETL scripts."""
import os
import subprocess
from pathlib import Path

from dotenv import load_dotenv
from prefect import task

# Resolve pipeline root relative to this file: pipeline/flows/ -> ..
PIPELINE_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = PIPELINE_ROOT.parent


def load_env():
    """Load .env from project root into os.environ."""
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        load_dotenv(env_file, override=False)


@task(retries=2, retry_delay_seconds=60, log_prints=True)
def run_etl(script: str) -> str:
    """Run a pipeline/scripts/<script> via node, streaming stdout/stderr."""
    load_env()
    script_path = PIPELINE_ROOT / "scripts" / script
    if not script_path.exists():
        raise FileNotFoundError(f"ETL script not found: {script_path}")

    result = subprocess.run(
        ["node", str(script_path)],
        env={**os.environ},
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT),
    )
    if result.stdout:
        print(result.stdout)
    if result.returncode != 0:
        raise RuntimeError(
            f"{script} exited {result.returncode}:\n{result.stderr[-2000:]}"
        )
    return result.stdout
