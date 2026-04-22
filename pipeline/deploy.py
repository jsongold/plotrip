"""Prefect deployment config for Plotrip ETL pipelines.

Usage:
  pip install -r pipeline/requirements.txt
  prefect server start                    # start local server (separate terminal)
  python pipeline/deploy.py              # register all deployments
  prefect worker start -p default        # start worker (separate terminal)
  prefect deployment run 'plotrip-etl-full/full-weekly'  # manual trigger
"""
import sys
from pathlib import Path

# Add flows/ to path so relative imports work
sys.path.insert(0, str(Path(__file__).parent / "flows"))

from prefect.client.schemas.schedules import CronSchedule
from prefect.deployments import Deployment

from etl_full import etl_full
from etl_climate import etl_climate
from etl_city_tier import etl_city_tier
from etl_city_visitors import etl_city_visitors


def main():
    deployments = [
        Deployment.build_from_flow(
            flow=etl_full,
            name="full-weekly",
            schedule=CronSchedule(cron="0 2 * * 0", timezone="UTC"),  # Sun 02:00 UTC
            work_pool_name="default",
            description="Full ETL pipeline — all steps. Runs every Sunday 02:00 UTC.",
        ),
        Deployment.build_from_flow(
            flow=etl_climate,
            name="climate-quarterly",
            schedule=CronSchedule(cron="0 3 1 1,4,7,10 *", timezone="UTC"),  # Jan/Apr/Jul/Oct 1st
            work_pool_name="default",
            description="Climate data refresh — quarterly.",
        ),
        Deployment.build_from_flow(
            flow=etl_city_tier,
            name="city-tier-annual",
            schedule=CronSchedule(cron="0 4 15 1 *", timezone="UTC"),  # Jan 15th
            work_pool_name="default",
            description="GaWC city tier refresh — annual.",
        ),
        Deployment.build_from_flow(
            flow=etl_city_visitors,
            name="city-visitors-annual",
            schedule=CronSchedule(cron="0 5 15 1 *", timezone="UTC"),  # Jan 15th
            work_pool_name="default",
            description="Wikipedia annual visitor count refresh — annual.",
        ),
    ]

    for d in deployments:
        d.apply()
        print(f"[deploy] registered: {d.flow_name}/{d.name}")

    print("\n[deploy] all done. Start worker with: prefect worker start -p default")


if __name__ == "__main__":
    main()
