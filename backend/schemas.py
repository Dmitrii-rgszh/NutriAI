from pydantic import BaseModel, Field
from typing import Optional, List, Any
import json

class UserCreate(BaseModel):
    telegram_id: str = Field(..., min_length=1)
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=5, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height: Optional[float] = Field(None, ge=50, le=250)
    weight: Optional[float] = Field(None, ge=15, le=400)
    target_weight: Optional[float] = Field(None, ge=15, le=400)
    activity_level: Optional[str] = None
    activity_multiplier: Optional[float] = Field(None, ge=1.0, le=3.0)
    goal: Optional[str] = Field(None, pattern="^(lose|maintain|gain)$")
    sleep_hours: Optional[float] = Field(None, ge=1, le=24)
    water_intake: Optional[float] = Field(None, ge=0, le=10)
    health_conditions: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    allergens: Optional[List[str]] = None

class UserProfileUpdate(BaseModel):
    # Personal data
    age: Optional[int] = Field(None, ge=5, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height: Optional[float] = Field(None, ge=50, le=250)
    weight: Optional[float] = Field(None, ge=15, le=400)
    
    # Goals
    goal: Optional[str] = Field(None, pattern="^(lose|maintain|gain)$")
    target_weight: Optional[float] = Field(None, ge=15, le=400)
    
    # Activity
    activity_level: Optional[str] = None
    activity_multiplier: Optional[float] = Field(None, ge=1.0, le=3.0)
    sleep_hours: Optional[float] = Field(None, ge=1, le=24)
    
    # Health
    health_conditions: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    allergens: Optional[List[str]] = None
    water_intake: Optional[float] = Field(None, ge=0, le=10)

class UserOut(BaseModel):
    id: int
    telegram_id: str
    username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    target_weight: Optional[float]
    activity_level: Optional[str]
    activity_multiplier: Optional[float]
    goal: Optional[str]
    sleep_hours: Optional[float]
    water_intake: Optional[float]
    health_conditions: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    allergens: Optional[List[str]] = None
    bmr: Optional[float]
    tdee: Optional[float]
    daily_calories: Optional[float]

    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_with_json(cls, obj):
        # Convert JSON strings to lists
        data = {
            "id": obj.id,
            "telegram_id": obj.telegram_id,
            "username": obj.username,
            "first_name": obj.first_name,
            "last_name": obj.last_name,
            "age": obj.age,
            "gender": obj.gender,
            "height": obj.height,
            "weight": obj.weight,
            "target_weight": obj.target_weight,
            "activity_level": obj.activity_level,
            "activity_multiplier": obj.activity_multiplier,
            "goal": obj.goal,
            "sleep_hours": obj.sleep_hours,
            "water_intake": obj.water_intake,
            "bmr": obj.bmr,
            "tdee": obj.tdee,
            "daily_calories": obj.daily_calories,
        }
        
        # Parse JSON fields
        try:
            data["health_conditions"] = json.loads(obj.health_conditions) if obj.health_conditions else []
        except:
            data["health_conditions"] = []
            
        try:
            data["dietary_restrictions"] = json.loads(obj.dietary_restrictions) if obj.dietary_restrictions else []
        except:
            data["dietary_restrictions"] = []
            
        try:
            data["allergens"] = json.loads(obj.allergens) if obj.allergens else []
        except:
            data["allergens"] = []
            
        return cls(**data)

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
