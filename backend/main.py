from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import SessionLocal, engine
from .models import Base, User, Meal, DailyLog
from .schemas import (
    UserCreate, UserOut, UserProfileUpdate, DailySummary, HistoryResponse, HistoryDay,
    WeightForecastResponse, WeightForecastPoint, MacroGoals,
    PhotoMealResponse, PhotoAnalysisResult
)
from .meal_schemas import MealCreate, MealOut, MealUpdate
from .config import get_settings
import hmac, hashlib, urllib.parse, time, json
import jwt  # type: ignore
from jwt import PyJWTError

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version="1.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "NutriAI API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# --- Telegram Auth ---
from fastapi import Body, Header
from pydantic import BaseModel

class TelegramAuthPayload(BaseModel):
    init_data: str

class AuthResponse(BaseModel):
    token: str
    refresh: str
    user: UserOut


def _check_telegram_auth(init_data: str):
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="Bot token not configured")
    data_pairs = urllib.parse.parse_qsl(init_data, keep_blank_values=True)
    data_dict = dict(data_pairs)
    if 'hash' not in data_dict:
        raise HTTPException(status_code=400, detail="Missing hash")
    received_hash = data_dict.pop('hash')
    # Build data_check_string
    data_check_arr = [f"{k}={v}" for k,v in sorted(data_dict.items())]
    data_check_string = '\n'.join(data_check_arr)
    secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
    hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(hmac_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid hash")
    auth_date = int(data_dict.get('auth_date', '0'))
    if time.time() - auth_date > 86400:  # 24h
        raise HTTPException(status_code=401, detail="Auth data expired")
    return data_dict

def _issue_tokens(user: User):
    now = int(time.time())
    token_payload = {"sub": str(user.id), "tg_id": user.telegram_id, "exp": now + settings.JWT_EXPIRE_MINUTES*60}
    refresh_payload = {"sub": str(user.id), "type":"refresh", "exp": now + settings.JWT_EXPIRE_MINUTES*120}
    token = jwt.encode(token_payload, settings.JWT_SECRET, algorithm="HS256")
    refresh = jwt.encode(refresh_payload, settings.JWT_SECRET, algorithm="HS256")
    return token, refresh

@app.post("/auth/telegram", response_model=AuthResponse)
async def telegram_auth(payload: TelegramAuthPayload = Body(...), db: Session = Depends(get_db)):
    data = _check_telegram_auth(payload.init_data)
    user_id = data.get('id')
    if not user_id:
        raise HTTPException(status_code=400, detail="No user id")
    username = data.get('username')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    user = db.query(User).filter(User.telegram_id == str(user_id)).first()
    if not user:
        user = User(telegram_id=str(user_id), username=username, first_name=first_name, last_name=last_name)
        db.add(user)
        db.commit(); db.refresh(user)
    token, refresh = _issue_tokens(user)
    return AuthResponse(token=token, refresh=refresh, user=user)

class RefreshPayload(BaseModel):
    refresh: str

@app.post("/auth/refresh", response_model=AuthResponse)
async def refresh_token(payload: RefreshPayload, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.refresh, settings.JWT_SECRET, algorithms=["HS256"])  # type: ignore
        if data.get('type') != 'refresh':
            raise HTTPException(status_code=401, detail='Invalid token type')
        user_id = int(data['sub'])
    except PyJWTError:
        raise HTTPException(status_code=401, detail='Invalid refresh token')
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    token, refresh = _issue_tokens(user)
    return AuthResponse(token=token, refresh=refresh, user=user)

# --- Auth helper
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith('bearer '):
        raise HTTPException(status_code=401, detail='Missing token')
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])  # type: ignore
        user_id = int(payload.get('sub'))
    except PyJWTError:
        raise HTTPException(status_code=401, detail='Invalid token')
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user

# --- Users & Meals ---
@app.get("/users", response_model=List[UserOut])
async def get_users(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Возвращаем только текущего пользователя (для приватности)
    return db.query(User).filter(User.id == current.id).all()

@app.post("/users", response_model=UserOut)
async def create_or_update_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == payload.telegram_id).first()
    if not user:
        user = User(telegram_id=payload.telegram_id)
        db.add(user)
    # Update fields
    for field, value in payload.model_dump(exclude={"telegram_id"}).items():
        if value is not None:
            setattr(user, field, value)
    # Recalculate BMR/TDEE if weight/height/age/gender/activity/goal present
    if user.age and user.gender and user.height and user.weight:
        # Mifflin-St Jeor
        if user.gender == 'male':
            bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
        else:
            bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161
        activity_map = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        }
        factor = activity_map.get(user.activity_level or 'sedentary', 1.2)
        tdee = bmr * factor
        # Goal adjustment
        goal_adjust = {
            'lose_weight': -0.20,
            'maintain': 0.0,
            'gain_weight': 0.15
        }
        adj = goal_adjust.get(user.goal or 'maintain', 0.0)
        daily = tdee * (1 + adj)
        user.bmr = round(bmr, 1)
        user.tdee = round(tdee, 1)
        user.daily_calories = round(daily, 0)
    db.commit(); db.refresh(user)
    return user

# New endpoints for user profile management
@app.get("/profile", response_model=UserOut)
async def get_profile(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user profile with all onboarding data"""
    return UserOut.from_orm_with_json(current)

@app.patch("/profile", response_model=UserOut)
async def update_profile(payload: UserProfileUpdate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update user profile with onboarding data"""
    user = current
    
    # Update basic fields
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            if field in ['health_conditions', 'dietary_restrictions', 'allergens']:
                # Convert lists to JSON strings
                setattr(user, field, json.dumps(value) if value else None)
            else:
                setattr(user, field, value)
    
    # Recalculate BMR/TDEE if necessary data is present
    if user.age and user.gender and user.height and user.weight:
        # Mifflin-St Jeor equation
        if user.gender == 'male':
            bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
        elif user.gender == 'female':
            bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161
        else:  # other
            # Use average of male/female formulas
            bmr_male = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
            bmr_female = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161
            bmr = (bmr_male + bmr_female) / 2
        
        # Calculate TDEE using activity multiplier or default values
        if user.activity_multiplier:
            factor = user.activity_multiplier
        else:
            activity_map = {
                'sedentary': 1.2,
                'light': 1.375,
                'moderate': 1.55,
                'active': 1.725,
                'very_active': 1.9
            }
            factor = activity_map.get(user.activity_level or 'sedentary', 1.2)
        
        tdee = bmr * factor
        
        # Goal adjustment for daily calories
        goal_adjust = {
            'lose': -0.20,  # 20% deficit
            'maintain': 0.0,
            'gain': 0.15   # 15% surplus
        }
        adj = goal_adjust.get(user.goal or 'maintain', 0.0)
        daily = tdee * (1 + adj)
        
        user.bmr = round(bmr, 1)
        user.tdee = round(tdee, 1)
        user.daily_calories = round(daily, 0)
    
    db.commit()
    db.refresh(user)
    return UserOut.from_orm_with_json(user)

# Endpoint for creating demo/mock user (for testing)
@app.post("/create-demo-user", response_model=UserOut)
async def create_demo_user(db: Session = Depends(get_db)):
    """Create a demo user for testing purposes"""
    import uuid
    
    # Generate mock data
    mock_telegram_id = f"demo_{uuid.uuid4().hex[:8]}"
    mock_username = f"demo_user_{uuid.uuid4().hex[:6]}"
    
    # Check if user already exists
    user = db.query(User).filter(User.telegram_id == mock_telegram_id).first()
    if user:
        return UserOut.from_orm_with_json(user)
    
    # Create new demo user with some sample data
    user = User(
        telegram_id=mock_telegram_id,
        username=mock_username,
        first_name="Demo",
        last_name="User",
        age=25,
        gender="male",
        height=175.0,
        weight=70.0,
        target_weight=65.0,
        activity_level="moderate",
        activity_multiplier=1.55,
        goal="lose",
        sleep_hours=8.0,
        water_intake=2.5,
        health_conditions=json.dumps(["Нет особых состояний"]),
        dietary_restrictions=json.dumps(["Нет ограничений"]),
        allergens=json.dumps([])
    )
    
    # Calculate BMR/TDEE
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5  # Male formula
    tdee = bmr * user.activity_multiplier
    daily = tdee * 0.8  # 20% deficit for weight loss
    
    user.bmr = round(bmr, 1)
    user.tdee = round(tdee, 1)
    user.daily_calories = round(daily, 0)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserOut.from_orm_with_json(user)

def _recalc_today_log(db: Session, user: User):
    from datetime import datetime
    today = datetime.utcnow().strftime('%Y-%m-%d')
    # Sum only today's meals
    meals_today = db.query(Meal).filter(Meal.user_id==user.id).all()
    total = 0
    for m in meals_today:
        if m.created_at and m.created_at.strftime('%Y-%m-%d') == today:
            total += m.calories
    log = db.query(DailyLog).filter(DailyLog.user_id==user.id, DailyLog.date==today).first()
    if not log:
        log = DailyLog(user_id=user.id, date=today)
        db.add(log)
    log.calories = total
    log.target = user.daily_calories
    log.deficit = (user.daily_calories - total) if user.daily_calories else None
    db.commit()

@app.post("/meals", response_model=MealOut)
async def create_meal(payload: MealCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = Meal(user_id=current.id, food_name=payload.food_name, calories=payload.calories, protein=payload.protein, carbs=payload.carbs, fat=payload.fat, meal_type=payload.meal_type)
    db.add(meal); db.commit(); db.refresh(meal)
    _recalc_today_log(db, current)
    return meal

@app.get("/meals", response_model=List[MealOut])
async def list_meals(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Meal).filter(Meal.user_id==current.id).order_by(Meal.created_at.desc()).all()

@app.patch("/meals/{meal_id}", response_model=MealOut)
async def update_meal(meal_id: int, payload: MealUpdate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail='Meal not found')
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(meal, field, value)
    db.commit(); db.refresh(meal)
    _recalc_today_log(db, current)
    return meal

@app.delete("/meals/{meal_id}")
async def delete_meal(meal_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail='Meal not found')
    db.delete(meal); db.commit()
    _recalc_today_log(db, current)
    return {"status": "deleted"}

@app.get("/summary/{telegram_id}", response_model=DailySummary)
async def daily_summary(telegram_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current.telegram_id != telegram_id:
        raise HTTPException(status_code=403, detail='Forbidden')
    meals = db.query(Meal).filter(Meal.user_id == current.id).all()
    cal_total = sum(m.calories for m in meals)
    protein_total = sum(m.protein for m in meals)
    carbs_total = sum(m.carbs for m in meals)
    fat_total = sum(m.fat for m in meals)
    target = current.daily_calories
    remaining = target - cal_total if target else None
    progress = (cal_total / target * 100) if target and target > 0 else 0
    msg = "Отлично! Вы в пределах цели" if target and cal_total <= target else "Внимание: перебор калорий" if target else "Цель не настроена"
    return DailySummary(user_id=current.id, calories_target=target, calories_consumed=cal_total, calories_remaining=remaining, meals_count=len(meals), progress_percent=round(progress,1), protein_total=protein_total, carbs_total=carbs_total, fat_total=fat_total, message=msg, meals=meals)

@app.get("/history/{days}", response_model=HistoryResponse)
async def history(days: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    days = min(max(days,1), 90)
    logs = db.query(DailyLog).filter(DailyLog.user_id==current.id).order_by(DailyLog.date.desc()).limit(days).all()
    mapped = [HistoryDay(date=l.date, calories=l.calories or 0, target=l.target, deficit=l.deficit, percent=((l.calories / l.target * 100) if l.target else 0)) for l in reversed(logs)]
    return HistoryResponse(days=mapped)

from fastapi import UploadFile, File
from datetime import datetime, timedelta

# --- Photo Analysis (placeholder implementation) ---
@app.post("/analyze/photo", response_model=PhotoMealResponse)
async def analyze_photo(file: UploadFile = File(...), current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Accept an image and create a placeholder meal (zero macros).
    TODO: persist file, run vision model, extract items & macros.
    """
    filename = file.filename or "upload.jpg"
    meal = Meal(user_id=current.id, food_name=f"Фото: {filename}", calories=0, protein=0, carbs=0, fat=0, meal_type="snack")
    db.add(meal); db.commit(); db.refresh(meal)
    analysis = PhotoAnalysisResult(status="placeholder", notes="Vision analysis not implemented")
    return PhotoMealResponse(meal=meal, analysis=analysis)

# --- Weight Forecast ---
@app.get("/forecast/weight", response_model=WeightForecastResponse)
async def weight_forecast(current: User = Depends(get_current_user), db: Session = Depends(get_db), days: int = 30):
    if not current.weight:
        raise HTTPException(status_code=400, detail="Current weight unknown")
    days = min(max(days,7), 90)
    logs = db.query(DailyLog).filter(DailyLog.user_id==current.id, DailyLog.deficit!=None).order_by(DailyLog.date.desc()).limit(14).all()
    if not logs:
        raise HTTPException(status_code=400, detail="Not enough data")
    avg_deficit = sum(l.deficit or 0 for l in logs) / len(logs)
    daily_weight_change = (avg_deficit / 7700.0)
    weekly_change = daily_weight_change * 7
    start_date = datetime.utcnow().date()
    start_weight = current.weight
    points: List[WeightForecastPoint] = []
    cumulative_deficit = 0.0
    for d in range(0, days+1):
        date = start_date + timedelta(days=d)
        est_weight = start_weight - daily_weight_change * d
        cumulative_deficit += avg_deficit
        points.append(WeightForecastPoint(day=d, date=date.isoformat(), est_weight=round(est_weight,2), cumulative_deficit=round(cumulative_deficit,1)))
    return WeightForecastResponse(
        start_weight=start_weight,
        target_weight=current.target_weight,
        daily_avg_deficit=round(avg_deficit,1),
        weekly_change_kg=round(weekly_change,3),
        points=points,
        method="avg_deficit_14d"
    )

# --- Macro Goals ---
@app.get("/goals/macros", response_model=MacroGoals)
async def macro_goals(current: User = Depends(get_current_user)):
    if not current.daily_calories and not current.tdee:
        raise HTTPException(status_code=400, detail="Calorie target unknown")
    calories = current.daily_calories or current.tdee
    if not calories:
        raise HTTPException(status_code=400, detail="Calorie target unavailable")
    weight = current.weight or 70
    protein = weight * 1.7
    protein_kcal = protein * 4
    fat_kcal = calories * 0.28
    fat = fat_kcal / 9
    remaining_kcal = calories - protein_kcal - fat_kcal
    if remaining_kcal < 0:
        remaining_kcal = max(calories * 0.25, 0)
    carbs = remaining_kcal / 4
    total_assigned = protein_kcal + fat_kcal + remaining_kcal
    protein_pct = protein_kcal / total_assigned * 100 if total_assigned else 0
    fat_pct = fat_kcal / total_assigned * 100 if total_assigned else 0
    carbs_pct = remaining_kcal / total_assigned * 100 if total_assigned else 0
    return MacroGoals(
        calories=round(calories,0),
        protein_g=round(protein,1),
        fat_g=round(fat,1),
        carbs_g=round(carbs,1),
        protein_pct=round(protein_pct,1),
        fat_pct=round(fat_pct,1),
        carbs_pct=round(carbs_pct,1),
        method="protein_1.7g_per_kg_fat28pct"
    )
