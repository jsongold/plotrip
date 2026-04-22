from prefect import flow
from _base import run_etl


@flow(name="plotrip-etl-events", log_prints=True)
def etl_events():
    run_etl("events.mjs")


if __name__ == "__main__":
    etl_events()
