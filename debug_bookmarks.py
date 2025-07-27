#!/usr/bin/env python3
import requests
import json

BACKEND_URL = "https://d1d25d3b-bdd3-4635-9d4d-701b2969f1d7.preview.emergentagent.com/api"

# First login to get token
login_data = {
    "email": "sarah.johnson@university.edu",
    "password": "SecurePass123!"
}

response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
print(f"Login response: {response.status_code}")
print(f"Login data: {response.json()}")

if response.status_code == 200:
    token = response.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test bookmarks endpoint
    response = requests.get(f"{BACKEND_URL}/statutes/bookmarks", headers=headers)
    print(f"Bookmarks response: {response.status_code}")
    print(f"Bookmarks data: {response.json() if response.status_code != 404 else response.text}")
    
    # Test creating a statute and bookmarking it
    statute_data = {
        "title": "Debug Test Statute",
        "statute_number": "DEBUG-2024",
        "state": "Test",
        "category": "housing",
        "summary": "Debug test",
        "full_text": "Debug test statute",
        "keywords": ["debug", "test"]
    }
    
    response = requests.post(f"{BACKEND_URL}/statutes", json=statute_data, headers=headers)
    print(f"Statute creation: {response.status_code}")
    
    if response.status_code == 200:
        statute_id = response.json()["data"]["id"]
        print(f"Created statute ID: {statute_id}")
        
        # Bookmark it
        response = requests.post(f"{BACKEND_URL}/statutes/{statute_id}/bookmark", json={}, headers=headers)
        print(f"Bookmark creation: {response.status_code}")
        print(f"Bookmark response: {response.json()}")
        
        # Try to get bookmarks again
        response = requests.get(f"{BACKEND_URL}/statutes/bookmarks", headers=headers)
        print(f"Bookmarks after creation: {response.status_code}")
        print(f"Bookmarks data: {response.json() if response.status_code == 200 else response.text}")