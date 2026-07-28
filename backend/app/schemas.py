from pydantic import BaseModel, EmailStr


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