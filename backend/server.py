from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
import bcrypt
import jwt
from datetime import datetime, timedelta
import math
import json
import re
from emergentintegrations.llm.openai import LlmChat

# Import our models
from models import *

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL'] 
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# OpenAI Integration
openai_api_key = os.environ.get('OPENAI_API_KEY')
if not openai_api_key:
    logging.warning("OPENAI_API_KEY not found in environment variables")
    openai_integration = None
else:
    openai_integration = True  # We'll create LlmChat instances as needed

# Create the main app
app = FastAPI(title="RightNow Legal Education Platform", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_data = await db.users.find_one({"id": user_id})
    if user_data is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_data)

# Basic endpoints
@api_router.get("/")
async def root():
    return {"message": "RightNow Legal Education Platform API", "version": "1.0.0"}

# Authentication endpoints
@api_router.post("/auth/register", response_model=APIResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        user_type=user_data.user_type,
        profile=user_data.profile or {}
    )
    
    await db.users.insert_one(user.dict())
    return APIResponse(success=True, message="User registered successfully", data={"user_id": user.id})

@api_router.post("/auth/login", response_model=APIResponse)
async def login(login_data: UserLogin):
    user_data = await db.users.find_one({"email": login_data.email})
    if not user_data or not verify_password(login_data.password, user_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**user_data)
    access_token = create_access_token(data={"sub": user.id})
    
    return APIResponse(
        success=True, 
        message="Login successful",
        data={"access_token": access_token, "user": user.dict()}
    )

@api_router.get("/auth/me", response_model=APIResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return APIResponse(success=True, message="User information retrieved", data=current_user.dict())

# Enhanced Legal Statutes endpoints with advanced search
@api_router.post("/statutes", response_model=APIResponse)
async def create_statute(statute_data: StatuteCreate, current_user: User = Depends(get_current_user)):
    statute = LegalStatute(**statute_data.dict())
    await db.legal_statutes.insert_one(statute.dict())
    return APIResponse(success=True, message="Statute created successfully", data=statute.dict())

@api_router.get("/statutes", response_model=APIResponse)
async def get_statutes(
    state: Optional[str] = None,
    category: Optional[StatuteCategory] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 10,
    sort_by: str = "relevance"  # relevance, date, title, category
):
    query = {}
    
    # State filter
    if state and state.lower() != "all":
        query["state"] = {"$regex": f"^{state}$", "$options": "i"}
    
    # Category filter
    if category:
        query["category"] = category.value
    
    # Advanced text search
    if search:
        search_terms = search.lower().split()
        search_conditions = []
        
        for term in search_terms:
            search_conditions.append({
                "$or": [
                    {"title": {"$regex": term, "$options": "i"}},
                    {"summary": {"$regex": term, "$options": "i"}},
                    {"full_text": {"$regex": term, "$options": "i"}},
                    {"practical_impact": {"$regex": term, "$options": "i"}},
                    {"student_relevance": {"$regex": term, "$options": "i"}},
                    {"keywords": {"$in": [term]}}
                ]
            })
        
        if search_conditions:
            query["$and"] = search_conditions
    
    # Get total count
    total = await db.legal_statutes.count_documents(query)
    
    # Apply sorting
    sort_options = {
        "relevance": [("title", 1)],  # Default alphabetical when no search
        "date": [("created_at", -1)],
        "title": [("title", 1)],
        "category": [("category", 1), ("title", 1)]
    }
    sort_criteria = sort_options.get(sort_by, [("title", 1)])
    
    # Execute query with pagination
    skip = (page - 1) * per_page
    cursor = db.legal_statutes.find(query).sort(sort_criteria).skip(skip).limit(per_page)
    statutes = await cursor.to_list(per_page)
    
    # Add search highlighting and relevance scoring
    processed_statutes = []
    for statute in statutes:
        statute_obj = LegalStatute(**statute)
        statute_dict = statute_obj.dict()
        
        # Add relevance score for search results
        if search:
            relevance_score = calculate_relevance_score(statute_dict, search)
            statute_dict["relevance_score"] = relevance_score
        
        processed_statutes.append(statute_dict)
    
    # Sort by relevance if searching
    if search and sort_by == "relevance":
        processed_statutes.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    
    return APIResponse(
        success=True,
        message="Statutes retrieved successfully",
        data=PaginatedResponse(
            items=processed_statutes,
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

def calculate_relevance_score(statute: dict, search_query: str) -> float:
    """Calculate relevance score for search results"""
    score = 0.0
    search_lower = search_query.lower()
    
    # Title matches (highest weight)
    if search_lower in statute.get("title", "").lower():
        score += 10.0
    
    # Summary matches (high weight)
    if search_lower in statute.get("summary", "").lower():
        score += 5.0
    
    # Practical impact matches (medium weight)
    if search_lower in statute.get("practical_impact", "").lower():
        score += 3.0
    
    # Student relevance matches (medium weight)
    if search_lower in statute.get("student_relevance", "").lower():
        score += 3.0
    
    # Keyword matches (medium weight)
    for keyword in statute.get("keywords", []):
        if search_lower in keyword.lower():
            score += 2.0
    
    # Full text matches (lower weight)
    if search_lower in statute.get("full_text", "").lower():
        score += 1.0
    
    return score

# Search suggestions endpoint
@api_router.get("/statutes/search/suggestions", response_model=APIResponse)
async def get_search_suggestions(q: str):
    if len(q) < 2:
        return APIResponse(success=True, message="Query too short", data=[])
    
    # Get suggestions from titles and keywords
    title_matches = await db.legal_statutes.find({
        "title": {"$regex": f".*{q}.*", "$options": "i"}
    }).limit(5).to_list(5)
    
    # Fix the keyword query - use $elemMatch for array elements with regex
    keyword_matches = await db.legal_statutes.find({
        "keywords": {"$elemMatch": {"$regex": f".*{q}.*", "$options": "i"}}
    }).limit(5).to_list(5)
    
    suggestions = []
    seen_titles = set()
    
    # Add title suggestions
    for statute in title_matches:
        if statute["title"] not in seen_titles:
            suggestions.append({
                "type": "statute",
                "text": statute["title"],
                "category": statute["category"],
                "state": statute["state"]
            })
            seen_titles.add(statute["title"])
    
    # Add keyword suggestions
    for statute in keyword_matches:
        for keyword in statute["keywords"]:
            if q.lower() in keyword.lower() and keyword not in seen_titles:
                suggestions.append({
                    "type": "keyword",
                    "text": keyword,
                    "category": statute["category"]
                })
                seen_titles.add(keyword)
    
    return APIResponse(success=True, message="Suggestions retrieved successfully", data=suggestions[:8])

# Statistics endpoint
@api_router.get("/statutes/stats", response_model=APIResponse)
async def get_statute_stats():
    # Get statistics about the statute database
    total_statutes = await db.legal_statutes.count_documents({})
    
    # Count by category
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_stats = await db.legal_statutes.aggregate(category_pipeline).to_list(20)
    
    # Count by state
    state_pipeline = [
        {"$group": {"_id": "$state", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    state_stats = await db.legal_statutes.aggregate(state_pipeline).to_list(20)
    
    return APIResponse(
        success=True, 
        message="Statistics retrieved successfully",
        data={
            "total_statutes": total_statutes,
            "by_category": category_stats,
            "by_state": state_stats
        }
    )

# User bookmarks endpoint
@api_router.get("/statutes/bookmarks", response_model=APIResponse)
async def get_user_bookmarks(current_user: User = Depends(get_current_user)):
    # Get user's bookmarked statute IDs
    bookmarks = await db.user_statute_bookmarks.find({"user_id": current_user.id}).to_list(100)
    statute_ids = [bookmark["statute_id"] for bookmark in bookmarks]
    
    if not statute_ids:
        return APIResponse(success=True, message="No bookmarks found", data=[])
    
    # Get the actual statutes
    statutes = await db.legal_statutes.find({"id": {"$in": statute_ids}}).to_list(100)
    
    return APIResponse(
        success=True,
        message="Bookmarks retrieved successfully",
        data=[LegalStatute(**statute).dict() for statute in statutes]
    )

@api_router.get("/statutes/{statute_id}", response_model=APIResponse)
async def get_statute(statute_id: str, current_user: User = Depends(get_current_user)):
    statute = await db.legal_statutes.find_one({"id": statute_id})
    if not statute:
        raise HTTPException(status_code=404, detail="Statute not found")
    
    # Track user interaction for gamification
    await track_statute_view(current_user.id, statute_id)
    
    # Get related statutes (same category)
    related_statutes = await db.legal_statutes.find({
        "category": statute["category"],
        "id": {"$ne": statute_id}
    }).limit(3).to_list(3)
    
    statute_obj = LegalStatute(**statute)
    response_data = statute_obj.dict()
    response_data["related_statutes"] = [LegalStatute(**s).dict() for s in related_statutes]
    
    return APIResponse(success=True, message="Statute retrieved successfully", data=response_data)

# User interaction endpoints
@api_router.post("/statutes/{statute_id}/bookmark", response_model=APIResponse)
async def bookmark_statute(statute_id: str, current_user: User = Depends(get_current_user)):
    # Check if statute exists
    statute = await db.legal_statutes.find_one({"id": statute_id})
    if not statute:
        raise HTTPException(status_code=404, detail="Statute not found")
    
    # Check if already bookmarked
    existing_bookmark = await db.user_statute_bookmarks.find_one({
        "user_id": current_user.id,
        "statute_id": statute_id
    })
    
    if existing_bookmark:
        return APIResponse(success=False, message="Statute already bookmarked")
    
    # Create bookmark
    from models import UserStatuteBookmark
    bookmark = UserStatuteBookmark(user_id=current_user.id, statute_id=statute_id)
    await db.user_statute_bookmarks.insert_one(bookmark.dict())
    
    # Award XP for bookmarking
    await award_xp(current_user.id, 5, "bookmark_statute")
    
    return APIResponse(success=True, message="Statute bookmarked successfully")

@api_router.delete("/statutes/{statute_id}/bookmark", response_model=APIResponse)
async def remove_bookmark(statute_id: str, current_user: User = Depends(get_current_user)):
    result = await db.user_statute_bookmarks.delete_one({
        "user_id": current_user.id,
        "statute_id": statute_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return APIResponse(success=True, message="Bookmark removed successfully")



# Helper functions
async def track_statute_view(user_id: str, statute_id: str):
    """Track when a user views a statute for analytics and gamification"""
    from models import UserStatuteProgress
    
    # Check if user has viewed this statute before
    existing_progress = await db.user_statute_progress.find_one({
        "user_id": user_id,
        "statute_id": statute_id
    })
    
    if not existing_progress:
        # First time viewing - create progress record and award XP
        progress = UserStatuteProgress(user_id=user_id, statute_id=statute_id)
        await db.user_statute_progress.insert_one(progress.dict())
        await award_xp(user_id, 10, "read_statute")
    else:
        # Update last read time
        await db.user_statute_progress.update_one(
            {"user_id": user_id, "statute_id": statute_id},
            {"$set": {"read_at": datetime.utcnow()}}
        )

async def award_xp(user_id: str, xp_amount: int, action: str):
    """Award XP to user and update level if necessary"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
    
    new_xp = user.get("xp", 0) + xp_amount
    new_level = calculate_level_from_xp(new_xp)
    
    # Update user XP and level
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "xp": new_xp,
                "level": new_level,
                "last_activity": datetime.utcnow()
            }
        }
    )
    
    # Check for level up and award badges if necessary
    if new_level > user.get("level", 1):
        await check_and_award_badges(user_id, new_level, action)

def calculate_level_from_xp(xp: int) -> int:
    """Calculate user level based on XP (simple formula: level = XP / 100 + 1)"""
    return min(max(xp // 100 + 1, 1), 50)  # Cap at level 50

async def check_and_award_badges(user_id: str, level: int, action: str):
    """Check if user should receive any badges"""
    badges_to_award = []
    
    # Level-based badges
    if level >= 5:
        badges_to_award.append("legal_scholar")
    if level >= 10:
        badges_to_award.append("statute_master")
    if level >= 20:
        badges_to_award.append("legal_expert")
    
    # Action-based badges
    if action == "read_statute":
        statute_count = await db.user_statute_progress.count_documents({"user_id": user_id})
        if statute_count >= 10:
            badges_to_award.append("knowledge_seeker")
        if statute_count >= 50:
            badges_to_award.append("legal_encyclopedia")
    
    # Award new badges
    user = await db.users.find_one({"id": user_id})
    current_badges = user.get("badges", [])
    
    for badge in badges_to_award:
        if badge not in current_badges:
            current_badges.append(badge)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"badges": current_badges}}
    )

# Community Q&A endpoints
@api_router.post("/questions", response_model=APIResponse)
async def create_question(question_data: QuestionCreate, current_user: User = Depends(get_current_user)):
    question = Question(**question_data.dict(), author_id=current_user.id)
    await db.questions.insert_one(question.dict())
    return APIResponse(success=True, message="Question created successfully", data=question.dict())

@api_router.get("/questions", response_model=APIResponse)
async def get_questions(
    category: Optional[StatuteCategory] = None,
    status: Optional[QuestionStatus] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20
):
    query = {}
    if category:
        query["category"] = category.value
    if status:
        query["status"] = status.value
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}}
        ]
    
    total = await db.questions.count_documents(query)
    skip = (page - 1) * per_page
    questions = await db.questions.find(query).sort("created_at", -1).skip(skip).limit(per_page).to_list(per_page)
    
    return APIResponse(
        success=True,
        message="Questions retrieved successfully",  
        data=PaginatedResponse(
            items=[Question(**question) for question in questions],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

@api_router.post("/questions/{question_id}/answers", response_model=APIResponse)
async def create_answer(question_id: str, answer_data: AnswerCreate, current_user: User = Depends(get_current_user)):
    # Verify question exists
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    answer = Answer(**answer_data.dict(), author_id=current_user.id)
    await db.answers.insert_one(answer.dict())
    return APIResponse(success=True, message="Answer created successfully", data=answer.dict())

@api_router.get("/questions/{question_id}/answers", response_model=APIResponse)
async def get_question_answers(question_id: str):
    answers = await db.answers.find({"question_id": question_id}).sort("created_at", -1).to_list(100)
    return APIResponse(
        success=True, 
        message="Answers retrieved successfully",
        data=[Answer(**answer) for answer in answers]
    )

# Legal Myths endpoints
@api_router.post("/myths", response_model=APIResponse)
async def create_legal_myth(myth_data: LegalMythCreate, current_user: User = Depends(get_current_user)):
    myth = LegalMyth(**myth_data.dict(), created_by=current_user.id)
    await db.legal_myths.insert_one(myth.dict())
    return APIResponse(success=True, message="Legal myth created successfully", data=myth.dict())

@api_router.get("/myths", response_model=APIResponse)
async def get_legal_myths(
    category: Optional[StatuteCategory] = None,
    status: Optional[LegalMythStatus] = None,
    page: int = 1,
    per_page: int = 20
):
    query = {"status": LegalMythStatus.PUBLISHED.value}
    if category:
        query["category"] = category.value
    if status:
        query["status"] = status.value
    
    total = await db.legal_myths.count_documents(query)
    skip = (page - 1) * per_page
    myths = await db.legal_myths.find(query).sort("published_at", -1).skip(skip).limit(per_page).to_list(per_page)
    
    return APIResponse(
        success=True,
        message="Legal myths retrieved successfully",
        data=PaginatedResponse(
            items=[LegalMyth(**myth) for myth in myths],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

# Simulation endpoints
@api_router.get("/simulations", response_model=APIResponse)
async def get_simulations(
    category: Optional[SimulationCategory] = None,
    difficulty: Optional[int] = None,
    page: int = 1,
    per_page: int = 20
):
    query = {"is_active": True}
    if category:
        query["category"] = category.value
    if difficulty:
        query["difficulty_level"] = difficulty
    
    total = await db.simulation_scenarios.count_documents(query)
    skip = (page - 1) * per_page
    simulations = await db.simulation_scenarios.find(query).skip(skip).limit(per_page).to_list(per_page)
    
    return APIResponse(
        success=True,
        message="Simulations retrieved successfully",
        data=PaginatedResponse(
            items=[SimulationScenario(**sim) for sim in simulations],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

# Learning Path endpoints
@api_router.get("/learning-paths", response_model=APIResponse)
async def get_learning_paths(
    user_type: Optional[UserType] = None,
    difficulty: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    query = {"is_active": True}
    if user_type:
        query["target_user_types"] = {"$in": [user_type.value]}
    if difficulty:
        query["difficulty_level"] = difficulty
    
    paths = await db.learning_paths.find(query).to_list(100)
    return APIResponse(
        success=True,
        message="Learning paths retrieved successfully",
        data=[LearningPath(**path) for path in paths]
    )

# AI Chat endpoints
@api_router.post("/ai/chat", response_model=APIResponse)
async def chat_with_ai(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """Main AI chat endpoint with comprehensive legal assistance"""
    if not openai_integration:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    
    try:
        # Get or create chat session
        session_id = request.session_id
        if not session_id:
            session = ChatSession(user_id=current_user.id, user_state=request.user_state)
            await db.chat_sessions.insert_one(session.dict())
            session_id = session.id
        else:
            session = await db.chat_sessions.find_one({"id": session_id, "user_id": current_user.id})
            if not session:
                raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Check UPL risk first
        upl_risk, upl_warning = check_upl_risk(request.message)
        
        # Check if user is asking for scripts
        script_request = detect_script_request(request.message)
        suggested_scripts = []
        
        if script_request:
            suggested_scripts = await get_relevant_scripts(script_request, request.user_state)
        
        # Prepare context for AI
        context = await prepare_ai_context(current_user.id, request.user_state, session_id)
        
        # Generate AI response
        ai_response = await generate_ai_response(
            request.message, 
            context, 
            request.user_state, 
            upl_risk
        )
        
        # Save chat message
        chat_message = ChatMessage(
            session_id=session_id,
            user_id=current_user.id,
            message=request.message,
            response=ai_response["response"],
            user_state=request.user_state,
            confidence_score=ai_response.get("confidence_score", 0.8),
            suggested_scripts=suggested_scripts,
            upl_risk_flagged=upl_risk,
            upl_warning=upl_warning,
            xp_awarded=10 if not upl_risk else 5  # Award XP for queries
        )
        
        await db.chat_messages.insert_one(chat_message.dict())
        
        # Award XP to user
        await award_xp(current_user.id, chat_message.xp_awarded, "ai_query")
        
        # Update session
        await db.chat_sessions.update_one(
            {"id": session_id},
            {
                "$set": {
                    "last_activity": datetime.utcnow(),
                    "user_state": request.user_state
                },
                "$inc": {"message_count": 1}
            }
        )
        
        # Check if response requires state clarification
        requires_state = not request.user_state and is_state_dependent_query(request.message)
        
        response_data = ChatResponseData(
            response=ai_response["response"],
            session_id=session_id,
            confidence_score=ai_response.get("confidence_score", 0.8),
            upl_risk_flagged=upl_risk,
            upl_warning=upl_warning,
            suggested_scripts=suggested_scripts,
            suggested_statutes=ai_response.get("suggested_statutes", []),
            xp_awarded=chat_message.xp_awarded,
            requires_state=requires_state
        )
        
        return APIResponse(
            success=True,
            message="AI response generated successfully",
            data=response_data.dict()
        )
        
    except Exception as e:
        logging.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")

@api_router.get("/ai/sessions", response_model=APIResponse)
async def get_chat_sessions(current_user: User = Depends(get_current_user)):
    """Get user's chat sessions"""
    sessions = await db.chat_sessions.find(
        {"user_id": current_user.id, "is_active": True}
    ).sort("last_activity", -1).limit(10).to_list(10)
    
    return APIResponse(
        success=True,
        message="Chat sessions retrieved successfully",
        data=[ChatSession(**session) for session in sessions]
    )

@api_router.get("/ai/sessions/{session_id}/messages", response_model=APIResponse)
async def get_chat_history(session_id: str, current_user: User = Depends(get_current_user)):
    """Get chat history for a session"""
    # Verify session belongs to user
    session = await db.chat_sessions.find_one({"id": session_id, "user_id": current_user.id})
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = await db.chat_messages.find(
        {"session_id": session_id}
    ).sort("created_at", 1).to_list(100)
    
    return APIResponse(
        success=True,
        message="Chat history retrieved successfully",
        data=[ChatMessage(**message) for message in messages]
    )

@api_router.get("/ai/scripts", response_model=APIResponse)
async def get_script_templates(category: Optional[str] = None, state: Optional[str] = None):
    """Get available script templates"""
    query = {}
    if category:
        query["category"] = category
    if state:
        query["$or"] = [
            {"state_specific": False},
            {"applicable_states": {"$in": [state]}}
        ]
    
    scripts = await db.script_templates.find(query).to_list(50)
    return APIResponse(
        success=True,
        message="Script templates retrieved successfully",
        data=[ScriptTemplate(**script) for script in scripts]
    )

# Helper functions for AI chat
def check_upl_risk(message: str) -> tuple[bool, Optional[str]]:
    """Check if message contains UPL risk indicators"""
    upl_patterns = [
        r"should i hire",
        r"what should i do in my case",
        r"i was arrested",
        r"i'm being sued",
        r"my specific situation",
        r"file a lawsuit",
        r"represent me",
        r"legal advice for my case"
    ]
    
    message_lower = message.lower()
    for pattern in upl_patterns:
        if re.search(pattern, message_lower):
            return True, ("⚠️ IMPORTANT DISCLAIMER: This app provides general legal information only, "
                         "not personalized legal advice. For specific legal matters, please consult "
                         "with a qualified attorney in your jurisdiction.")
    
    return False, None

def detect_script_request(message: str) -> Optional[str]:
    """Detect if user is asking for scripts"""
    script_patterns = {
        "traffic_stop": ["traffic stop", "pulled over", "police stop", "driving"],
        "ice_encounter": ["ice", "immigration", "border patrol", "deportation"],
        "police_search": ["search", "police search", "consent to search"],
        "housing_dispute": ["landlord", "rent", "eviction", "housing"],
        "workplace_rights": ["work", "job", "employment", "boss", "fired"]
    }
    
    message_lower = message.lower()
    for category, keywords in script_patterns.items():
        for keyword in keywords:
            if keyword in message_lower:
                return category
    
    return None

async def get_relevant_scripts(category: str, state: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get relevant script templates"""
    query = {"category": category}
    if state:
        query["$or"] = [
            {"state_specific": False},
            {"applicable_states": {"$in": [state]}}
        ]
    
    scripts = await db.script_templates.find(query).limit(3).to_list(3)
    return [
        {
            "title": script["title"],
            "scenario": script["scenario"],
            "script": script["script_text"],
            "legal_basis": script["legal_basis"]
        }
        for script in scripts
    ]

def is_state_dependent_query(message: str) -> bool:
    """Check if query is state-dependent"""
    state_patterns = [
        "law", "legal", "statute", "regulation", "permit", "license",
        "rights", "court", "police", "arrest", "traffic", "housing"
    ]
    
    message_lower = message.lower()
    return any(pattern in message_lower for pattern in state_patterns)

async def prepare_ai_context(user_id: str, user_state: Optional[str], session_id: str) -> Dict[str, Any]:
    """Prepare context for AI"""
    context = {
        "user_state": user_state,
        "system_role": "legal_education_assistant"
    }
    
    # Get recent chat history for context
    recent_messages = await db.chat_messages.find(
        {"session_id": session_id}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    context["recent_history"] = [
        {"message": msg["message"], "response": msg["response"]}
        for msg in reversed(recent_messages)
    ]
    
    return context

async def generate_ai_response(message: str, context: Dict[str, Any], user_state: Optional[str], upl_risk: bool) -> Dict[str, Any]:
    """Generate AI response using OpenAI"""
    try:
        system_prompt = create_system_prompt(user_state, upl_risk)
        
        # Prepare messages for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent context
        for hist in context.get("recent_history", []):
            messages.append({"role": "user", "content": hist["message"]})
            messages.append({"role": "assistant", "content": hist["response"]})
        
        messages.append({"role": "user", "content": message})
        
        # Create LlmChat instance
        from emergentintegrations.llm.openai import UserMessage
        chat = LlmChat(
            api_key=openai_api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_prompt,
            initial_messages=messages[:-1]  # All messages except the last user message
        )
        
        # Send the user message
        user_msg = UserMessage(text=message)
        ai_response = await chat.send_message(user_msg)
        
        return {
            "response": ai_response,
            "confidence_score": 0.8,
            "suggested_statutes": []  # Could implement statute suggestion logic
        }
        
    except Exception as e:
        logging.error(f"OpenAI API error: {str(e)}")
        # Fallback response
        return {
            "response": ("I apologize, but I'm experiencing technical difficulties. "
                        "Please try again in a moment. If you need immediate assistance, "
                        "please consult with a qualified attorney."),
            "confidence_score": 0.1,
            "suggested_statutes": []
        }

def create_system_prompt(user_state: Optional[str], upl_risk: bool) -> str:
    """Create system prompt for AI"""
    base_prompt = """You are RightNow, an AI legal education assistant focused on helping college students and the general public understand their legal rights. 

IMPORTANT GUIDELINES:
1. Always provide educational information, never specific legal advice
2. Encourage users to consult qualified attorneys for personal legal matters
3. Focus on general legal concepts, rights, and procedures
4. Use clear, accessible language appropriate for students
5. When discussing state-specific laws, mention that laws vary by jurisdiction"""
    
    if upl_risk:
        base_prompt += "\n\nIMPORTANT: The user's question appears to seek personal legal advice. Provide general educational information only and remind them to consult an attorney."
    
    if user_state:
        base_prompt += f"\n\nThe user is located in {user_state}. When relevant, mention that your information is general and they should verify current {user_state} laws."
    else:
        base_prompt += "\n\nThe user hasn't specified their state. When discussing state-specific topics, ask for their location to provide more relevant information."
    
    base_prompt += """

RESPONSE STYLE:
- Be encouraging and supportive
- Use emojis occasionally to maintain engagement
- Keep responses concise but informative
- Suggest related learning resources when appropriate
- Always end with a disclaimer about consulting attorneys for specific cases"""
    
    return base_prompt

# Legacy AI Query endpoint (for backward compatibility)
@api_router.post("/ai/query", response_model=APIResponse)
async def create_ai_query(query_data: AIQueryCreate, current_user: User = Depends(get_current_user)):
    # Redirect to new chat endpoint
    chat_request = ChatRequest(
        message=query_data.query_text,
        session_id=None,
        user_state=query_data.context.get("user_state")
    )
    return await chat_with_ai(chat_request, current_user)

# User gamification endpoints
@api_router.get("/user/progress", response_model=APIResponse)
async def get_user_progress(current_user: User = Depends(get_current_user)):
    # Get user's learning progress, badges, achievements, etc.
    learning_progress = await db.user_learning_progress.find({"user_id": current_user.id}).to_list(100)
    user_badges = await db.user_badges.find({"user_id": current_user.id}).to_list(100)
    
    return APIResponse(
        success=True,
        message="User progress retrieved successfully",
        data={
            "user": current_user.dict(),
            "learning_progress": learning_progress,
            "badges": user_badges
        }
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    """Initialize database with common script templates"""
    await initialize_script_templates()

async def initialize_script_templates():
    """Initialize the database with common legal script templates"""
    # Check if scripts already exist
    existing_count = await db.script_templates.count_documents({})
    if existing_count > 0:
        return  # Scripts already initialized
    
    common_scripts = [
        {
            "title": "Traffic Stop - Basic Rights",
            "category": "traffic_stop",
            "scenario": "When pulled over by police during a traffic stop",
            "script_text": "Officer, I'm invoking my right to remain silent. I do not consent to any searches. I would like to speak with my attorney. Am I free to go?",
            "legal_basis": "4th and 5th Amendment protections against unreasonable searches and self-incrimination",
            "keywords": ["traffic stop", "police", "search", "rights"],
            "state_specific": False,
            "applicable_states": []
        },
        {
            "title": "ICE Encounter - Know Your Rights",
            "category": "ice_encounter", 
            "scenario": "When approached by ICE or immigration officers",
            "script_text": "I am exercising my right to remain silent. I do not consent to any search. I want to speak with my lawyer. I am not answering any questions. If you do not have a warrant signed by a judge, I am not opening the door.",
            "legal_basis": "Constitutional rights apply to all persons in the US regardless of immigration status",
            "keywords": ["ice", "immigration", "deportation", "warrant"],
            "state_specific": False,
            "applicable_states": []
        },
        {
            "title": "Police Search Request",
            "category": "police_search",
            "scenario": "When police ask to search you, your car, or your home",
            "script_text": "I do not consent to this search. I am invoking my 4th Amendment right against unreasonable searches. If you do not have a warrant, I do not give permission for this search.",
            "legal_basis": "4th Amendment protection against unreasonable searches and seizures",
            "keywords": ["search", "consent", "4th amendment", "warrant"],
            "state_specific": False,
            "applicable_states": []
        },
        {
            "title": "Housing Dispute - Tenant Rights",
            "category": "housing_dispute",
            "scenario": "When dealing with landlord disputes or illegal eviction attempts",
            "script_text": "I am aware of my tenant rights. Any eviction must follow proper legal procedures. I request all communications in writing. I will not vacate without a court order.",
            "legal_basis": "State tenant-landlord laws and fair housing protections",
            "keywords": ["eviction", "tenant", "landlord", "housing"],
            "state_specific": True,
            "applicable_states": ["CA", "NY", "TX", "FL"]
        },
        {
            "title": "Workplace Rights - Discrimination",
            "category": "workplace_rights",
            "scenario": "When facing workplace discrimination or harassment",
            "script_text": "I am documenting this incident for my records. This behavior appears to violate workplace policies and potentially federal employment law. I request this be addressed through proper HR channels.",
            "legal_basis": "Title VII and other federal employment discrimination laws",
            "keywords": ["discrimination", "harassment", "workplace", "hr"],
            "state_specific": False,
            "applicable_states": []
        },
        {
            "title": "Police Questioning - Miranda Rights",
            "category": "police_encounter",
            "scenario": "When being questioned by police",
            "script_text": "I am invoking my 5th Amendment right to remain silent. I want to speak with my attorney. I will not answer any questions without my lawyer present.",
            "legal_basis": "5th Amendment right against self-incrimination and 6th Amendment right to counsel",
            "keywords": ["miranda", "questioning", "attorney", "silence"],
            "state_specific": False,
            "applicable_states": []
        },
        {
            "title": "Student Rights - School Search",
            "category": "student_rights",
            "scenario": "When school officials want to search your belongings",
            "script_text": "I do not consent to this search. I am aware that schools have different search standards, but I am exercising my right to object. I want to call my parents/guardian.",
            "legal_basis": "Students have limited 4th Amendment protections in schools (T.L.O. v. New Jersey)",
            "keywords": ["school", "search", "student", "backpack"],
            "state_specific": False,
            "applicable_states": []
        },
        {
            "title": "Consumer Rights - Debt Collection",
            "category": "consumer_rights",
            "scenario": "When dealing with aggressive debt collectors",
            "script_text": "I am requesting that all communications be in writing. I dispute this debt and request verification. Please provide documentation proving I owe this amount.",
            "legal_basis": "Fair Debt Collection Practices Act (FDCPA) protections",
            "keywords": ["debt", "collection", "fdcpa", "verification"],
            "state_specific": False,
            "applicable_states": []
        }
    ]
    
    # Insert all script templates
    script_templates = [ScriptTemplate(**script_data) for script_data in common_scripts]
    await db.script_templates.insert_many([template.dict() for template in script_templates])
    
    logging.info(f"Initialized {len(script_templates)} script templates")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
