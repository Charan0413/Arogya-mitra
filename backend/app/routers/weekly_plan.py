from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models import WeeklyPlan
from app.schemas import WeeklyPlanCreate

router = APIRouter(prefix="/weekly-plan", tags=["Weekly Plan"])


@router.post("/save")
def save_weekly_plan(data: WeeklyPlanCreate, db: Session = Depends(get_db)):
    """
    Upsert calendar entries for a workout plan.

    1. Delete ALL old entries for this user (clean slate).
    2. INSERT the new day entries.
    This guarantees the calendar always reflects the latest plan
    with zero orphans and zero duplicates.
    """
    if not data.days:
        return {"message": "No days to save.", "ids": []}

    user_id = data.days[0].user_id

    # ── Step 1: remove every old entry for this user ──
    old_entries = (
        db.query(WeeklyPlan)
        .filter(WeeklyPlan.user_id == user_id)
        .all()
    )
    for entry in old_entries:
        db.delete(entry)
    db.flush()

    # ── Step 2: insert the fresh batch ──
    saved_ids = []
    for day in data.days:
        plan = WeeklyPlan(
            user_id=day.user_id,
            title=day.title,
            day_label=day.day_label,
            plan_data=day.plan_data,
            nutrition_data=day.nutrition_data,
            plan_date=day.plan_date,
        )
        db.add(plan)
        db.flush()
        saved_ids.append(plan.id)

    db.commit()
    return {
        "message": f"{len(saved_ids)} day(s) saved to calendar.",
        "ids": saved_ids,
    }


@router.get("/{user_id}")
def get_weekly_plans(user_id: int, db: Session = Depends(get_db)):
    plans = (
        db.query(WeeklyPlan)
        .filter(WeeklyPlan.user_id == user_id)
        .order_by(WeeklyPlan.plan_date.asc())
        .all()
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "day_label": p.day_label,
            "plan_data": p.plan_data,
            "nutrition_data": p.nutrition_data or "",
            "plan_date": p.plan_date,
            "created_at": p.created_at.isoformat() if p.created_at else "",
        }
        for p in plans
    ]


@router.delete("/{plan_id}")
def delete_weekly_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(WeeklyPlan).filter(WeeklyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted."}


# ── Move / reschedule helpers ──

class MovePlanRequest(BaseModel):
    user_id: int
    from_date: str   # YYYY-MM-DD
    to_date: str     # YYYY-MM-DD


@router.patch("/move")
def move_plan_entry(data: MovePlanRequest, db: Session = Depends(get_db)):
    """Move a plan entry from one date to another."""
    entry = (
        db.query(WeeklyPlan)
        .filter(
            WeeklyPlan.user_id == data.user_id,
            WeeklyPlan.plan_date == data.from_date,
        )
        .first()
    )
    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"No plan found on {data.from_date}.",
        )

    # Check if target date already has an entry
    existing = (
        db.query(WeeklyPlan)
        .filter(
            WeeklyPlan.user_id == data.user_id,
            WeeklyPlan.plan_date == data.to_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Date {data.to_date} already has a plan. Delete or move that one first.",
        )

    old_date = entry.plan_date
    entry.plan_date = data.to_date
    db.commit()

    return {
        "message": f"Plan moved from {old_date} to {data.to_date}.",
        "entry": {
            "id": entry.id,
            "day_label": entry.day_label,
            "plan_date": entry.plan_date,
        },
    }


@router.patch("/swap")
def swap_plan_dates(data: MovePlanRequest, db: Session = Depends(get_db)):
    """Swap two plan entries' dates."""
    entry_a = (
        db.query(WeeklyPlan)
        .filter(
            WeeklyPlan.user_id == data.user_id,
            WeeklyPlan.plan_date == data.from_date,
        )
        .first()
    )
    entry_b = (
        db.query(WeeklyPlan)
        .filter(
            WeeklyPlan.user_id == data.user_id,
            WeeklyPlan.plan_date == data.to_date,
        )
        .first()
    )

    if not entry_a and not entry_b:
        raise HTTPException(status_code=404, detail="No plans found on either date.")
    if not entry_a:
        raise HTTPException(status_code=404, detail=f"No plan found on {data.from_date}.")
    if not entry_b:
        raise HTTPException(status_code=404, detail=f"No plan found on {data.to_date}.")

    entry_a.plan_date, entry_b.plan_date = entry_b.plan_date, entry_a.plan_date
    db.commit()

    return {
        "message": f"Swapped {data.from_date} and {data.to_date}.",
    }
