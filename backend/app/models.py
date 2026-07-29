from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    DateTime,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    health = relationship("HealthAssessment", back_populates="user")

    workout_plan = relationship(
        "WorkoutPlan",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    nutrition_plan = relationship(
        "NutritionPlan",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    weekly_plans = relationship(
        "WeeklyPlan",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class HealthAssessment(Base):
    __tablename__ = "health_assessments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    age = Column(Integer)
    gender = Column(String(20))
    height = Column(String(20))
    weight = Column(String(20))

    fitness_goal = Column(String(100))
    activity_level = Column(String(100))
    workout_preference = Column(String(100))
    available_time = Column(String(50))

    allergies = Column(String(255))
    medical_conditions = Column(String(255))
    injuries = Column(String(255))

    user = relationship("User", back_populates="health")


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    plan = Column(Text, nullable=False)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user = relationship(
        "User",
        back_populates="workout_plan",
    )


class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    plan = Column(Text, nullable=False)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user = relationship(
        "User",
        back_populates="nutrition_plan",
    )


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    title = Column(String(200), nullable=False, default="Weekly Plan")
    day_label = Column(String(50), nullable=False)
    plan_data = Column(Text, nullable=False)
    nutrition_data = Column(Text, nullable=True, default="")
    plan_date = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="weekly_plans",
    )


class DailyStreak(Base):
    __tablename__ = "daily_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(String(20), nullable=False)
    workout_done = Column(Integer, default=0)  # 0/1
    nutrition_done = Column(Integer, default=0)  # 0/1

    user = relationship("User", backref="streaks")