from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HealthAssessment, NutritionPlan
from app.services.groq_service import generate_nutrition

router = APIRouter(
    prefix="/nutrition",
    tags=["Nutrition"]
)


@router.get("/{user_id}")
def get_nutrition(user_id: int, days: int = Query(default=5, ge=1, le=14), db: Session = Depends(get_db)):

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

    # Generate AI nutrition plan with dynamic day count
    nutrition = generate_nutrition(profile, f"Generate a {days}-day nutrition plan")

    # Check if a nutrition plan already exists
    saved_plan = (
        db.query(NutritionPlan)
        .filter(NutritionPlan.user_id == user_id)
        .first()
    )

    if saved_plan:
        # Update existing plan
        saved_plan.plan = nutrition
    else:
        # Create a new plan
        saved_plan = NutritionPlan(
            user_id=user_id,
            plan=nutrition
        )
        db.add(saved_plan)

    db.commit()
    db.refresh(saved_plan)

    return {
        "message": "Nutrition plan generated successfully.",
        "nutrition_plan": nutrition
    }