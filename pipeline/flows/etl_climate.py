from prefect import flow
from _base import run_etl


@flow(name="plotrip-etl-climate", log_prints=True)
def etl_climate():
    run_etl("climate.mjs")


if __name__ == "__main__":
    etl_climate()
