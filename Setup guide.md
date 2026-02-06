# CaloClash - Phase 1 Setup Guide

## What You Have Now

✅ **OnboardingSurvey.js** - Complete 6-step survey with:
- Medical disclaimer
- Gender selection
- Age, weight, height input
- Activity level selection
- Goal selection (lose/gain/maintain weight)
- Pace selection (slow/moderate/fast)
- BMR & TDEE calculations using Mifflin-St Jeor equation
- Automatic calorie and macro calculations

✅ **CalorieTracker.js** - Main tracking screen with:
- Daily calorie goal display
- Calories remaining calculator
- Macro tracking (Protein, Carbs, Fats)
- Progress rings for each macro
- Meal logging by type (breakfast, lunch, dinner, snack)
- Add/delete meals functionality
- Plan details display (BMR, TDEE, Goal, Pace)
- Medical disclaimer banner

✅ **App.js** - Navigation setup between screens

## Required Dependencies

You'll need to install these packages. Run in your project directory:

```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
```

If using Expo:
```bash
npx expo install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler react-native-reanimated
```

## File Structure

Place the files in your project like this:

```
your-project/
├── App.js
├── OnboardingSurvey.js
├── CalorieTracker.js
└── package.json
```

## How It Works

### 1. OnboardingSurvey Flow:
- **Step 1**: Medical disclaimer (required acknowledgment)
- **Step 2**: Gender selection (male/female)
- **Step 3**: Basic info (age, weight in kg, height in cm)
- **Step 4**: Activity level (sedentary to extremely active)
- **Step 5**: Goal (lose/gain/maintain weight)
- **Step 6**: Pace (slow/moderate/aggressive)

### 2. BMR Calculation:
Uses the **Mifflin-St Jeor Equation**:
- Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
- Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

### 3. TDEE Calculation:
BMR × Activity Level Multiplier:
- Sedentary: 1.2
- Lightly Active: 1.375
- Moderately Active: 1.55
- Very Active: 1.725
- Extremely Active: 1.9

### 4. Daily Calorie Target:
- **Lose weight**: TDEE - (250/500/750 calories based on pace)
- **Gain weight**: TDEE + (250/500/750 calories based on pace)
- **Maintain**: TDEE

### 5. Macro Distribution:
- Protein: 30% of calories (4 cal/g)
- Carbs: 40% of calories (4 cal/g)
- Fats: 30% of calories (9 cal/g)

## Features Included

### OnboardingSurvey:
- ✅ Progress bar showing current step
- ✅ Back/Next navigation
- ✅ Form validation
- ✅ Clean, modern UI
- ✅ Medical disclaimer

### CalorieTracker:
- ✅ Display daily calorie goal
- ✅ Show calories remaining
- ✅ Track protein, carbs, fats with progress rings
- ✅ Add meals with macros
- ✅ Organize meals by type (breakfast/lunch/dinner/snack)
- ✅ Delete meals (long press)
- ✅ Visual progress bars
- ✅ Color-coded progress (green → yellow → red)
- ✅ Plan details section (BMR, TDEE, etc.)
- ✅ Medical disclaimer banner

## Next Steps (Phase 2)

After testing Phase 1, you can add:
1. Points system (earn points per logged meal)
2. Streak tracking (consecutive days)
3. Save data to Firebase
4. Quick add favorite meals
5. Food database integration
6. Water tracking

## Testing Tips

1. **Test the survey flow**: Go through all 6 steps
2. **Try different inputs**: 
   - Male vs Female (different BMR)
   - Different activity levels
   - Different goals (lose/gain/maintain)
   - Different paces
3. **Test meal logging**:
   - Add meals with all macros
   - Add meals with only calories
   - Delete meals
   - Try different meal types
4. **Check calculations**:
   - Verify calories remaining updates
   - Check macro progress rings
   - Ensure progress bars fill correctly

## Example User Journey

1. User opens app → sees disclaimer
2. User selects gender → Male
3. User enters: Age 25, Weight 80kg, Height 180cm
4. User selects: Moderately Active
5. User selects: Lose Weight
6. User selects: Moderate Pace (1 lb/week)
7. **Calculation Results**:
   - BMR ≈ 1825 calories
   - TDEE ≈ 2829 calories
   - Daily Goal ≈ 2329 calories (-500 for weight loss)
   - Protein: 175g | Carbs: 233g | Fats: 78g
8. User lands on tracker and starts logging meals!

## Color Scheme

- Primary: #4CAF50 (Green)
- Warning: #FFC107 (Yellow)
- Danger: #F44336 (Red)
- Background: #f5f5f5 (Light Gray)
- Cards: #ffffff (White)

## Notes

- All measurements use metric (kg, cm)
- You can easily add imperial (lbs, inches) conversion later
- Macro percentages can be customized based on user goals
- The formula is scientifically sound but simplified
- Long press on meals to delete them