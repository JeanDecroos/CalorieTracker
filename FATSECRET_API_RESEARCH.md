# FatSecret API Research Summary

## Overview

FatSecret Platform API provides access to a comprehensive food and nutrition database, supporting food search, barcode scanning, natural language processing, and image recognition for nutrition tracking applications.

## Authentication (OAuth 2.0)

### Your Credentials
- **Client ID**: `946e7fa5ffc74dd8bd8e133f2f4c4630`
- **Client Secret**: `82e3fcb1ab5c4447996d37c93ddbe91a` ⚠️ **Keep this secure - shown only once!**

### Authentication Flow

1. **Token Endpoint**: `https://oauth.fatsecret.com/connect/token`
2. **Method**: `POST`
3. **Authentication**: HTTP Basic Auth using `Client ID:Client Secret` (base64 encoded)
4. **Grant Type**: `client_credentials` (server-to-server)
5. **Token Lifetime**: 24 hours (86,400 seconds)

### Request Format
```
POST https://oauth.fatsecret.com/connect/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=basic
```

### Response Format
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

### Available Scopes
- `basic` - Basic food database access
- `premier` - Premier tier features
- `barcode` - Barcode scanning capabilities
- `localization` - Multi-region/language support
- `nlp` - Natural Language Processing
- `image-recognition` - Food image recognition

You can request multiple scopes: `scope=basic barcode localization`

## API Editions & Limits

### Basic (Free Tier) ⭐ **YOUR CURRENT TIER**
- **Daily Limit**: 5,000 API calls/day
- **Dataset**: US only
- **Attribution**: Required (must include FatSecret attribution in your app)
- **Available Scopes**: `basic` only
- **Available Endpoints**: 
  - `foods.search.v2` (or older versions)
  - `food.get.v3` (or older versions)
  - **NOT Available**: v4/v5 endpoints (require Premier), barcode scanning, NLP, image recognition
- **Features**: Standard food search and nutrition data for US foods only

### Premier Free
- **Daily Limit**: Unlimited
- **Dataset**: US only (by default)
- **Attribution**: Required
- **Features**: Access to premier features (barcode, localization, NLP) but US dataset only

### Premier (Business/Enterprise)
- **Daily Limit**: Unlimited
- **Dataset**: 50+ countries (56+)
- **Attribution**: White-label possible (no attribution required)
- **Features**: All features + support, SLA, custom contracts

## Key API Endpoints

### Base URL
`https://platform.fatsecret.com/rest/server.api`

### Main Endpoints

#### 1. Food Search
- **Method for Basic Tier**: `foods.search.v2` (or `foods.search`)
- **Method for Premier**: `foods.search.v4` (requires `premier` scope)
- **Scope**: `basic` (for v2) or `premier` (for v4)
- **Parameters**:
  - `search_expression` - Search query
  - `page_number` - Pagination
  - `max_results` - Results per page (max 50 for Basic tier)
  - `format` - json or xml
  - `region` - Country code (Basic tier: US only)
  - `language` - Language code (Basic tier: English only)
  - `include_food_images` - Include food images (may be limited on Basic tier)

**Note for Basic Tier**: You can only use v2 or older endpoints. v4 requires Premier tier.

#### 2. Get Food Details
- **Method for Basic Tier**: `food.get.v3` (or `food.get`)
- **Method for Premier**: `food.get.v5` or `food.get.v4` (requires `premier` scope)
- **Scope**: `basic` (for v3) or `premier` (for v4/v5)
- **Parameters**:
  - `food_id` - Food identifier
  - `format` - json or xml
  - `include_sub_categories` - Include subcategories
  - `include_food_images` - Include food images (may be limited on Basic tier)
  - `region` - Country code (Basic tier: US only)
  - `language` - Language code (Basic tier: English only)

**Note for Basic Tier**: You can only use v3 or older endpoints. v4/v5 require Premier tier and include standardized derived servings (100g, 100ml) for branded/manufactured foods.

#### 3. Barcode Lookup ⚠️ **NOT AVAILABLE ON BASIC TIER**
- **Method**: `food/barcode/find-by-id/v2`
- **Scope**: `barcode` + `premier` (Premier tier only)
- **Parameters**:
  - `barcode` - Barcode/UPC code
  - `include_sub_categories` - Include subcategories
  - `include_food_images` - Include food images
  - `region` - Country code
  - `language` - Language code

**Note**: Returns entire food object including nutrition data. **Requires Premier tier - not available on Basic (Free) tier.**

#### 4. Natural Language Processing ⚠️ **NOT AVAILABLE ON BASIC TIER**
- **Method**: `nlp.process`
- **Scope**: `nlp` (Premier exclusive)
- **Parameters**:
  - `text` - Free-text meal description (e.g., "Breakfast: toast with butter, an apple, and coffee")
  - `region` - Country code
  - `language` - Language code (supports 24 languages)

**Note**: Parses text into identified foods, portions, and nutrients. **Requires Premier tier - not available on Basic (Free) tier.**

#### 5. Image Recognition ⚠️ **NOT AVAILABLE ON BASIC TIER**
- **Method**: `image.recognition.v2`
- **Scope**: `image-recognition` (Premier exclusive)
- **Features**: 
  - Identifies food items from images
  - Handles mixed dishes
  - Faster and higher accuracy than v1

**Note**: **Requires Premier tier - not available on Basic (Free) tier.**

### API Request Format

All API calls use:
```
POST https://platform.fatsecret.com/rest/server.api
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "method": "foods.search.v4",
  "search_expression": "toast",
  "format": "json",
  "max_results": 20
}
```

Or as form data:
```
method=foods.search.v4&search_expression=toast&format=json&max_results=20
```

## Important Security Considerations

### ⚠️ Critical Security Requirements

1. **Never expose Client Secret in client-side code**
   - Keep it server-side only
   - Use a proxy server for token requests from mobile/web apps
   - If exposed, regenerate credentials immediately

2. **IP Whitelisting Required**
   - Token requests must come from whitelisted IP addresses
   - Configure IP ranges in your FatSecret dashboard
   - For Premier tier, you can use CIDR notation for IP ranges
   - Without proper IP whitelisting, token requests will fail

3. **Token Management**
   - Tokens expire after 24 hours
   - Implement token refresh logic
   - Store tokens securely
   - Monitor expiration and request new tokens before expiry

4. **HTTPS Only**
   - All API calls must use HTTPS
   - Never send credentials over unencrypted connections

## Data Features

### Recent Enhancements (2024-2025)

1. **Standardized Servings**: v4/v5 endpoints include standardized derived servings (100g, 100ml) for branded foods
2. **Allergens & Dietary Attributes**: Generic foods include allergen information (Egg, Fish, Gluten, etc.) and dietary tags (vegan, vegetarian)
3. **Enhanced Image Recognition**: v2 provides faster, more accurate food identification
4. **Multi-language NLP**: Supports 24 languages for natural language processing

## SDKs and Libraries

### Official/Community Wrappers

1. **fatsecret.js** (Node.js)
   - GitHub: https://github.com/muezz/fatsecret
   - Supports OAuth2, helper methods, auto token refresh

2. **pyfatsecret** (Python)
   - PyPI: https://pypi.org/project/fatsecret/
   - Version 0.5.0+ (Dec 2025)
   - Supports many public data endpoints

3. **fatsecret_nutrition** (Dart/Flutter)
   - Pub.dev: https://pub.dev/documentation/fatsecret_nutrition/latest/
   - Simple setup using environment variables

## Best Practices

1. **Version Selection**: Use newer endpoints (v4, v5) when available for better features
2. **Error Handling**: Handle errors like `invalid_scope`, expired tokens, unsupported regions
3. **Rate Limiting**: Monitor your daily API call usage (5,000/day for Basic tier)
4. **Attribution**: Include FatSecret attribution if using Basic or Premier Free tiers
5. **Regional Data**: Be aware that Basic tier is US-only; international data requires Premier
6. **Cost Considerations**: Some features (image recognition, NLP) may incur additional usage-based charges

## Next Steps

1. **Configure IP Whitelisting** in your FatSecret dashboard
2. **Test Token Request** using your Client ID and Secret
3. **Determine Required Scopes** based on your app's needs
4. **Choose API Edition** (Basic vs Premier) based on your requirements
5. **Implement Token Management** with automatic refresh
6. **Start with Basic Endpoints** like `foods.search` to test integration

## Example Implementation Flow

1. **Get Access Token**
   ```
   POST https://oauth.fatsecret.com/connect/token
   Authorization: Basic <base64(client_id:client_secret)>
   Body: grant_type=client_credentials&scope=basic
   ```

2. **Search for Foods** (Basic Tier - use v2)
   ```
   POST https://platform.fatsecret.com/rest/server.api
   Authorization: Bearer <access_token>
   Body: {
     "method": "foods.search.v2",
     "search_expression": "apple",
     "format": "json",
     "max_results": 10
   }
   ```

3. **Get Food Details** (Basic Tier - use v3)
   ```
   POST https://platform.fatsecret.com/rest/server.api
   Authorization: Bearer <access_token>
   Body: {
     "method": "food.get.v3",
     "food_id": "<food_id_from_search>",
     "format": "json"
   }
   ```

## Additional Resources

- **Official Documentation**: https://platform.fatsecret.com/docs
- **API Editions**: https://platform.fatsecret.com/api-editions
- **Postman Collection**: Available in FatSecret's Postman workspace
- **Blog Updates**: https://blog.fatsecret.com/ (for latest features and updates)

---

**Last Updated**: January 2026
**Credentials Status**: ⚠️ Client Secret shown only once - keep secure!
