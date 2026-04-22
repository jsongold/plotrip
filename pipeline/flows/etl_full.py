"""Full Plotrip ETL pipeline — runs all steps in dependency order."""
from prefect import flow

from _base import run_etl


@flow(name="plotrip-etl-full", log_prints=True)
def etl_full():
    """Full pipeline: climate → tags → scores → events → crowd → city-tier → city-visitors."""
    run_etl("climate.mjs")
    run_etl("tags.mjs")
    run_etl("scores.mjs")
    run_etl("events.mjs")
    run_etl("crowd.mjs")     # depends on events
    run_etl("city-tier.mjs")
    run_etl("city-visitors.mjs")


if __name__ == "__main__":
    etl_full()
