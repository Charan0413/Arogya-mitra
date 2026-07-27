from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WorkoutPlan

router = APIRouter(
    prefix="/workout-plan",
    tags=["Workout Plan"]
)


@router.get("/{user_id}")
def get_saved_workout(user_id: int, db: Session = Depends(get_db)):

    workout = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.user_id == user_id)
        .first()
    )

    if workout is None:
        raise HTTPException(
            status_code=404,
            detail="Workout plan not found."
        )

    return {
        "plan": workout.plan
    }