from prefect import flow
from _base import run_etl


@flow(name="plotrip-etl-city-tier", log_prints=True)
def etl_city_tier():
    run_etl("city-tier.mjs")


if __name__ == "__main__":
    etl_city_tier()
