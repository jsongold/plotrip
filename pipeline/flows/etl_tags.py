from prefect import flow
from _base import run_etl


@flow(name="plotrip-etl-tags", log_prints=True)
def etl_tags():
    run_etl("tags.mjs")


if __name__ == "__main__":
    etl_tags()
