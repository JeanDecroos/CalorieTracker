"""
FatSecret API Example Implementation
This is a basic example showing how to authenticate and use the FatSecret API.
"""

import requests
import base64
import json
from datetime import datetime, timedelta

class FatSecretAPI:
    def __init__(self, client_id, client_secret):
        """
        Initialize FatSecret API client
        
        Args:
            client_id: Your OAuth 2.0 Client ID
            client_secret: Your OAuth 2.0 Client Secret
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_url = "https://oauth.fatsecret.com/connect/token"
        self.api_url = "https://platform.fatsecret.com/rest/server.api"
        self.access_token = None
        self.token_expires_at = None
        
    def get_access_token(self, scopes="basic"):
        """
        Get OAuth 2.0 access token using client credentials flow
        
        Args:
            scopes: Space-separated list of scopes (e.g., "basic barcode")
            
        Returns:
            Access token string
        """
        # Create Basic Auth header
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "grant_type": "client_credentials",
            "scope": scopes
        }
        
        try:
            response = requests.post(self.token_url, headers=headers, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 86400)  # Default 24 hours
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
            
            print(f"✓ Access token obtained. Expires in {expires_in} seconds")
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Error getting access token: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            raise
    
    def is_token_valid(self):
        """Check if current token is still valid"""
        if not self.access_token or not self.token_expires_at:
            return False
        return datetime.now() < self.token_expires_at - timedelta(minutes=5)  # Refresh 5 min early
    
    def ensure_token(self, scopes="basic"):
        """Ensure we have a valid access token"""
        if not self.is_token_valid():
            self.get_access_token(scopes)
    
    def api_request(self, method, params=None, scopes="basic"):
        """
        Make an API request to FatSecret
        
        Args:
            method: API method name (e.g., "foods.search.v4")
            params: Dictionary of additional parameters
            scopes: Required scopes for this request
            
        Returns:
            JSON response data
        """
        self.ensure_token(scopes)
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        # Build request body
        body = {
            "method": method,
            "format": "json"
        }
        
        if params:
            body.update(params)
        
        try:
            response = requests.post(self.api_url, headers=headers, json=body)
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"✗ API request failed: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            raise
    
    def search_foods(self, query, max_results=20, page_number=0):
        """
        Search for foods
        
        Args:
            query: Search term (e.g., "apple")
            max_results: Maximum number of results (max 50 for Basic tier)
            page_number: Page number for pagination
            
        Returns:
            Search results
            
        Note: For Basic (Free) tier, uses foods.search.v2
        """
        params = {
            "search_expression": query,
            "max_results": min(max_results, 50),  # Basic tier limit
            "page_number": page_number
        }
        
        # Basic tier uses v2 (v4 requires premier scope)
        return self.api_request("foods.search.v2", params, scopes="basic")
    
    def get_food(self, food_id):
        """
        Get detailed information about a specific food
        
        Args:
            food_id: Food identifier from search results
            
        Returns:
            Food details
            
        Note: For Basic (Free) tier, uses food.get.v3
        """
        params = {
            "food_id": food_id
        }
        
        # Basic tier uses v3 (v4/v5 require premier scope)
        return self.api_request("food.get.v3", params, scopes="basic")
    
    def find_by_barcode(self, barcode):
        """
        Find food by barcode/UPC
        
        Args:
            barcode: Barcode/UPC code
            
        Returns:
            Food information
            
        Note: Requires 'barcode' and 'premier' scopes
        """
        params = {
            "barcode": barcode
        }
        
        return self.api_request("food/barcode/find-by-id/v2", params, scopes="barcode premier")


# Example usage
if __name__ == "__main__":
    # Your credentials
    CLIENT_ID = "946e7fa5ffc74dd8bd8e133f2f4c4630"
    CLIENT_SECRET = "82e3fcb1ab5c4447996d37c93ddbe91a"
    
    # Initialize API client
    api = FatSecretAPI(CLIENT_ID, CLIENT_SECRET)
    
    try:
        # Example 1: Search for foods
        print("\n=== Searching for 'apple' ===")
        search_results = api.search_foods("apple", max_results=5)
        print(json.dumps(search_results, indent=2))
        
        # Example 2: Get food details (if we got results)
        if search_results and "foods" in search_results and "food" in search_results["foods"]:
            foods = search_results["foods"]["food"]
            if isinstance(foods, list) and len(foods) > 0:
                first_food_id = foods[0]["food_id"]
                print(f"\n=== Getting details for food ID: {first_food_id} ===")
                food_details = api.get_food(first_food_id)
                print(json.dumps(food_details, indent=2))
        
        # Example 3: Barcode lookup (NOT available on Basic tier - requires Premier)
        # print("\n=== Looking up barcode ===")
        # barcode_result = api.find_by_barcode("0123456789012")
        # print(json.dumps(barcode_result, indent=2))
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nNote: Make sure:")
        print("1. Your IP address is whitelisted in FatSecret dashboard")
        print("2. You're using 'basic' scope (you have Basic/Free tier)")
        print("3. You have the 'requests' library installed: pip install requests")
        print("\nBasic Tier Limitations:")
        print("- 5,000 API calls per day")
        print("- US dataset only")
        print("- Only v2/v3 endpoints available (not v4/v5)")
        print("- No barcode scanning, NLP, or image recognition")
        print("- Attribution required in your app")
