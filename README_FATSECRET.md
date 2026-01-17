# FatSecret API Integration Guide

This directory contains research and example code for integrating with the FatSecret Platform API.

## Files

- **FATSECRET_API_RESEARCH.md** - Comprehensive research document with all API details
- **fatsecret_example.py** - Python implementation example
- **fatsecret_example.js** - Node.js implementation example

## Quick Start

### Your Tier: Basic (Free) ⭐

You're on the **Basic (Free) tier**, which includes:
- ✅ 5,000 API calls per day
- ✅ Food search and nutrition data
- ✅ US dataset (foods from United States)
- ⚠️ Attribution required in your app
- ❌ No barcode scanning
- ❌ No NLP (Natural Language Processing)
- ❌ No image recognition
- ❌ Only v2/v3 endpoints (not v4/v5)

### Prerequisites

1. **IP Whitelisting**: Configure your server IP address in the FatSecret dashboard
   - Go to your FatSecret app settings
   - Add your server's IP address
   - Without this, token requests will fail

2. **Install Dependencies**

   For Python:
   ```bash
   pip install requests
   ```

   For Node.js:
   ```bash
   npm install axios
   ```

### Your Credentials

- **Client ID**: `946e7fa5ffc74dd8bd8e133f2f4c4630`
- **Client Secret**: `82e3fcb1ab5c4447996d37c93ddbe91a` ⚠️ **Keep secure!**

### Basic Usage

#### Python Example
```python
from fatsecret_example import FatSecretAPI

api = FatSecretAPI(CLIENT_ID, CLIENT_SECRET)

# Search for foods
results = api.search_foods("apple", max_results=10)

# Get food details
food_details = api.get_food(food_id)
```

#### Node.js Example
```javascript
const FatSecretAPI = require('./fatsecret_example');

const api = new FatSecretAPI(CLIENT_ID, CLIENT_SECRET);

// Search for foods
const results = await api.searchFoods('apple', 10);

// Get food details
const foodDetails = await api.getFood(foodId);
```

## Important Notes for Basic Tier

1. **Security**: Never expose your Client Secret in client-side code
2. **Token Expiration**: Tokens expire after 24 hours - implement refresh logic
3. **Rate Limits**: **5,000 API calls/day limit** - monitor your usage
4. **Scopes**: You can only use the `basic` scope - no premier, barcode, nlp, or image-recognition
5. **IP Whitelisting**: Required for token requests - configure in dashboard
6. **Endpoints**: Use `foods.search.v2` and `food.get.v3` (not v4/v5 which require Premier)
7. **Attribution**: You must include FatSecret attribution in your app
8. **Dataset**: US foods only - international foods require Premier tier

## Common Issues

### "Invalid IP" Error
- **Solution**: Add your server IP to the whitelist in FatSecret dashboard

### "Invalid Scope" Error
- **Solution**: You're on Basic tier - only use `basic` scope. Features like barcode, NLP, and image recognition require Premier tier.

### Token Expired
- **Solution**: Implement automatic token refresh (examples include this logic)

## Next Steps

1. Review **FATSECRET_API_RESEARCH.md** for complete API documentation
2. **Configure IP Whitelisting** in your FatSecret dashboard (required!)
3. Test the example code with your credentials
4. Customize the implementation for your calorie tracking app
5. **Add FatSecret attribution** to your app (required for Basic tier)
6. Monitor your API usage (5,000 calls/day limit)

## Upgrading to Premier

If you need:
- More than 5,000 API calls/day
- Barcode scanning
- NLP (Natural Language Processing)
- Image recognition
- International food databases
- White-label (no attribution)

Consider applying for **Premier Free** (for startups/non-profits/students) or **Premier Business** tier.

## Resources

- [FatSecret Platform Documentation](https://platform.fatsecret.com/docs)
- [API Editions & Pricing](https://platform.fatsecret.com/api-editions)
- [Postman Collection](https://www.postman.com/fatsecret/fatsecret-public-apis)
