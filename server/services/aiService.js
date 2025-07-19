const axios = require('axios');
const sharp = require('sharp');

class AIService {
    constructor() {
        this.claudeApiKey = process.env.CLAUDE_API_KEY;
        this.usdaApiKey = process.env.USDA_API_KEY;
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    // 🤖 Main food recognition method
    async recognizeFood(imageBuffer) {
        try {
            if (!this.isProduction || !this.claudeApiKey) {
                // Return mock data for development
                return this.getMockRecognitionResult();
            }

            // Optimize image for AI processing
            const optimizedImage = await sharp(imageBuffer)
                .resize(1024, 1024, { fit: 'inside' })
                .jpeg({ quality: 85 })
                .toBuffer();

            // Convert to base64
            const base64Image = optimizedImage.toString('base64');

            // Call Claude Vision API
            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: base64Image
                                }
                            },
                            {
                                type: 'text',
                                text: this.getFoodRecognitionPrompt()
                            }
                        ]
                    }]
                },
                {
                    headers: {
                        'x-api-key': this.claudeApiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    }
                }
            );

            const result = JSON.parse(response.data.content[0].text);

            // Enrich with nutrition data
            for (let item of result.items) {
                const nutrients = await this.getNutrients(item.name_en, item.portion_grams);
                item.nutrients = nutrients;
            }

            return result;

        } catch (error) {
            console.error('AI recognition error:', error);
            
            if (error.response?.status === 429) {
                throw new Error('AI service rate limit exceeded');
            }
            
            if (error.response?.status >= 500) {
                throw new Error('AI service temporarily unavailable');
            }
            
            // Fallback to mock data on error
            console.warn('Falling back to mock data due to AI error');
            return this.getMockRecognitionResult();
        }
    }

    // 📝 Generate prompt for food recognition
    getFoodRecognitionPrompt() {
        return `Analyze this food photo and identify all food items visible.

For each item provide:
1. Name in English and Russian
2. Estimated portion size in grams
3. Confidence level (0-100%)

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "name_en": "Grilled chicken breast",
      "name_ru": "Куриная грудка гриль",
      "portion_grams": 150,
      "confidence": 95
    }
  ],
  "total_confidence": 90
}

Important rules:
- Be very specific with food names
- Estimate realistic portion sizes
- Only include foods you can clearly see
- Use common Russian food names
- Return pure JSON only, no markdown or explanations`;
    }

    // 🍎 Get nutrition data for recognized food
    async getNutrients(foodName, portionGrams) {
        try {
            if (!this.usdaApiKey || !this.isProduction) {
                return this.getFallbackNutrients(foodName, portionGrams);
            }

            // Search USDA database
            const searchResponse = await axios.get(
                'https://api.nal.usda.gov/fdc/v1/foods/search',
                {
                    params: {
                        query: foodName,
                        pageSize: 5,
                        api_key: this.usdaApiKey
                    }
                }
            );

            if (searchResponse.data.foods.length === 0) {
                return this.getFallbackNutrients(foodName, portionGrams);
            }

            const food = searchResponse.data.foods[0];
            const nutrients = this.extractNutrients(food.foodNutrients);

            // Scale to portion size
            const multiplier = portionGrams / 100;
            return {
                calories: Math.round(nutrients.calories * multiplier),
                proteins: Math.round(nutrients.protein * multiplier * 10) / 10,
                fats: Math.round(nutrients.fat * multiplier * 10) / 10,
                carbs: Math.round(nutrients.carbs * multiplier * 10) / 10,
                fiber: Math.round(nutrients.fiber * multiplier * 10) / 10,
                sugar: Math.round(nutrients.sugar * multiplier * 10) / 10
            };

        } catch (error) {
            console.error('Nutrients fetch error:', error);
            return this.getFallbackNutrients(foodName, portionGrams);
        }
    }

    // 🧮 Extract nutrients from USDA response
    extractNutrients(nutrientsList) {
        const nutrients = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            fiber: 0,
            sugar: 0
        };

        const nutrientMap = {
            1008: 'calories',   // Energy
            1003: 'protein',    // Protein
            1004: 'fat',        // Total lipid (fat)
            1005: 'carbs',      // Carbohydrate, by difference
            1079: 'fiber',      // Fiber, total dietary
            2000: 'sugar'       // Total sugars
        };

        nutrientsList.forEach(item => {
            const key = nutrientMap[item.nutrientId];
            if (key) {
                nutrients[key] = item.value || 0;
            }
        });

        return nutrients;
    }

    // 🎭 Mock data for development/fallback
    getMockRecognitionResult() {
        const mockItems = [
            {
                name_en: "Grilled chicken breast",
                name_ru: "Куриная грудка гриль",
                portion_grams: 150,
                confidence: 95,
                nutrients: {
                    calories: 248,
                    proteins: 46.5,
                    fats: 5.4,
                    carbs: 0,
                    fiber: 0,
                    sugar: 0
                }
            },
            {
                name_en: "White rice",
                name_ru: "Рис белый",
                portion_grams: 100,
                confidence: 88,
                nutrients: {
                    calories: 130,
                    proteins: 2.7,
                    fats: 0.3,
                    carbs: 28,
                    fiber: 0.4,
                    sugar: 0.1
                }
            }
        ];

        // Return 1-3 random items
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const selectedItems = mockItems.slice(0, itemCount);

        return {
            items: selectedItems,
            total_confidence: selectedItems.reduce((sum, item) => sum + item.confidence, 0) / selectedItems.length
        };
    }

    // 📊 Fallback nutrition data for common foods
    getFallbackNutrients(foodName, portionGrams) {
        const fallbackDB = {
            // Proteins
            'chicken': { calories: 165, proteins: 31, fats: 3.6, carbs: 0, fiber: 0, sugar: 0 },
            'beef': { calories: 250, proteins: 26, fats: 17, carbs: 0, fiber: 0, sugar: 0 },
            'fish': { calories: 206, proteins: 22, fats: 12, carbs: 0, fiber: 0, sugar: 0 },
            'eggs': { calories: 155, proteins: 13, fats: 11, carbs: 1.1, fiber: 0, sugar: 1.1 },
            
            // Carbs
            'rice': { calories: 130, proteins: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, sugar: 0.1 },
            'pasta': { calories: 131, proteins: 5, fats: 1.1, carbs: 25, fiber: 1.8, sugar: 0.8 },
            'bread': { calories: 265, proteins: 9, fats: 3.2, carbs: 49, fiber: 2.7, sugar: 5 },
            'potato': { calories: 77, proteins: 2, fats: 0.1, carbs: 17, fiber: 2.2, sugar: 0.8 },
            
            // Fruits
            'apple': { calories: 52, proteins: 0.3, fats: 0.2, carbs: 14, fiber: 2.4, sugar: 10 },
            'banana': { calories: 89, proteins: 1.1, fats: 0.3, carbs: 23, fiber: 2.6, sugar: 12 },
            'orange': { calories: 47, proteins: 0.9, fats: 0.1, carbs: 12, fiber: 2.4, sugar: 9 },
            
            // Vegetables
            'tomato': { calories: 18, proteins: 0.9, fats: 0.2, carbs: 3.9, fiber: 1.2, sugar: 2.6 },
            'cucumber': { calories: 16, proteins: 0.7, fats: 0.1, carbs: 4, fiber: 0.5, sugar: 1.7 },
            'carrot': { calories: 41, proteins: 0.9, fats: 0.2, carbs: 10, fiber: 2.8, sugar: 4.7 }
        };

        // Find matching food
        const key = Object.keys(fallbackDB).find(k => 
            foodName.toLowerCase().includes(k)
        );

        const baseNutrients = fallbackDB[key] || {
            calories: 150, proteins: 10, fats: 5, carbs: 20, fiber: 2, sugar: 5
        };

        // Scale to portion
        const multiplier = portionGrams / 100;
        return {
            calories: Math.round(baseNutrients.calories * multiplier),
            proteins: Math.round(baseNutrients.proteins * multiplier * 10) / 10,
            fats: Math.round(baseNutrients.fats * multiplier * 10) / 10,
            carbs: Math.round(baseNutrients.carbs * multiplier * 10) / 10,
            fiber: Math.round(baseNutrients.fiber * multiplier * 10) / 10,
            sugar: Math.round(baseNutrients.sugar * multiplier * 10) / 10
        };
    }

    // 💡 Generate AI recommendations
    async generateRecommendations(userId, nutritionData) {
        try {
            if (!this.claudeApiKey || !this.isProduction) {
                return this.getMockRecommendations();
            }

            const prompt = `Based on this nutrition data, provide personalized recommendations:

User goals: ${nutritionData.goal}
Today's intake: 
- Calories: ${nutritionData.consumed.calories}/${nutritionData.target.calories}
- Proteins: ${nutritionData.consumed.proteins}g/${nutritionData.target.proteins}g
- Fats: ${nutritionData.consumed.fats}g/${nutritionData.target.fats}g
- Carbs: ${nutritionData.consumed.carbs}g/${nutritionData.target.carbs}g

Provide 3 specific, actionable recommendations in Russian.
Focus on: meal timing, food choices, portion adjustments.
Keep each recommendation under 50 words.

Return as JSON: {"recommendations": ["...", "...", "..."]}`;

            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                },
                {
                    headers: {
                        'x-api-key': this.claudeApiKey,
                        'anthropic-version': '2023-06-01'
                    }
                }
            );

            return JSON.parse(response.data.content[0].text);

        } catch (error) {
            console.error('Recommendations error:', error);
            return this.getMockRecommendations();
        }
    }

    // 🎭 Mock recommendations
    getMockRecommendations() {
        const recommendations = [
            "Старайтесь распределить белки равномерно между приемами пищи",
            "Добавьте больше овощей для увеличения объема пищи без лишних калорий",
            "Пейте стакан воды за 30 минут до еды для контроля аппетита",
            "Увеличьте потребление клетчатки - добавьте отруби или бобовые",
            "Перенесите углеводы на первую половину дня для лучшего усвоения",
            "Добавьте полезные жиры: орехи, авокадо или оливковое масло"
        ];

        // Return 3 random recommendations
        const shuffled = recommendations.sort(() => 0.5 - Math.random());
        return {
            recommendations: shuffled.slice(0, 3)
        };
    }
}

module.exports = new AIService();