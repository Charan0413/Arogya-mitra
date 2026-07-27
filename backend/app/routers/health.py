from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HealthAssessment
from app.schemas import HealthCreate

router = APIRouter(
    prefix="/health",
    tags=["Health Assessment"]
)


@router.post("/submit")
def submit_health(data: HealthCreate, db: Session = Depends(get_db)):

    assessment = HealthAssessment(
        user_id=data.user_id,
        age=data.age,
        gender=data.gender,
        height=data.height,
        weight=data.weight,
        fitness_goal=data.fitness_goal,
        activity_level=data.activity_level,
        workout_preference=data.workout_preference,
        available_time=data.available_time,
        allergies=data.allergies,
        medical_conditions=data.medical_conditions,
        injuries=data.injuries
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "message": "Health assessment saved successfully"
    }