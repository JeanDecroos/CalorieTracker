/**
 * FatSecret API Example Implementation (Node.js)
 * This is a basic example showing how to authenticate and use the FatSecret API.
 * 
 * Install dependencies: npm install axios
 */

const axios = require('axios');

class FatSecretAPI {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tokenUrl = 'https://oauth.fatsecret.com/connect/token';
        this.apiUrl = 'https://platform.fatsecret.com/rest/server.api';
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Get OAuth 2.0 access token using client credentials flow
     * @param {string} scopes - Space-separated list of scopes (e.g., "basic barcode")
     * @returns {Promise<string>} Access token
     */
    async getAccessToken(scopes = 'basic') {
        // Create Basic Auth header
        const credentials = `${this.clientId}:${this.clientSecret}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');

        const headers = {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const data = new URLSearchParams({
            'grant_type': 'client_credentials',
            'scope': scopes
        });

        try {
            const response = await axios.post(this.tokenUrl, data.toString(), { headers });
            
            this.accessToken = response.data.access_token;
            const expiresIn = response.data.expires_in || 86400; // Default 24 hours
            this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
            
            console.log(`✓ Access token obtained. Expires in ${expiresIn} seconds`);
            return this.accessToken;
            
        } catch (error) {
            console.error('✗ Error getting access token:', error.message);
            if (error.response) {
                console.error('Response:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Check if current token is still valid
     * @returns {boolean}
     */
    isTokenValid() {
        if (!this.accessToken || !this.tokenExpiresAt) {
            return false;
        }
        // Refresh 5 minutes early
        return new Date() < new Date(this.tokenExpiresAt.getTime() - 5 * 60 * 1000);
    }

    /**
     * Ensure we have a valid access token
     * @param {string} scopes - Required scopes
     */
    async ensureToken(scopes = 'basic') {
        if (!this.isTokenValid()) {
            await this.getAccessToken(scopes);
        }
    }

    /**
     * Make an API request to FatSecret
     * @param {string} method - API method name (e.g., "foods.search.v4")
     * @param {object} params - Additional parameters
     * @param {string} scopes - Required scopes for this request
     * @returns {Promise<object>} JSON response data
     */
    async apiRequest(method, params = {}, scopes = 'basic') {
        await this.ensureToken(scopes);

        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };

        const body = {
            method: method,
            format: 'json',
            ...params
        };

        try {
            const response = await axios.post(this.apiUrl, body, { headers });
            return response.data;
            
        } catch (error) {
            console.error('✗ API request failed:', error.message);
            if (error.response) {
                console.error('Response:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Search for foods
     * @param {string} query - Search term (e.g., "apple")
     * @param {number} maxResults - Maximum number of results (max 50 for Basic tier)
     * @param {number} pageNumber - Page number for pagination
     * @returns {Promise<object>} Search results
     * @note For Basic (Free) tier, uses foods.search.v2
     */
    async searchFoods(query, maxResults = 20, pageNumber = 0) {
        const params = {
            search_expression: query,
            max_results: Math.min(maxResults, 50),  // Basic tier limit
            page_number: pageNumber
        };

        // Basic tier uses v2 (v4 requires premier scope)
        return await this.apiRequest('foods.search.v2', params, 'basic');
    }

    /**
     * Get detailed information about a specific food
     * @param {string} foodId - Food identifier from search results
     * @returns {Promise<object>} Food details
     * @note For Basic (Free) tier, uses food.get.v3
     */
    async getFood(foodId) {
        const params = {
            food_id: foodId
        };

        // Basic tier uses v3 (v4/v5 require premier scope)
        return await this.apiRequest('food.get.v3', params, 'basic');
    }

    /**
     * Find food by barcode/UPC
     * @param {string} barcode - Barcode/UPC code
     * @returns {Promise<object>} Food information
     * @note Requires 'barcode' and 'premier' scopes
     */
    async findByBarcode(barcode) {
        const params = {
            barcode: barcode
        };

        return await this.apiRequest('food/barcode/find-by-id/v2', params, 'barcode premier');
    }
}

// Example usage
async function main() {
    // Your credentials
    const CLIENT_ID = '946e7fa5ffc74dd8bd8e133f2f4c4630';
    const CLIENT_SECRET = '82e3fcb1ab5c4447996d37c93ddbe91a';

    // Initialize API client
    const api = new FatSecretAPI(CLIENT_ID, CLIENT_SECRET);

    try {
        // Example 1: Search for foods
        console.log('\n=== Searching for "apple" ===');
        const searchResults = await api.searchFoods('apple', 5);
        console.log(JSON.stringify(searchResults, null, 2));

        // Example 2: Get food details (if we got results)
        if (searchResults && searchResults.foods && searchResults.foods.food) {
            const foods = Array.isArray(searchResults.foods.food) 
                ? searchResults.foods.food 
                : [searchResults.foods.food];
            
            if (foods.length > 0) {
                const firstFoodId = foods[0].food_id;
                console.log(`\n=== Getting details for food ID: ${firstFoodId} ===`);
                const foodDetails = await api.getFood(firstFoodId);
                console.log(JSON.stringify(foodDetails, null, 2));
            }
        }

        // Example 3: Barcode lookup (NOT available on Basic tier - requires Premier)
        // console.log('\n=== Looking up barcode ===');
        // const barcodeResult = await api.findByBarcode('0123456789012');
        // console.log(JSON.stringify(barcodeResult, null, 2));

    } catch (error) {
        console.error(`\n✗ Error: ${error.message}`);
        console.log('\nNote: Make sure:');
        console.log('1. Your IP address is whitelisted in FatSecret dashboard');
        console.log('2. You\'re using \'basic\' scope (you have Basic/Free tier)');
        console.log('3. You have axios installed: npm install axios');
        console.log('\nBasic Tier Limitations:');
        console.log('- 5,000 API calls per day');
        console.log('- US dataset only');
        console.log('- Only v2/v3 endpoints available (not v4/v5)');
        console.log('- No barcode scanning, NLP, or image recognition');
        console.log('- Attribution required in your app');
    }
}

// Run example if executed directly
if (require.main === module) {
    main();
}

module.exports = FatSecretAPI;
