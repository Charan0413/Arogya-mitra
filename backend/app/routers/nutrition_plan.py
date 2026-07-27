from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import NutritionPlan

router = APIRouter(
    prefix="/nutrition-plan",
    tags=["Nutrition Plan"]
)


@router.get("/{user_id}")
def get_saved_nutrition(user_id: int, db: Session = Depends(get_db)):

    nutrition = (
        db.query(NutritionPlan)
        .filter(NutritionPlan.user_id == user_id)
        .first()
    )

    if nutrition is None:
        raise HTTPException(
            status_code=404,
            detail="Nutrition plan not found."
        )

    return {
        "plan": nutrition.plan
    }