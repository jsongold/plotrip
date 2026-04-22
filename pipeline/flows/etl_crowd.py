from prefect import flow
from _base import run_etl


@flow(name="plotrip-etl-crowd", log_prints=True)
def etl_crowd():
    run_etl("crowd.mjs")


if __name__ == "__main__":
    etl_crowd()
