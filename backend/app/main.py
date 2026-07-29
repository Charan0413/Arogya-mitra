from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth
from app.routers import health
from app.routers import workout
from app.routers import nutrition
from app.routers import ai_chat
from app.routers import calendar
from app.routers import workout_plan
from app.routers import nutrition_plan
from app.routers import weekly_plan
from app.routers import streak

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="ArogyaMitra API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(workout.router)
app.include_router(nutrition.router)
app.include_router(ai_chat.router)
app.include_router(calendar.router)
app.include_router(workout_plan.router)
app.include_router(nutrition_plan.router)
app.include_router(weekly_plan.router)
app.include_router(streak.router)

@app.get("/")
def home():
    return {
        "message": "Welcome to ArogyaMitra API"
    }