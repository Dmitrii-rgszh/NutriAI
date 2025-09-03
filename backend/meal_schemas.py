from pydantic import BaseModel, Field
from typing import Optional

class MealCreate(BaseModel):
    user_telegram_id: str | None = None  # optional once auth in place
    food_name: str
    calories: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")

class MealUpdate(BaseModel):
    food_name: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    meal_type: Optional[str] = Field(None, pattern="^(breakfast|lunch|dinner|snack)$")

class MealOut(BaseModel):
    id: int
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float
    meal_type: str

    class Config:
        from_attributes = True
