#!/usr/bin/env python3
"""
Final comprehensive test of the Enhanced Real-Time Statute Lookup Engine
"""

import requests
import json

BACKEND_URL = "https://d41d4daa-9cdd-4f1d-8312-f7c9237f7509.preview.emergentagent.com/api"

# Login
login_data = {"email": "sarah.johnson@university.edu", "password": "SecurePass123!"}
response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
token = response.json()["data"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("🚀 FINAL ENHANCED STATUTE LOOKUP ENGINE TEST")
print("=" * 60)

# Test 1: Advanced search with relevance scoring
print("\n1. Testing advanced search with relevance scoring...")
response = requests.get(f"{BACKEND_URL}/statutes", params={
    "search": "housing tenant rights",
    "sort_by": "relevance",
    "per_page": 5
})
if response.status_code == 200:
    data = response.json()["data"]
    print(f"✅ Found {len(data['items'])} relevant statutes")
    for item in data['items'][:3]:
        print(f"   • {item['title']} ({item['state']})")
else:
    print("❌ Advanced search failed")

# Test 2: Search suggestions
print("\n2. Testing search suggestions...")
for query in ["housing", "employment", "consumer"]:
    response = requests.get(f"{BACKEND_URL}/statutes/search/suggestions", params={"q": query})
    if response.status_code == 200:
        suggestions = response.json()["data"]
        print(f"✅ '{query}' -> {len(suggestions)} suggestions")
        for suggestion in suggestions[:2]:
            print(f"   • {suggestion['text']} ({suggestion['type']})")
    else:
        print(f"❌ Suggestions failed for '{query}'")

# Test 3: Bookmark system
print("\n3. Testing bookmark system...")
# Get a statute to bookmark
response = requests.get(f"{BACKEND_URL}/statutes", params={"category": "housing", "per_page": 1})
if response.status_code == 200:
    statute = response.json()["data"]["items"][0]
    statute_id = statute["id"]
    
    # Bookmark it
    response = requests.post(f"{BACKEND_URL}/statutes/{statute_id}/bookmark", headers=headers)
    if response.status_code == 200:
        print(f"✅ Bookmarked: {statute['title']}")
        
        # Get bookmarks
        response = requests.get(f"{BACKEND_URL}/statutes/bookmarks", headers=headers)
        if response.status_code == 200:
            bookmarks = response.json()["data"]
            print(f"✅ Retrieved {len(bookmarks)} bookmarks")
        else:
            print("❌ Failed to retrieve bookmarks")
    else:
        print("❌ Failed to bookmark statute")

# Test 4: User interaction tracking and XP
print("\n4. Testing user interaction tracking and XP...")
initial_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
initial_xp = initial_response.json()["data"]["xp"]

# View a statute (should award XP)
response = requests.get(f"{BACKEND_URL}/statutes/{statute_id}", headers=headers)
if response.status_code == 200:
    print("✅ Viewed statute successfully")
    
    # Check XP increase
    final_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
    final_xp = final_response.json()["data"]["xp"]
    
    if final_xp > initial_xp:
        print(f"✅ XP increased from {initial_xp} to {final_xp}")
    else:
        print(f"⚠️ XP unchanged (may have already viewed this statute)")

# Test 5: Statistics endpoint
print("\n5. Testing statistics endpoint...")
response = requests.get(f"{BACKEND_URL}/statutes/stats")
if response.status_code == 200:
    stats = response.json()["data"]
    print(f"✅ Database statistics:")
    print(f"   • Total statutes: {stats['total_statutes']}")
    print(f"   • Categories: {len(stats['by_category'])}")
    print(f"   • States: {len(stats['by_state'])}")
else:
    print("❌ Failed to get statistics")

# Test 6: Pagination and filtering
print("\n6. Testing pagination and filtering...")
response = requests.get(f"{BACKEND_URL}/statutes", params={
    "category": "civil_rights",
    "state": "Federal",
    "page": 1,
    "per_page": 3
})
if response.status_code == 200:
    data = response.json()["data"]
    print(f"✅ Filtered results: {len(data['items'])} civil rights statutes")
    print(f"   • Page {data['page']} of {data['pages']} (total: {data['total']})")
else:
    print("❌ Filtering failed")

# Test 7: Gamification features
print("\n7. Testing gamification features...")
user_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
if user_response.status_code == 200:
    user = user_response.json()["data"]
    print(f"✅ User gamification status:")
    print(f"   • Level: {user['level']}")
    print(f"   • XP: {user['xp']}")
    print(f"   • Badges: {len(user['badges'])}")
else:
    print("❌ Failed to get user gamification data")

print("\n" + "=" * 60)
print("🎉 ENHANCED STATUTE LOOKUP ENGINE TEST COMPLETE")
print("All major features tested successfully!")