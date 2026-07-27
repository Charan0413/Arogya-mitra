from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    HealthAssessment,
    WorkoutPlan,
    NutritionPlan,
)
from app.schemas import ChatRequest
from app.services.groq_service import (
    classify_intent,
    generate_chat,
    generate_workout,
    generate_nutrition,
    modify_workout_plan,
    modify_nutrition_plan,
)

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat"]
)

@router.post("/")
def chat(request: ChatRequest, db: Session = Depends(get_db)):

    profile = (
        db.query(HealthAssessment)
        .filter(HealthAssessment.user_id == request.user_id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Health profile not found."
        )

    intent = classify_intent(request.message)

    # -----------------------------
    # Generate Workout
    # -----------------------------
    if intent == "generate_workout":

        workout = generate_workout(profile)

        saved = (
            db.query(WorkoutPlan)
            .filter(WorkoutPlan.user_id == request.user_id)
            .first()
        )

        if saved:
            saved.plan = workout
        else:
            saved = WorkoutPlan(
                user_id=request.user_id,
                plan=workout
            )
            db.add(saved)

        db.commit()

        return {
            "reply": "✅ Your workout plan has been generated and saved.",
            "updated_plan": workout
        }

    # -----------------------------
    # Modify Workout
    # -----------------------------
    elif intent == "modify_workout":

        saved = (
            db.query(WorkoutPlan)
            .filter(WorkoutPlan.user_id == request.user_id)
            .first()
        )

        if not saved:
            return {
                "reply": "You don't have a workout plan yet. Please generate one first."
            }

        updated = modify_workout_plan(
            saved.plan,
            request.message
        )

        saved.plan = updated
        db.commit()

        return {
            "reply": "✅ Workout plan updated successfully.",
            "updated_plan": updated
        }

    # -----------------------------
    # Generate Nutrition
    # -----------------------------
    elif intent == "generate_nutrition":

        nutrition = generate_nutrition(profile)

        saved = (
            db.query(NutritionPlan)
            .filter(NutritionPlan.user_id == request.user_id)
            .first()
        )

        if saved:
            saved.plan = nutrition
        else:
            saved = NutritionPlan(
                user_id=request.user_id,
                plan=nutrition
            )
            db.add(saved)

        db.commit()

        return {
            "reply": "✅ Nutrition plan generated successfully.",
            "updated_plan": nutrition
        }

    # -----------------------------
    # Modify Nutrition
    # -----------------------------
    elif intent == "modify_nutrition":

        saved = (
            db.query(NutritionPlan)
            .filter(NutritionPlan.user_id == request.user_id)
            .first()
        )

        if not saved:
            return {
                "reply": "You don't have a nutrition plan yet. Please generate one first."
            }

        updated = modify_nutrition_plan(
            saved.plan,
            request.message
        )

        saved.plan = updated
        db.commit()

        return {
            "reply": "✅ Nutrition plan updated successfully.",
            "updated_plan": updated
        }

    # -----------------------------
    # General Chat
    # -----------------------------
    else:

        reply = generate_chat(
            profile,
            request.message
        )

        return {
            "reply": reply
        }