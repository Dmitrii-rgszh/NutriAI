from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

    # Profile data
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)  # male, female
    height = Column(Float, nullable=True)  # cm
    weight = Column(Float, nullable=True)  # kg
    target_weight = Column(Float, nullable=True)  # kg
    activity_level = Column(String, nullable=True)  # sedentary, light, moderate, active, very_active
    goal = Column(String, nullable=True)  # lose_weight, maintain, gain_weight

    # Calculated fields
    bmr = Column(Float, nullable=True)
    tdee = Column(Float, nullable=True)
    daily_calories = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    meals = relationship("Meal", back_populates="user")

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    meal_type = Column(String)  # breakfast, lunch, dinner, snack
    food_name = Column(String)
    calories = Column(Float)
    protein = Column(Float)  # g
    carbs = Column(Float)  # g
    fat = Column(Float)  # g
    portion = Column(Float, nullable=True)  # grams or multiplier
    image_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="meals")

class DailyLog(Base):
    __tablename__ = "daily_logs"
    __table_args__ = (UniqueConstraint('user_id','date', name='uq_user_date'),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    date = Column(String, index=True)  # YYYY-MM-DD
    calories = Column(Float, default=0)
    target = Column(Float, nullable=True)
    deficit = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
