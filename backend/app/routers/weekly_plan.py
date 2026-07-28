from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

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
