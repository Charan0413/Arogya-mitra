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