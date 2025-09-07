from .models import User

ACTIVITY_MAP = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very_active': 1.9
}

GOAL_ADJUST = {
    'lose': -0.20,
    'maintain': 0.0,
    'gain': 0.15
}

def recalc_energy(user: User):
    """Populate user.bmr, user.tdee, user.daily_calories if enough data."""
    if not (user.age and user.gender and user.height and user.weight):
        return
    # BMR (Mifflin-St Jeor)
    if user.gender == 'male':
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
    elif user.gender == 'female':
        bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161
    else:
        bmr_m = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5
        bmr_f = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161
        bmr = (bmr_m + bmr_f) / 2

    factor = user.activity_multiplier or ACTIVITY_MAP.get(user.activity_level or 'sedentary', 1.2)
    tdee = bmr * factor
    adj = GOAL_ADJUST.get(user.goal or 'maintain', 0.0)
    daily = tdee * (1 + adj)
    user.bmr = round(bmr, 1)
    user.tdee = round(tdee, 1)
    user.daily_calories = round(daily, 0)
