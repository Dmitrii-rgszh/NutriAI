from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import SessionLocal, engine
from .models import Base, User, Meal, DailyLog, WeightEntry
from .schemas import (
    UserCreate, UserOut, UserProfileUpdate, DailySummary, HistoryResponse, HistoryDay,
    WeightForecastResponse, WeightForecastPoint, MacroGoals,
    PhotoMealResponse, PhotoAnalysisResult
)
from .meal_schemas import MealCreate, MealOut, MealUpdate
from .utils import recalc_energy
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
    for field, value in payload.model_dump(exclude={"telegram_id"}).items():
        if value is not None:
            setattr(user, field, value)
    recalc_energy(user)
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
    
    recalc_energy(user)
    
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
    from sqlalchemy import func as sa_func
    today = datetime.utcnow().strftime('%Y-%m-%d')
    total = db.query(sa_func.coalesce(sa_func.sum(Meal.calories), 0)).filter(
        Meal.user_id==user.id,
        sa_func.strftime('%Y-%m-%d', Meal.created_at)==today
    ).scalar()
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

# ---- Profile Extensions ----
from pydantic import BaseModel as _BM
from datetime import datetime as _dt

def _today():
    return _dt.utcnow().strftime('%Y-%m-%d')

class WeightEntryIn(_BM):
    date: Optional[str] = None  # YYYY-MM-DD
    weight_kg: float
    source: Optional[str] = "manual"

class WeightEntryOut(_BM):
    date: str
    weight_kg: float
    source: Optional[str]

class WeightHistoryResponse(_BM):
    entries: List[WeightEntryOut]

class WaterIntakeIn(_BM):
    amount_l: float
    date: Optional[str] = None

class SleepLogIn(_BM):
    hours: float
    date: Optional[str] = None

class OverviewResponse(_BM):
    user: dict
    today: dict
    weight: Optional[dict]
    streak: dict
    achievements: List[dict]
    recent_meals: List[dict]
    macros: Optional[dict] = None
    next_tip: Optional[str] = None
    day_score: Optional[int] = None
    meals_grouped: Optional[dict] = None

@app.post('/profile/weight', response_model=WeightEntryOut)
async def add_weight(entry: WeightEntryIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    date = entry.date or _today()
    we = db.query(WeightEntry).filter(WeightEntry.user_id==current.id, WeightEntry.date==date).first()
    if not we:
        we = WeightEntry(user_id=current.id, date=date, weight_kg=entry.weight_kg, source=entry.source)
        db.add(we)
    else:
        we.weight_kg = entry.weight_kg
        we.source = entry.source or we.source
    if date == _today():
        current.weight = entry.weight_kg
        recalc_energy(current)
    db.commit(); db.refresh(we)
    return WeightEntryOut(date=we.date, weight_kg=we.weight_kg, source=we.source)

@app.get('/profile/weight/history', response_model=WeightHistoryResponse)
async def weight_history(days: int = 30, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    days = min(max(days,1), 120)
    q = db.query(WeightEntry).filter(WeightEntry.user_id==current.id).order_by(WeightEntry.date.desc()).limit(days).all()
    return WeightHistoryResponse(entries=[WeightEntryOut(date=w.date, weight_kg=w.weight_kg, source=w.source) for w in reversed(q)])

@app.post('/profile/water')
async def add_water(payload: WaterIntakeIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    date = payload.date or _today()
    log = db.query(DailyLog).filter(DailyLog.user_id==current.id, DailyLog.date==date).first()
    if not log:
        log = DailyLog(user_id=current.id, date=date, calories=0)
        db.add(log)
    log.water_l = (log.water_l or 0) + payload.amount_l
    db.commit()
    return {"date": date, "water_l": log.water_l}

@app.post('/profile/sleep')
async def set_sleep(payload: SleepLogIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    date = payload.date or _today()
    log = db.query(DailyLog).filter(DailyLog.user_id==current.id, DailyLog.date==date).first()
    if not log:
        log = DailyLog(user_id=current.id, date=date, calories=0)
        db.add(log)
    log.sleep_h = payload.hours
    db.commit()
    return {"date": date, "sleep_h": log.sleep_h}

@app.get('/profile/overview', response_model=OverviewResponse)
async def profile_overview(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = _today()
    log = db.query(DailyLog).filter(DailyLog.user_id==current.id, DailyLog.date==today).first()
    if not log:
        _recalc_today_log(db, current)
        log = db.query(DailyLog).filter(DailyLog.user_id==current.id, DailyLog.date==today).first()
    meals = db.query(Meal).filter(Meal.user_id==current.id).order_by(Meal.created_at.desc()).limit(5).all()
    # Meals for today (for macro sums)
    from sqlalchemy import func as _f
    today_meals = db.query(Meal).filter(
        Meal.user_id==current.id,
        _f.strftime('%Y-%m-%d', Meal.created_at)==today
    ).all()
    recent_meals = [ { 'id': m.id, 'food_name': m.food_name, 'calories': m.calories } for m in meals ]
    wq = db.query(WeightEntry).filter(WeightEntry.user_id==current.id).order_by(WeightEntry.date.desc()).limit(2).all()
    weight_block = None
    if wq:
        last = wq[0]
        prev = wq[1] if len(wq) > 1 else None
        diff = (last.weight_kg - prev.weight_kg) if prev else None
        weight_block = {
            'current': last.weight_kg,
            'diff_from_prev': diff,
            'target': current.target_weight
        }
    # streak
    from datetime import timedelta as _td, datetime as _dt2
    streak_days = 0
    d_cursor = _dt2.utcnow().date()
    for _ in range(120):
        ds = d_cursor.strftime('%Y-%m-%d')
        l = db.query(DailyLog).filter(DailyLog.user_id==current.id, DailyLog.date==ds).first()
        if l and l.calories and l.calories > 0:
            streak_days += 1
            d_cursor = d_cursor - _td(days=1)
        else:
            break
    streak = { 'current_days': streak_days, 'longest_days': streak_days }
    cal_target = current.daily_calories
    calories = log.calories if log else 0
    percent = round((calories / cal_target * 100),1) if cal_target else 0
    zone = 'ok'
    if cal_target:
        if percent < 90: zone = 'under'
        elif percent > 105: zone = 'over'
    # Macro goals (reuse logic inline to avoid second endpoint call)
    macro_block = None
    if (current.daily_calories or current.tdee) and today_meals:
        calories_goal = current.daily_calories or current.tdee
        weight_ref = current.weight or 70
        protein_goal = weight_ref * 1.7
        protein_kcal = protein_goal * 4
        fat_kcal_goal = calories_goal * 0.28
        fat_goal = fat_kcal_goal / 9
        remaining_kcal = calories_goal - protein_kcal - fat_kcal_goal
        if remaining_kcal < 0:
            remaining_kcal = max(calories_goal * 0.25, 0)
        carbs_goal = remaining_kcal / 4
        # Consumed
        p_val = sum(m.protein for m in today_meals)
        c_val = sum(m.carbs for m in today_meals)
        f_val = sum(m.fat for m in today_meals)
        macro_block = {
            'protein': { 'value': round(p_val,1), 'target': round(protein_goal,1), 'percent': (round(p_val / protein_goal *100,1) if protein_goal else None) },
            'carbs': { 'value': round(c_val,1), 'target': round(carbs_goal,1), 'percent': (round(c_val / carbs_goal *100,1) if carbs_goal else None) },
            'fat': { 'value': round(f_val,1), 'target': round(fat_goal,1), 'percent': (round(f_val / fat_goal *100,1) if fat_goal else None) }
        }
    today_block = {
        'date': today,
        'calories': { 'value': calories, 'target': cal_target, 'percent': percent, 'zone': zone },
        'water_l': { 'value': (log.water_l if log else 0), 'target': current.water_intake, 'percent': ((log.water_l / current.water_intake *100) if log and log.water_l and current.water_intake else None) },
    'sleep_h': { 'value': (log.sleep_h if log else None), 'target': 8 },
    'meals_count': len(today_meals)
    }
    # Achievements (ephemeral calculation)
    ach: List[dict] = []
    total_meals = db.query(Meal).filter(Meal.user_id==current.id).count()
    if total_meals >= 1: ach.append({'id':'first_meal','title':'Первое блюдо'})
    if total_meals >= 5: ach.append({'id':'five_meals','title':'5 блюд'})
    if streak_days >= 3: ach.append({'id':'streak_3','title':'Стрик 3 дня'})
    if streak_days >= 7: ach.append({'id':'streak_7','title':'Стрик 7 дней'})
    if log and current.water_intake and log.water_l and log.water_l >= current.water_intake: ach.append({'id':'water_goal','title':'Цель по воде'})
    if log and log.sleep_h and log.sleep_h >= 8: ach.append({'id':'sleep_8h','title':'Сон 8 часов'})
    w_today = db.query(WeightEntry).filter(WeightEntry.user_id==current.id, WeightEntry.date==today).first()
    if w_today: ach.append({'id':'weight_logged','title':'Вес обновлён'})
    # Meals grouped (today)
    meals_grouped = None
    if today_meals:
        groups = {}
        for m in today_meals:
            mt = m.meal_type or 'other'
            if mt not in groups:
                groups[mt] = { 'count': 0, 'calories': 0, 'protein': 0.0, 'carbs': 0.0, 'fat': 0.0 }
            g = groups[mt]
            g['count'] += 1
            g['calories'] += m.calories or 0
            g['protein'] += m.protein or 0
            g['carbs'] += m.carbs or 0
            g['fat'] += m.fat or 0
        # round macro sums
        for v in groups.values():
            v['protein'] = round(v['protein'],1)
            v['carbs'] = round(v['carbs'],1)
            v['fat'] = round(v['fat'],1)
        meals_grouped = groups

    # Day score (0-100) simple heuristic
    day_score = None
    if log:
        score = 0
        # Calories component (0-40)
        if cal_target and calories:
            pct = calories / cal_target
            if 0.9 <= pct <= 1.05: score += 40
            elif (0.8 <= pct < 0.9) or (1.05 < pct <= 1.15): score += 30
            elif (0.6 <= pct < 0.8) or (1.15 < pct <= 1.3): score += 20
            else: score += 10
        # Water (0-20)
        if current.water_intake:
            wv = (log.water_l or 0)
            w_pct = (wv / current.water_intake) if current.water_intake else 0
            if w_pct >= 1: score += 20
            else: score += int(min(w_pct,1)*20)
        # Sleep (0-15)
        if log.sleep_h:
            sh = log.sleep_h
            if 7 <= sh <= 9: score += 15
            elif sh >= 6: score += 10
            elif sh >= 5: score += 6
            else: score += 2
        # Macros (0-25)
        if macro_block:
            percents = []
            for k in ['protein','carbs','fat']:
                p = macro_block[k]['percent']
                if p is not None:
                    percents.append(min(p,100))
            if percents:
                avg = sum(percents)/len(percents)
                score += int(round(avg/100 * 25))
        day_score = min(score,100)

    # Next tip logic (server-side)
    next_tip = None
    if macro_block:
        protein_gap = macro_block['protein']['target'] - macro_block['protein']['value'] if macro_block['protein']['target'] else 0
        fat_pct = macro_block['fat']['percent'] or 0
        if protein_gap > 15:
            next_tip = 'Добавьте источник белка (творог / курица / йогурт)'
        elif fat_pct < 40 and today_block['meals_count'] >= 2:
            next_tip = 'Немного полезных жиров (орехи / оливковое масло)'
        elif today_block['calories']['percent'] < 60:
            next_tip = 'Спланируйте основной приём пищи заранее'
    if not next_tip and day_score is not None:
        if day_score >= 80:
            next_tip = 'Отличный прогресс! Поддерживайте темп'
        elif day_score < 50:
            next_tip = 'Сконцентрируйтесь на базовых целях: калории, вода, сон'

    return OverviewResponse(
        user={'id': current.id, 'telegram_id': current.telegram_id, 'goal': current.goal, 'gender': current.gender},
        today=today_block,
        weight=weight_block,
        streak=streak,
        achievements=ach,
        recent_meals=recent_meals,
        macros=macro_block,
        next_tip=next_tip,
        day_score=day_score,
        meals_grouped=meals_grouped
    )
