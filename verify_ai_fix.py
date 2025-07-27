#!/usr/bin/env python3
"""
Quick verification that AI Chat coroutine issue is resolved
"""

import requests
import json

BACKEND_URL = "https://b44a1a90-e67b-4674-9c1c-405d3528abae.preview.emergentagent.com/api"

def test_ai_chat():
    # Login first
    login_data = {
        "email": "testuser2@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return False
    
    token = response.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Test the exact messages from the review request
    test_messages = [
        "What are my constitutional rights?",
        "Should I sue my landlord?",
        "Can you explain Miranda rights?", 
        "I need legal advice for my case"
    ]
    
    print("🧪 Testing AI Chat with review request messages...")
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{i}. Testing: '{message}'")
        
        chat_data = {
            "message": message,
            "user_state": "California"
        }
        
        response = requests.post(f"{BACKEND_URL}/ai/chat", json=chat_data, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                ai_response = data.get("data", {}).get("response", "")
                upl_flagged = data.get("data", {}).get("upl_risk_flagged", False)
                xp_awarded = data.get("data", {}).get("xp_awarded", 0)
                
                print(f"   ✅ SUCCESS - Response length: {len(ai_response)}")
                print(f"   📊 UPL Risk: {'Yes' if upl_flagged else 'No'}")
                print(f"   🎯 XP Awarded: {xp_awarded}")
                print(f"   💬 Response preview: {ai_response[:100]}...")
            else:
                print(f"   ❌ FAILED - API returned success=false")
                return False
        else:
            print(f"   ❌ FAILED - HTTP {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    
    print("\n✅ ALL AI CHAT TESTS PASSED - COROUTINE ISSUE RESOLVED!")
    return True

if __name__ == "__main__":
    test_ai_chat()