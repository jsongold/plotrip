from prefect import flow
from _base import run_etl


@flow(name="plotrip-etl-scores", log_prints=True)
def etl_scores():
    run_etl("scores.mjs")


if __name__ == "__main__":
    etl_scores()
