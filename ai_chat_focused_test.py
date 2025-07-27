#!/usr/bin/env python3
"""
Focused AI Chat System Testing for Coroutine Unpacking Issue Resolution
Tests specifically the AI Chat system to verify the coroutine unpacking issue has been resolved.
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://d1d25d3b-bdd3-4635-9d4d-701b2969f1d7.preview.emergentagent.com/api"

class AIFocusedTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.test_user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, params=data)
            elif method.upper() == "POST":
                response = requests.post(url, headers=default_headers, json=data)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=default_headers, json=data)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}, 400
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
        except Exception as e:
            return False, {"error": str(e)}, 500
    
    def setup_authentication(self):
        """Setup authentication for testing"""
        print("🔐 Setting up authentication...")
        
        # Try to login with existing test user
        login_data = {
            "email": "testuser2@example.com",
            "password": "testpass123"
        }
        
        success, data, status_code = self.make_request("POST", "/auth/login", login_data)
        
        if success and data.get("success") and data.get("data", {}).get("access_token"):
            self.auth_token = data["data"]["access_token"]
            self.log_test("Authentication Setup", True, "Successfully logged in with existing user")
            return True
        else:
            # Try to create a new test user
            timestamp = str(int(time.time()))
            register_data = {
                "email": f"ai_test_user_{timestamp}@example.com",
                "username": f"ai_test_user_{timestamp}",
                "password": "AITestPass123!",
                "user_type": "law_student",
                "profile": {
                    "first_name": "AI",
                    "last_name": "Tester",
                    "university": "Test University"
                }
            }
            
            success, data, status_code = self.make_request("POST", "/auth/register", register_data)
            
            if success and data.get("success"):
                # Now login with new user
                login_data = {
                    "email": register_data["email"],
                    "password": register_data["password"]
                }
                
                success, data, status_code = self.make_request("POST", "/auth/login", login_data)
                
                if success and data.get("success") and data.get("data", {}).get("access_token"):
                    self.auth_token = data["data"]["access_token"]
                    self.log_test("Authentication Setup", True, "Successfully created and logged in with new user")
                    return True
            
            self.log_test("Authentication Setup", False, "Failed to setup authentication", 
                         {"status_code": status_code, "response": data})
            return False
    
    def test_ai_chat_coroutine_fix(self):
        """Test AI Chat system with specific messages to verify coroutine unpacking fix"""
        if not self.auth_token:
            self.log_test("AI Chat Coroutine Fix", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test messages from the review request
        test_messages = [
            {
                "message": "What are my constitutional rights?",
                "expected_upl": False,
                "description": "Basic constitutional rights query"
            },
            {
                "message": "Should I sue my landlord?",
                "expected_upl": True,
                "description": "High UPL risk query - specific legal advice"
            },
            {
                "message": "Can you explain Miranda rights?",
                "expected_upl": False,
                "description": "Educational query about Miranda rights"
            },
            {
                "message": "I need legal advice for my case",
                "expected_upl": True,
                "description": "High UPL risk query - personal legal advice"
            }
        ]
        
        session_id = None
        
        for i, test_case in enumerate(test_messages):
            print(f"\n🧪 Testing message {i+1}: {test_case['description']}")
            
            chat_data = {
                "message": test_case["message"],
                "user_state": "California"
            }
            
            # Add session_id if we have one from previous test
            if session_id:
                chat_data["session_id"] = session_id
            
            try:
                success, data, status_code = self.make_request("POST", "/ai/chat", chat_data, headers)
                
                if success and data.get("success"):
                    response_data = data.get("data", {})
                    ai_response = response_data.get("response")
                    new_session_id = response_data.get("session_id")
                    upl_flagged = response_data.get("upl_risk_flagged", False)
                    upl_warning = response_data.get("upl_warning")
                    xp_awarded = response_data.get("xp_awarded", 0)
                    
                    # Store session_id for next test
                    if new_session_id:
                        session_id = new_session_id
                    
                    # Verify response format
                    if ai_response and isinstance(ai_response, str) and len(ai_response) > 0:
                        self.log_test(f"AI Chat Response Format ({i+1})", True, 
                                     f"Proper response format received (length: {len(ai_response)})")
                        
                        # Check UPL risk detection
                        if test_case["expected_upl"]:
                            if upl_flagged and upl_warning:
                                self.log_test(f"UPL Risk Detection ({i+1})", True, 
                                             f"Correctly flagged UPL risk: {test_case['message'][:50]}...")
                            else:
                                self.log_test(f"UPL Risk Detection ({i+1})", False, 
                                             f"Should have flagged UPL risk: {test_case['message'][:50]}...")
                        else:
                            if not upl_flagged:
                                self.log_test(f"UPL Risk Detection ({i+1})", True, 
                                             f"Correctly did not flag UPL risk: {test_case['message'][:50]}...")
                            else:
                                self.log_test(f"UPL Risk Detection ({i+1})", False, 
                                             f"Should not have flagged UPL risk: {test_case['message'][:50]}...")
                        
                        # Check XP award
                        if xp_awarded > 0:
                            self.log_test(f"XP Award ({i+1})", True, f"XP awarded: {xp_awarded}")
                        else:
                            self.log_test(f"XP Award ({i+1})", False, "No XP awarded for AI query")
                        
                        # Check session management
                        if new_session_id:
                            self.log_test(f"Session Management ({i+1})", True, 
                                         f"Session ID provided: {new_session_id[:8]}...")
                        else:
                            self.log_test(f"Session Management ({i+1})", False, "No session ID provided")
                        
                        # Most importantly - no coroutine errors
                        self.log_test(f"Coroutine Fix Verification ({i+1})", True, 
                                     "No coroutine unpacking errors - AI chat working properly")
                    else:
                        self.log_test(f"AI Chat Response Format ({i+1})", False, 
                                     "Invalid or empty AI response")
                        self.log_test(f"Coroutine Fix Verification ({i+1})", False, 
                                     "AI response format issue may indicate coroutine problems")
                else:
                    self.log_test(f"AI Chat Request ({i+1})", False, 
                                 f"AI chat request failed: {test_case['message'][:50]}...",
                                 {"status_code": status_code, "response": data})
                    self.log_test(f"Coroutine Fix Verification ({i+1})", False, 
                                 "Request failure may indicate coroutine unpacking issue")
                
                # Small delay between requests
                time.sleep(0.5)
                
            except Exception as e:
                self.log_test(f"AI Chat Exception ({i+1})", False, 
                             f"Exception during AI chat test: {str(e)}")
                self.log_test(f"Coroutine Fix Verification ({i+1})", False, 
                             f"Exception may indicate coroutine unpacking issue: {str(e)}")
    
    def test_ai_session_continuity(self):
        """Test AI session continuity to ensure sessions work properly"""
        if not self.auth_token:
            self.log_test("AI Session Continuity", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Start a conversation
        initial_message = {
            "message": "I have a question about tenant rights",
            "user_state": "California"
        }
        
        success, data, status_code = self.make_request("POST", "/ai/chat", initial_message, headers)
        
        if success and data.get("success"):
            session_id = data.get("data", {}).get("session_id")
            
            if session_id:
                # Continue the conversation
                follow_up_message = {
                    "message": "Can my landlord raise my rent without notice?",
                    "session_id": session_id,
                    "user_state": "California"
                }
                
                success, data, status_code = self.make_request("POST", "/ai/chat", follow_up_message, headers)
                
                if success and data.get("success"):
                    response = data.get("data", {}).get("response")
                    if response and len(response) > 0:
                        self.log_test("AI Session Continuity", True, 
                                     "Session-based conversation working properly")
                    else:
                        self.log_test("AI Session Continuity", False, 
                                     "Empty response in session continuation")
                else:
                    self.log_test("AI Session Continuity", False, 
                                 "Failed to continue conversation in session")
            else:
                self.log_test("AI Session Continuity", False, 
                             "No session ID returned from initial message")
        else:
            self.log_test("AI Session Continuity", False, 
                         "Failed to start initial conversation")
    
    def test_ai_sessions_retrieval(self):
        """Test AI sessions retrieval endpoint"""
        if not self.auth_token:
            self.log_test("AI Sessions Retrieval", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get user's AI sessions
        success, data, status_code = self.make_request("GET", "/ai/sessions", headers=headers)
        
        if success and data.get("success"):
            sessions = data.get("data", [])
            self.log_test("AI Sessions Retrieval", True, 
                         f"Successfully retrieved {len(sessions)} AI sessions")
            
            # If we have sessions, test getting messages for the first one
            if sessions:
                first_session_id = sessions[0].get("id")
                if first_session_id:
                    success, data, status_code = self.make_request("GET", 
                                                                 f"/ai/sessions/{first_session_id}/messages", 
                                                                 headers=headers)
                    
                    if success and data.get("success"):
                        messages = data.get("data", [])
                        self.log_test("AI Session Messages", True, 
                                     f"Retrieved {len(messages)} messages from session")
                    else:
                        self.log_test("AI Session Messages", False, 
                                     "Failed to retrieve session messages")
        else:
            self.log_test("AI Sessions Retrieval", False, 
                         "Failed to retrieve AI sessions",
                         {"status_code": status_code, "response": data})
    
    def test_ai_script_templates(self):
        """Test AI script templates retrieval"""
        # Test basic script templates retrieval (no auth required)
        success, data, status_code = self.make_request("GET", "/ai/scripts")
        
        if success and data.get("success"):
            scripts = data.get("data", [])
            if scripts:
                self.log_test("AI Script Templates", True, 
                             f"Retrieved {len(scripts)} script templates")
                
                # Check script structure
                first_script = scripts[0]
                required_fields = ["title", "category", "scenario", "script_text"]
                has_required_fields = all(field in first_script for field in required_fields)
                
                if has_required_fields:
                    self.log_test("Script Template Structure", True, 
                                 "Script templates have correct structure")
                else:
                    self.log_test("Script Template Structure", False, 
                                 "Script templates missing required fields")
            else:
                self.log_test("AI Script Templates", False, 
                             "No script templates found - database may not be initialized")
        else:
            self.log_test("AI Script Templates", False, 
                         "Failed to retrieve script templates",
                         {"status_code": status_code, "response": data})
    
    def run_focused_ai_tests(self):
        """Run all focused AI chat tests"""
        print("🚀 Starting Focused AI Chat System Testing")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return
        
        print("\n🧪 Running AI Chat Coroutine Fix Tests...")
        self.test_ai_chat_coroutine_fix()
        
        print("\n🧪 Running AI Session Continuity Tests...")
        self.test_ai_session_continuity()
        
        print("\n🧪 Running AI Sessions Retrieval Tests...")
        self.test_ai_sessions_retrieval()
        
        print("\n🧪 Running AI Script Templates Tests...")
        self.test_ai_script_templates()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Check specifically for coroutine fix
        coroutine_tests = [r for r in self.test_results if "Coroutine Fix" in r["test"]]
        coroutine_passed = sum(1 for r in coroutine_tests if r["success"])
        
        print(f"\n🔧 COROUTINE FIX STATUS:")
        if coroutine_passed == len(coroutine_tests) and len(coroutine_tests) > 0:
            print("✅ COROUTINE UNPACKING ISSUE APPEARS TO BE RESOLVED")
        else:
            print("❌ COROUTINE UNPACKING ISSUE MAY STILL EXIST")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = AIFocusedTester()
    success = tester.run_focused_ai_tests()
    sys.exit(0 if success else 1)