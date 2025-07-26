#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for RightNow Legal Education Platform
Tests all implemented endpoints with realistic data scenarios
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://d41d4daa-9cdd-4f1d-8312-f7c9237f7509.preview.emergentagent.com/api"

class BackendTester:
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
    
    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, data, status_code = self.make_request("GET", "/")
        
        if success and data.get("message") and "RightNow Legal Education Platform" in data["message"]:
            self.log_test("Root Endpoint", True, "API is responding correctly")
        else:
            self.log_test("Root Endpoint", False, f"API not responding properly", 
                         {"status_code": status_code, "response": data})
    
    def test_user_registration(self):
        """Test user registration with different user types"""
        test_users = [
            {
                "email": "sarah.johnson@university.edu",
                "username": "sarah_law_student",
                "password": "SecurePass123!",
                "user_type": "law_student",
                "profile": {
                    "first_name": "Sarah",
                    "last_name": "Johnson",
                    "university": "State University Law School",
                    "year": "2L"
                }
            },
            {
                "email": "mike.chen@college.edu", 
                "username": "mike_undergrad",
                "password": "StudentLife456!",
                "user_type": "undergraduate",
                "profile": {
                    "first_name": "Mike",
                    "last_name": "Chen",
                    "university": "City College",
                    "major": "Political Science"
                }
            }
        ]
        
        for i, user_data in enumerate(test_users):
            success, data, status_code = self.make_request("POST", "/auth/register", user_data)
            
            if success and data.get("success") and data.get("data", {}).get("user_id"):
                self.log_test(f"User Registration ({user_data['user_type']})", True, 
                             f"User {user_data['username']} registered successfully")
                if i == 0:  # Save first user for login testing
                    self.test_user_id = data["data"]["user_id"]
            else:
                self.log_test(f"User Registration ({user_data['user_type']})", False, 
                             "Registration failed", {"status_code": status_code, "response": data})
    
    def test_user_login(self):
        """Test user login and JWT token generation"""
        login_data = {
            "email": "sarah.johnson@university.edu",
            "password": "SecurePass123!"
        }
        
        success, data, status_code = self.make_request("POST", "/auth/login", login_data)
        
        if success and data.get("success") and data.get("data", {}).get("access_token"):
            self.auth_token = data["data"]["access_token"]
            self.log_test("User Login", True, "Login successful, JWT token received")
        else:
            self.log_test("User Login", False, "Login failed", 
                         {"status_code": status_code, "response": data})
    
    def test_protected_route_without_auth(self):
        """Test that protected routes require authentication"""
        success, data, status_code = self.make_request("GET", "/auth/me")
        
        if not success and status_code in [401, 403]:  # Both 401 and 403 are valid for auth failures
            self.log_test("Protected Route (No Auth)", True, "Correctly rejected unauthenticated request")
        else:
            self.log_test("Protected Route (No Auth)", False, 
                         "Should have rejected unauthenticated request",
                         {"status_code": status_code, "response": data})
    
    def test_protected_route_with_auth(self):
        """Test protected route with valid authentication"""
        if not self.auth_token:
            self.log_test("Protected Route (With Auth)", False, "No auth token available for testing")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, data, status_code = self.make_request("GET", "/auth/me", headers=headers)
        
        if success and data.get("success") and data.get("data", {}).get("email"):
            self.log_test("Protected Route (With Auth)", True, "Successfully accessed protected route")
        else:
            self.log_test("Protected Route (With Auth)", False, "Failed to access protected route",
                         {"status_code": status_code, "response": data})
    
    def test_legal_statutes_creation(self):
        """Test creating legal statutes"""
        if not self.auth_token:
            self.log_test("Statute Creation", False, "No auth token available")
            return
        
        statute_data = {
            "title": "California Consumer Privacy Act",
            "statute_number": "CA-CCPA-2018",
            "state": "California",
            "category": "consumer_protection",
            "summary": "Comprehensive privacy law giving California residents rights over their personal information",
            "full_text": "The California Consumer Privacy Act (CCPA) gives consumers more control over the personal information that businesses collect about them. This landmark law secures new privacy rights for California consumers...",
            "keywords": ["privacy", "consumer rights", "personal information", "data protection"],
            "effective_date": "2020-01-01T00:00:00Z"
        }
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, data, status_code = self.make_request("POST", "/statutes", statute_data, headers)
        
        if success and data.get("success"):
            self.log_test("Statute Creation", True, "Legal statute created successfully")
            return data.get("data", {}).get("id")
        else:
            self.log_test("Statute Creation", False, "Failed to create statute",
                         {"status_code": status_code, "response": data})
            return None
    
    def test_legal_statutes_retrieval(self):
        """Test retrieving legal statutes with search and pagination"""
        # Test basic retrieval
        success, data, status_code = self.make_request("GET", "/statutes")
        
        if success and data.get("success"):
            self.log_test("Statute Retrieval (Basic)", True, "Successfully retrieved statutes")
        else:
            self.log_test("Statute Retrieval (Basic)", False, "Failed to retrieve statutes",
                         {"status_code": status_code, "response": data})
        
        # Test search functionality
        search_params = {"search": "privacy", "page": 1, "per_page": 10}
        success, data, status_code = self.make_request("GET", "/statutes", search_params)
        
        if success and data.get("success"):
            self.log_test("Statute Search", True, "Search functionality working")
        else:
            self.log_test("Statute Search", False, "Search functionality failed",
                         {"status_code": status_code, "response": data})
        
        # Test category filtering
        category_params = {"category": "consumer_protection"}
        success, data, status_code = self.make_request("GET", "/statutes", category_params)
        
        if success and data.get("success"):
            self.log_test("Statute Category Filter", True, "Category filtering working")
        else:
            self.log_test("Statute Category Filter", False, "Category filtering failed",
                         {"status_code": status_code, "response": data})
    
    def test_community_qa_system(self):
        """Test community Q&A question and answer creation"""
        if not self.auth_token:
            self.log_test("Q&A System", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Create a question
        question_data = {
            "title": "Can my landlord enter my apartment without notice?",
            "content": "I'm a college student renting an apartment in California. My landlord has been entering my apartment without giving me any notice. Is this legal? What are my rights as a tenant?",
            "category": "housing",
            "tags": ["tenant rights", "landlord", "privacy", "california"]
        }
        
        success, data, status_code = self.make_request("POST", "/questions", question_data, headers)
        
        if success and data.get("success"):
            question_id = data.get("data", {}).get("id")
            self.log_test("Question Creation", True, "Question created successfully")
            
            # Create an answer for the question
            if question_id:
                answer_data = {
                    "question_id": question_id,
                    "content": "In California, landlords must provide at least 24 hours written notice before entering a rental unit, except in emergencies. The notice must state the purpose of entry and the approximate time. Entering without proper notice violates your privacy rights as a tenant. You should document these incidents and consider contacting your local tenant rights organization or housing authority."
                }
                
                success, data, status_code = self.make_request("POST", f"/questions/{question_id}/answers", 
                                                             answer_data, headers)
                
                if success and data.get("success"):
                    self.log_test("Answer Creation", True, "Answer created successfully")
                else:
                    self.log_test("Answer Creation", False, "Failed to create answer",
                                 {"status_code": status_code, "response": data})
                
                # Test retrieving answers
                success, data, status_code = self.make_request("GET", f"/questions/{question_id}/answers")
                
                if success and data.get("success"):
                    self.log_test("Answer Retrieval", True, "Successfully retrieved answers")
                else:
                    self.log_test("Answer Retrieval", False, "Failed to retrieve answers",
                                 {"status_code": status_code, "response": data})
        else:
            self.log_test("Question Creation", False, "Failed to create question",
                         {"status_code": status_code, "response": data})
        
        # Test question retrieval with filters
        success, data, status_code = self.make_request("GET", "/questions", {"category": "housing"})
        
        if success and data.get("success"):
            self.log_test("Question Retrieval", True, "Successfully retrieved questions")
        else:
            self.log_test("Question Retrieval", False, "Failed to retrieve questions",
                         {"status_code": status_code, "response": data})
    
    def test_legal_myths_system(self):
        """Test legal myths creation and retrieval"""
        if not self.auth_token:
            self.log_test("Legal Myths System", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Create a legal myth
        myth_data = {
            "title": "Police Must Read Miranda Rights During Every Arrest",
            "myth_statement": "Police officers are required to read Miranda rights to every person they arrest, and if they don't, the arrest is invalid.",
            "fact_explanation": "This is a common misconception. Police are only required to read Miranda rights if they plan to interrogate a suspect while in custody. The arrest itself remains valid even if Miranda rights aren't read. However, any statements made during custodial interrogation without Miranda warnings may be inadmissible in court.",
            "category": "criminal_law",
            "difficulty_level": 2,
            "sources": [
                "Miranda v. Arizona, 384 U.S. 436 (1966)",
                "Berkemer v. McCarty, 468 U.S. 420 (1984)"
            ],
            "tags": ["miranda rights", "arrest", "interrogation", "criminal procedure"]
        }
        
        success, data, status_code = self.make_request("POST", "/myths", myth_data, headers)
        
        if success and data.get("success"):
            self.log_test("Legal Myth Creation", True, "Legal myth created successfully")
        else:
            self.log_test("Legal Myth Creation", False, "Failed to create legal myth",
                         {"status_code": status_code, "response": data})
        
        # Test myth retrieval
        success, data, status_code = self.make_request("GET", "/myths", {"category": "criminal_law"})
        
        if success and data.get("success"):
            self.log_test("Legal Myth Retrieval", True, "Successfully retrieved legal myths")
        else:
            self.log_test("Legal Myth Retrieval", False, "Failed to retrieve legal myths",
                         {"status_code": status_code, "response": data})
    
    def test_simulations_system(self):
        """Test simulations retrieval"""
        success, data, status_code = self.make_request("GET", "/simulations")
        
        if success and data.get("success"):
            self.log_test("Simulations Retrieval", True, "Successfully retrieved simulations")
        else:
            self.log_test("Simulations Retrieval", False, "Failed to retrieve simulations",
                         {"status_code": status_code, "response": data})
        
        # Test with category filter
        success, data, status_code = self.make_request("GET", "/simulations", 
                                                     {"category": "police_encounter"})
        
        if success and data.get("success"):
            self.log_test("Simulations Category Filter", True, "Category filtering working")
        else:
            self.log_test("Simulations Category Filter", False, "Category filtering failed",
                         {"status_code": status_code, "response": data})
    
    def test_learning_paths_system(self):
        """Test learning paths retrieval"""
        if not self.auth_token:
            self.log_test("Learning Paths System", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, data, status_code = self.make_request("GET", "/learning-paths", headers=headers)
        
        if success and data.get("success"):
            self.log_test("Learning Paths Retrieval", True, "Successfully retrieved learning paths")
        else:
            self.log_test("Learning Paths Retrieval", False, "Failed to retrieve learning paths",
                         {"status_code": status_code, "response": data})
        
        # Test with user type filter
        success, data, status_code = self.make_request("GET", "/learning-paths", 
                                                     {"user_type": "law_student"}, headers)
        
        if success and data.get("success"):
            self.log_test("Learning Paths User Filter", True, "User type filtering working")
        else:
            self.log_test("Learning Paths User Filter", False, "User type filtering failed",
                         {"status_code": status_code, "response": data})
    
    def test_ai_query_system(self):
        """Test AI query placeholder system"""
        if not self.auth_token:
            self.log_test("AI Query System", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        query_data = {
            "query_text": "What are my rights if I'm pulled over by police during a traffic stop?",
            "query_type": "legal_question",
            "context": {
                "user_location": "California",
                "situation": "traffic_stop"
            }
        }
        
        success, data, status_code = self.make_request("POST", "/ai/query", query_data, headers)
        
        if success and data.get("success"):
            self.log_test("AI Query Processing", True, "AI query processed successfully (placeholder)")
        else:
            self.log_test("AI Query Processing", False, "Failed to process AI query",
                         {"status_code": status_code, "response": data})
    
    def test_user_progress_system(self):
        """Test user progress and gamification system"""
        if not self.auth_token:
            self.log_test("User Progress System", False, "No auth token available")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, data, status_code = self.make_request("GET", "/user/progress", headers=headers)
        
        if success and data.get("success"):
            self.log_test("User Progress Retrieval", True, "Successfully retrieved user progress")
        else:
            self.log_test("User Progress Retrieval", False, "Failed to retrieve user progress",
                         {"status_code": status_code, "response": data})
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting RightNow Legal Education Platform Backend Tests")
        print("=" * 60)
        
        # Core API tests
        self.test_root_endpoint()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_protected_route_without_auth()
        self.test_protected_route_with_auth()
        
        # Feature tests
        self.test_legal_statutes_creation()
        self.test_legal_statutes_retrieval()
        self.test_community_qa_system()
        self.test_legal_myths_system()
        self.test_simulations_system()
        self.test_learning_paths_system()
        self.test_ai_query_system()
        self.test_user_progress_system()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = BackendTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if tests failed
    sys.exit(0 if failed == 0 else 1)