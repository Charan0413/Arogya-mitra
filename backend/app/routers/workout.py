from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HealthAssessment, WorkoutPlan
from app.services.groq_service import generate_workout

router = APIRouter(
    prefix="/workout",
    tags=["Workout"]
)


@router.get("/{user_id}")
def get_workout(user_id: int, db: Session = Depends(get_db)):

    profile = (
        db.query(HealthAssessment)
        .filter(HealthAssessment.user_id == user_id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Health profile not found"
        )

    # Generate AI workout plan
    workout = generate_workout(profile)

    # Check if the user already has a saved workout plan
    saved_plan = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.user_id == user_id)
        .first()
    )

    if saved_plan:
        # Update existing plan
        saved_plan.plan = workout
    else:
        # Create a new plan
        saved_plan = WorkoutPlan(
            user_id=user_id,
            plan=workout
        )
        db.add(saved_plan)

    db.commit()
    db.refresh(saved_plan)

    return {
        "message": "Workout plan generated successfully.",
        "workout_plan": workout
    }