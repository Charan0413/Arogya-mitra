from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models import (
    HealthAssessment,
    WorkoutPlan,
    NutritionPlan,
    WeeklyPlan,
)
from app.schemas import ChatRequest
from app.services.groq_service import (
    classify_intent,
    generate_chat,
    generate_workout,
    generate_nutrition,
    modify_workout_plan,
    modify_nutrition_plan,
    parse_reschedule,
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

        workout = generate_workout(profile, request.message)

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

        # Clear stale calendar entries so they match the new plan
        db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == request.user_id
        ).delete()

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

        # Clear stale calendar entries — user must re-save
        db.query(WeeklyPlan).filter(
            WeeklyPlan.user_id == request.user_id
        ).delete()

        db.commit()

        return {
            "reply": "✅ Workout plan updated successfully.",
            "updated_plan": updated
        }

    # -----------------------------
    # Generate Nutrition
    # -----------------------------
    elif intent == "generate_nutrition":

        nutrition = generate_nutrition(profile, request.message)

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
    # Reschedule / Move Calendar
    # -----------------------------
    elif intent == "reschedule_plan":

        today_str = datetime.now().strftime("%Y-%m-%d")
        parsed = parse_reschedule(request.message, today_str)

        if not parsed:
            return {
                "reply": "I couldn't understand the reschedule request. Please try something like:\n"
                         "- \"Postpone my Day 1 from July 28 to July 30\"\n"
                         "- \"Swap Day 1 and Day 3\"\n"
                         "- \"Move my Monday plan to Wednesday\""
            }

        action = parsed.get("action", "move")
        from_date = parsed.get("from_date")
        to_date = parsed.get("to_date")
        from_label = parsed.get("from_label")
        to_label = parsed.get("to_label")

        # ── If labels were given instead of dates, look up by day_label ──
        all_plans = (
            db.query(WeeklyPlan)
            .filter(WeeklyPlan.user_id == request.user_id)
            .order_by(WeeklyPlan.plan_date.asc())
            .all()
        )

        if not all_plans:
            return {
                "reply": "You don't have any saved plans in the calendar yet. "
                         "Save a plan to the calendar first from the Weekly Plan page."
            }

        def find_plan_by_label(label):
            if not label:
                return None
            label_lower = label.lower().strip()
            for p in all_plans:
                if label_lower in p.day_label.lower() or label_lower in (p.plan_date or "").lower():
                    return p
            return None

        def find_plan_by_date(date_str):
            if not date_str:
                return None
            for p in all_plans:
                if p.plan_date == date_str:
                    return p
            return None

        # Resolve source
        source = find_plan_by_date(from_date) or find_plan_by_label(from_label)
        # Resolve target
        target = find_plan_by_date(to_date) or find_plan_by_label(to_label)

        if action == "swap" and source and target and source.id != target.id:
            source.plan_date, target.plan_date = target.plan_date, source.plan_date
            db.commit()
            return {
                "reply": f"✅ Swapped **{source.day_label}** ({source.plan_date}) "
                         f"with **{target.day_label}** ({target.plan_date})."
            }

        if not source:
            return {
                "reply": f"I couldn't find a plan entry for "
                         f"\"{from_label or from_date}\" in your calendar. "
                         f"Available dates: {', '.join(p.plan_date for p in all_plans)}"
            }

        if not to_date and to_label:
            # Try to find by label
            target_by_label = find_plan_by_label(to_label)
            if target_by_label:
                to_date = target_by_label.plan_date
            else:
                return {
                    "reply": f"I couldn't find a destination for \"{to_label}\" in your calendar."
                }

        if not to_date:
            return {
                "reply": "Please specify where to move the plan. For example:\n"
                         "- \"Move Day 1 to July 30\"\n"
                         "- \"Postpone Monday's plan by 2 days\""
            }

        # Check destination is free
        dest = find_plan_by_date(to_date)
        if dest and dest.id != source.id:
            return {
                "reply": f"Date {to_date} already has **{dest.day_label}**. "
                         f"Swap them instead by saying \"Swap {source.day_label} and {dest.day_label}\"."
            }

        old_date = source.plan_date
        source.plan_date = to_date
        db.commit()

        return {
            "reply": f"✅ **{source.day_label}** moved from {old_date} to {to_date}."
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