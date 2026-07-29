from pydantic import BaseModel, EmailStr
from typing import Optional


# ==========================
# Authentication
# ==========================

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


# ==========================
# Health Assessment
# ==========================

class HealthCreate(BaseModel):
    user_id: int
    age: int
    gender: str
    height: str
    weight: str
    fitness_goal: str
    activity_level: str
    workout_preference: str
    available_time: str
    allergies: str
    medical_conditions: str
    injuries: str


# ==========================
# AI Chat
# ==========================

class ChatRequest(BaseModel):
    user_id: int
    message: str


# ==========================
# Workout Plan
# ==========================

class WorkoutPlanResponse(BaseModel):
    user_id: int
    plan: str

    class Config:
        from_attributes = True


# ==========================
# Nutrition Plan
# ==========================

class NutritionPlanResponse(BaseModel):
    user_id: int
    plan: str

    class Config:
        from_attributes = True


# ==========================
# Weekly Plan
# ==========================

class WeeklyPlanDayCreate(BaseModel):
    user_id: int
    title: str = "Weekly Plan"
    day_label: str
    plan_data: str
    nutrition_data: str = ""
    plan_date: str


class WeeklyPlanCreate(BaseModel):
    days: list[WeeklyPlanDayCreate]


class WeeklyPlanResponse(BaseModel):
    id: int
    user_id: int
    title: str
    day_label: str
    plan_data: str
    plan_date: str
    created_at: str

    class Config:
        from_attributes = True


# ==========================
# Streak
# ==========================

class StreakLogRequest(BaseModel):
    user_id: int
    log_date: str          # YYYY-MM-DD
    workout_done: Optional[bool] = None
    nutrition_done: Optional[bool] = None
    calories_consumed: Optional[int] = None
    calories_burned: Optional[int] = None


class StreakResponse(BaseModel):
    current_streak: int
    today_done: bool
    workout_today: bool
    nutrition_today: bool


class StreakCalendarResponse(BaseModel):
    dates: list[str]       # dates where both workout+nutrition done


class CalorieTrendEntry(BaseModel):
    log_date: str
    calories_consumed: int
    calories_burned: int


class CalorieTrendResponse(BaseModel):
    days: list[CalorieTrendEntry]