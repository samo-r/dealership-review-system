import logging

logger = logging.getLogger("autocars.sentiment")


def log_sentiment_pending(review_id, source):
    logger.info(
        "[sentiment] review_id=%s status=PENDING (%s)",
        review_id,
        source,
    )


def log_sentiment_queued(review_id, event_type):
    logger.info(
        "[sentiment] review_id=%s status=QUEUED event=%s",
        review_id,
        event_type,
    )


def log_sentiment_queue_skipped(review_id, reason):
    logger.warning(
        "[sentiment] review_id=%s status=PENDING queue=SKIPPED reason=%s",
        review_id,
        reason,
    )


def log_sentiment_completed(review_id, label, source):
    logger.info(
        "[sentiment] review_id=%s status=COMPLETED label=%s (%s)",
        review_id,
        label,
        source,
    )


def log_sentiment_failed(review_id, source, error_message=None):
    logger.warning(
        "[sentiment] review_id=%s status=FAILED (%s) %s",
        review_id,
        source,
        error_message or "",
    )


def log_reviews_batch_summary(reviews, context):
    if not isinstance(reviews, list):
        return

    pending = sum(1 for review in reviews if review.get(
        "sentiment_status") == "pending")
    failed = sum(1 for review in reviews if review.get(
        "sentiment_status") == "failed")

    if pending:
        logger.info(
            "[sentiment] %s summary: %s review(s) still PENDING analysis",
            context,
            pending,
        )
    if failed:
        logger.warning(
            "[sentiment] %s summary: %s review(s) FAILED sentiment analysis",
            context,
            failed,
        )
