from prefect import flow
from _base import run_etl


@flow(name="plotrip-etl-city-visitors", log_prints=True)
def etl_city_visitors():
    run_etl("city-visitors.mjs")


if __name__ == "__main__":
    etl_city_visitors()
