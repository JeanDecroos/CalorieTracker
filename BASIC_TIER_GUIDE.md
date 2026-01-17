# FatSecret API - Basic (Free) Tier Guide

## ✅ What You CAN Do

### Available Features
- ✅ **Food Search**: Search the US food database
- ✅ **Food Details**: Get detailed nutrition information for foods
- ✅ **5,000 API Calls/Day**: Free tier includes 5,000 requests per day
- ✅ **US Food Database**: Access to comprehensive US food and nutrition data

### Available Endpoints
- ✅ `foods.search.v2` - Search for foods
- ✅ `food.get.v3` - Get food details and nutrition info
- ✅ Older versions of these endpoints

### Available Scope
- ✅ `basic` - This is the only scope you have access to

## ❌ What You CANNOT Do

### Unavailable Features
- ❌ **Barcode Scanning**: Requires Premier tier with `barcode` scope
- ❌ **NLP (Natural Language Processing)**: Requires Premier tier with `nlp` scope
- ❌ **Image Recognition**: Requires Premier tier with `image-recognition` scope
- ❌ **International Foods**: Only US foods available (international requires Premier)
- ❌ **v4/v5 Endpoints**: Newer endpoints require Premier tier

### Limitations
- ❌ **Rate Limit**: 5,000 API calls/day (not unlimited)
- ❌ **Attribution Required**: Must include FatSecret attribution in your app
- ❌ **US Only**: Food database limited to United States foods
- ❌ **No White-Label**: Attribution cannot be removed (requires Premier Business)

## 📋 Requirements

### Must-Have Setup
1. **IP Whitelisting**: Your server IP must be whitelisted in FatSecret dashboard
2. **Attribution**: Include "Powered by FatSecret" or similar attribution in your app
3. **Basic Scope Only**: Only request `scope=basic` when getting tokens

## 💻 Code Examples

### Getting Access Token (Basic Tier)
```python
# Python
api.get_access_token(scopes="basic")  # Only use "basic" scope
```

```javascript
// Node.js
await api.getAccessToken('basic');  // Only use "basic" scope
```

### Searching Foods (Basic Tier)
```python
# Python - Uses v2 endpoint automatically
results = api.search_foods("apple", max_results=20)
```

```javascript
// Node.js - Uses v2 endpoint automatically
const results = await api.searchFoods('apple', 20);
```

### Getting Food Details (Basic Tier)
```python
# Python - Uses v3 endpoint automatically
food_details = api.get_food(food_id)
```

```javascript
// Node.js - Uses v3 endpoint automatically
const foodDetails = await api.getFood(foodId);
```

## 📊 Daily Usage Monitoring

### Rate Limit Management
- **Limit**: 5,000 API calls per day
- **Reset**: Daily (resets at midnight UTC)
- **Monitoring**: Track your usage to avoid hitting the limit

### Tips to Stay Within Limit
1. **Cache Results**: Cache frequently searched foods
2. **Batch Requests**: Get multiple food details in fewer requests when possible
3. **Pagination**: Use pagination efficiently (max 50 results per request)
4. **Monitor Usage**: Track your daily API call count

## 🚀 Upgrading to Premier

If you need more features, consider:

### Premier Free
- For startups, non-profits, or students
- Unlimited API calls
- Access to barcode, NLP, and other premier features
- Still requires attribution
- Still US dataset only (unless special arrangement)

### Premier Business
- Unlimited API calls
- International food databases (50+ countries)
- White-label option (no attribution required)
- All features available
- Custom contracts and support

## ⚠️ Common Mistakes to Avoid

1. **Don't request premier/barcode/nlp scopes** - You only have `basic` scope
2. **Don't use v4/v5 endpoints** - Use v2/v3 instead
3. **Don't forget IP whitelisting** - Token requests will fail without it
4. **Don't forget attribution** - Required for Basic tier
5. **Don't exceed 5,000 calls/day** - Plan your usage accordingly

## 📝 Example: Complete Basic Tier Workflow

```python
from fatsecret_example import FatSecretAPI

# Initialize with your credentials
api = FatSecretAPI(CLIENT_ID, CLIENT_SECRET)

# 1. Search for foods (uses v2, basic scope)
results = api.search_foods("chicken breast", max_results=10)

# 2. Get details for first result (uses v3, basic scope)
if results and "foods" in results:
    first_food = results["foods"]["food"][0]
    food_id = first_food["food_id"]
    details = api.get_food(food_id)
    
    # Use the nutrition data
    print(f"Food: {details['food']['food_name']}")
    print(f"Calories: {details['food']['servings']['serving'][0]['calories']}")
```

## 🔗 Quick Links

- **Full Documentation**: See `FATSECRET_API_RESEARCH.md`
- **Code Examples**: See `fatsecret_example.py` or `fatsecret_example.js`
- **Quick Start**: See `README_FATSECRET.md`
- **FatSecret Dashboard**: https://platform.fatsecret.com/

---

**Remember**: You're on the Basic (Free) tier - stick to `basic` scope and v2/v3 endpoints!
