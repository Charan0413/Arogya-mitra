from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models import DailyStreak
from app.schemas import StreakLogRequest

router = APIRouter(prefix="/streak", tags=["Streak"])


def _get_or_create_log(user_id: int, log_date: str, db: Session):
    """Return existing streak log for user+date, or create a new one."""
    log = (
        db.query(DailyStreak)
        .filter(
            DailyStreak.user_id == user_id,
            DailyStreak.log_date == log_date,
        )
        .first()
    )
    if not log:
        log = DailyStreak(
            user_id=user_id,
            log_date=log_date,
            workout_done=0,
            nutrition_done=0,
        )
        db.add(log)
        db.flush()
    return log


def _calculate_streak(user_id: int, db: Session) -> int:
    """
    Count consecutive days (backwards from today) where
    both workout AND nutrition were completed.
    """
    today = datetime.utcnow().date()
    streak = 0

    for i in range(365):  # upper bound
        d = (today - timedelta(days=i)).isoformat()
        log = (
            db.query(DailyStreak)
            .filter(
                DailyStreak.user_id == user_id,
                DailyStreak.log_date == d,
                DailyStreak.workout_done == 1,
                DailyStreak.nutrition_done == 1,
            )
            .first()
        )
        if log:
            streak += 1
        else:
            break
    return streak


# ──────────────────────────────────────────────
#  POST /streak/log   — log completion for a day
# ──────────────────────────────────────────────

@router.post("/log")
def log_streak(data: StreakLogRequest, db: Session = Depends(get_db)):
    """Mark workout / nutrition as done for a given date."""

    log = _get_or_create_log(data.user_id, data.log_date, db)
    if data.workout_done is not None:
        log.workout_done = 1 if data.workout_done else 0
    if data.nutrition_done is not None:
        log.nutrition_done = 1 if data.nutrition_done else 0
    db.commit()

    return {
        "message": "Logged.",
        "log_date": data.log_date,
        "workout_done": bool(log.workout_done),
        "nutrition_done": bool(log.nutrition_done),
    }


# ──────────────────────────────────────────────
#  GET /streak/current/{user_id}   — get current streak count
# ──────────────────────────────────────────────

@router.get("/current/{user_id}")
def get_current_streak(user_id: int, db: Session = Depends(get_db)):
    """Return the current streak count + today's status."""
    today = datetime.utcnow().date().isoformat()
    today_log = (
        db.query(DailyStreak)
        .filter(
            DailyStreak.user_id == user_id,
            DailyStreak.log_date == today,
        )
        .first()
    )

    return {
        "current_streak": _calculate_streak(user_id, db),
        "today_done": bool(today_log and today_log.workout_done and today_log.nutrition_done),
        "workout_today": bool(today_log and today_log.workout_done),
        "nutrition_today": bool(today_log and today_log.nutrition_done),
    }


# ──────────────────────────────────────────────
#  GET /streak/calendar/{user_id}   — all completed dates for a month
# ──────────────────────────────────────────────

@router.get("/calendar/{user_id}")
def get_streak_calendar(
    user_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """Return all dates in a given month where both workout+nutrition were done."""
    prefix = f"{year:04d}-{month:02d}"
    logs = (
        db.query(DailyStreak)
        .filter(
            DailyStreak.user_id == user_id,
            DailyStreak.log_date.startswith(prefix),
            DailyStreak.workout_done == 1,
            DailyStreak.nutrition_done == 1,
        )
        .all()
    )

    return {
        "dates": sorted([log.log_date for log in logs]),
    }
