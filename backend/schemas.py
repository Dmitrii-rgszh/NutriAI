from pydantic import BaseModel, Field
from typing import Optional, List

class UserCreate(BaseModel):
    telegram_id: str = Field(..., min_length=1)
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=5, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female)$")
    height: Optional[float] = Field(None, ge=50, le=250)
    weight: Optional[float] = Field(None, ge=15, le=400)
    target_weight: Optional[float] = Field(None, ge=15, le=400)
    activity_level: Optional[str] = Field(None, pattern="^(sedentary|light|moderate|active|very_active)$")
    goal: Optional[str] = Field(None, pattern="^(lose_weight|maintain|gain_weight)$")

class UserOut(BaseModel):
    id: int
    telegram_id: str
    username: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    target_weight: Optional[float]
    activity_level: Optional[str]
    goal: Optional[str]
    bmr: Optional[float]
    tdee: Optional[float]
    daily_calories: Optional[float]

    class Config:
        from_attributes = True

class MealOut(BaseModel):
    id: int
    food_name: str
    calories: float
    protein: float
    carbs: float
    fat: float

    class Config:
        from_attributes = True

class DailySummary(BaseModel):
    user_id: int
    calories_target: Optional[float]
    calories_consumed: float
    calories_remaining: Optional[float]
    meals_count: int
    progress_percent: float
    protein_total: float
    carbs_total: float
    fat_total: float
    message: str
    meals: List[MealOut] = []

class HistoryDay(BaseModel):
    date: str  # YYYY-MM-DD
    calories: float
    target: Optional[float]
    deficit: Optional[float]
    percent: float

class HistoryResponse(BaseModel):
    days: List[HistoryDay]

# ---- Weight Forecast ----
class WeightForecastPoint(BaseModel):
    day: int
    date: str
    est_weight: float
    cumulative_deficit: float

class WeightForecastResponse(BaseModel):
    start_weight: float
    target_weight: Optional[float]
    daily_avg_deficit: float
    weekly_change_kg: float
    points: List[WeightForecastPoint]
    method: str

# ---- Macro Goals ----
class MacroGoals(BaseModel):
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float
    protein_pct: float
    fat_pct: float
    carbs_pct: float
    method: str

# ---- Photo Analysis (placeholder) ----
class PhotoAnalysisResult(BaseModel):
    status: str
    notes: str

class PhotoMealResponse(BaseModel):
    meal: MealOut
    analysis: PhotoAnalysisResult
