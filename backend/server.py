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
import uuid
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

# Enhanced Legal Myths endpoints for Myth-Busting Feed
@api_router.post("/myths", response_model=APIResponse)
async def create_legal_myth(myth_data: LegalMythCreate, current_user: User = Depends(get_current_user)):
    myth = LegalMyth(**myth_data.dict(), created_by=current_user.id)
    await db.legal_myths.insert_one(myth.dict())
    return APIResponse(success=True, message="Legal myth created successfully", data=myth.dict())

@api_router.get("/myths/daily", response_model=APIResponse)
async def get_daily_myth(current_user: User = Depends(get_current_user)):
    """Get today's myth-busting content for the user"""
    # Get a myth the user hasn't read today
    today = datetime.utcnow().date()
    
    # Find myths user hasn't read yet
    user_read_myths = await db.user_myth_progress.find(
        {"user_id": current_user.id}
    ).to_list(1000)
    
    read_myth_ids = [progress["myth_id"] for progress in user_read_myths]
    
    # Get unread myths
    query = {
        "status": LegalMythStatus.PUBLISHED.value,
        "id": {"$nin": read_myth_ids}
    }
    
    # If user has read all myths, reset and show all again
    myth = await db.legal_myths.find_one(query)
    if not myth:
        # Reset - user has read all myths, start over
        query = {"status": LegalMythStatus.PUBLISHED.value}
        myth = await db.legal_myths.find_one(query)
    
    if not myth:
        return APIResponse(success=False, message="No myths available")
    
    myth_obj = LegalMyth(**myth)
    
    # Track myth view
    await track_myth_view(current_user.id, myth_obj.id)
    
    return APIResponse(
        success=True,
        message="Daily myth retrieved successfully",
        data=myth_obj.dict()
    )

@api_router.get("/myths/feed", response_model=APIResponse)
async def get_myth_feed(
    page: int = 1,
    per_page: int = 10,
    category: Optional[StatuteCategory] = None,
    current_user: User = Depends(get_current_user)
):
    """Get myth feed for swipeable interface"""
    query = {"status": LegalMythStatus.PUBLISHED.value}
    if category:
        query["category"] = category.value
    
    total = await db.legal_myths.count_documents(query)
    skip = (page - 1) * per_page
    myths = await db.legal_myths.find(query).sort("published_at", -1).skip(skip).limit(per_page).to_list(per_page)
    
    # Add user interaction data
    processed_myths = []
    for myth in myths:
        myth_obj = LegalMyth(**myth)
        myth_dict = myth_obj.dict()
        
        # Check if user has read this myth
        user_progress = await db.user_myth_progress.find_one({
            "user_id": current_user.id,
            "myth_id": myth_obj.id
        })
        
        myth_dict["user_has_read"] = bool(user_progress)
        myth_dict["user_liked"] = user_progress.get("liked", False) if user_progress else False
        processed_myths.append(myth_dict)
    
    return APIResponse(
        success=True,
        message="Myth feed retrieved successfully",
        data=PaginatedResponse(
            items=processed_myths,
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

@api_router.post("/myths/{myth_id}/read", response_model=APIResponse)
async def mark_myth_as_read(myth_id: str, current_user: User = Depends(get_current_user)):
    """Mark a myth as read and award XP"""
    myth = await db.legal_myths.find_one({"id": myth_id})
    if not myth:
        raise HTTPException(status_code=404, detail="Myth not found")
    
    await track_myth_view(current_user.id, myth_id)
    
    return APIResponse(success=True, message="Myth marked as read", data={"xp_awarded": 15})

@api_router.post("/myths/{myth_id}/like", response_model=APIResponse)
async def like_myth(myth_id: str, current_user: User = Depends(get_current_user)):
    """Like/unlike a myth"""
    myth = await db.legal_myths.find_one({"id": myth_id})
    if not myth:
        raise HTTPException(status_code=404, detail="Myth not found")
    
    # Check if user has already interacted with this myth
    existing_progress = await db.user_myth_progress.find_one({
        "user_id": current_user.id,
        "myth_id": myth_id
    })
    
    if existing_progress:
        # Toggle like status
        new_liked_status = not existing_progress.get("liked", False)
        await db.user_myth_progress.update_one(
            {"user_id": current_user.id, "myth_id": myth_id},
            {"$set": {"liked": new_liked_status}}
        )
        
        # Update myth like count
        if new_liked_status:
            await db.legal_myths.update_one(
                {"id": myth_id},
                {"$inc": {"likes": 1}}
            )
            await award_xp(current_user.id, 5, "like_myth")
        else:
            await db.legal_myths.update_one(
                {"id": myth_id},
                {"$inc": {"likes": -1}}
            )
    else:
        # Create new progress entry with like
        from models import UserMythProgress
        progress = UserMythProgress(
            user_id=current_user.id,
            myth_id=myth_id,
            read_at=datetime.utcnow(),
            liked=True
        )
        await db.user_myth_progress.insert_one(progress.dict())
        
        # Update myth like count
        await db.legal_myths.update_one(
            {"id": myth_id},
            {"$inc": {"likes": 1}}
        )
        await award_xp(current_user.id, 20, "read_and_like_myth")  # Bonus XP for first interaction
    
    return APIResponse(success=True, message="Myth interaction updated")

@api_router.post("/myths/{myth_id}/share", response_model=APIResponse)
async def share_myth(myth_id: str, current_user: User = Depends(get_current_user)):
    """Track myth sharing"""
    myth = await db.legal_myths.find_one({"id": myth_id})
    if not myth:
        raise HTTPException(status_code=404, detail="Myth not found")
    
    # Update myth share count
    await db.legal_myths.update_one(
        {"id": myth_id},
        {"$inc": {"shares": 1}}
    )
    
    # Award XP for sharing
    await award_xp(current_user.id, 10, "share_myth")
    
    return APIResponse(success=True, message="Myth share tracked", data={"xp_awarded": 10})

@api_router.get("/myths", response_model=APIResponse)
async def get_legal_myths(
    category: Optional[StatuteCategory] = None,
    status: Optional[LegalMythStatus] = None,
    page: int = 1,
    per_page: int = 20
):
    """Legacy endpoint - get legal myths with basic filtering"""
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

# Helper functions for myth-busting feed
async def track_myth_view(user_id: str, myth_id: str):
    """Track when a user reads a myth"""
    # Check if user has read this myth before
    existing_progress = await db.user_myth_progress.find_one({
        "user_id": user_id,
        "myth_id": myth_id
    })
    
    if not existing_progress:
        # First time reading - create progress record and award XP
        from models import UserMythProgress
        progress = UserMythProgress(user_id=user_id, myth_id=myth_id)
        await db.user_myth_progress.insert_one(progress.dict())
        await award_xp(user_id, 15, "read_myth")
        
        # Update myth view count
        await db.legal_myths.update_one(
            {"id": myth_id},
            {"$inc": {"views": 1}}
        )
    else:
        # Update last read time
        await db.user_myth_progress.update_one(
            {"user_id": user_id, "myth_id": myth_id},
            {"$set": {"read_at": datetime.utcnow()}}
        )

# Enhanced Simulation endpoints
@api_router.get("/simulations", response_model=APIResponse)
async def get_simulations(
    category: Optional[SimulationCategory] = None,
    difficulty: Optional[int] = None,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get available simulations with user progress"""
    query = {"is_active": True}
    if category:
        query["category"] = category.value
    if difficulty:
        query["difficulty_level"] = difficulty
    
    total = await db.simulation_scenarios.count_documents(query)
    skip = (page - 1) * per_page
    simulations = await db.simulation_scenarios.find(query).skip(skip).limit(per_page).to_list(per_page)
    
    # Add user progress data
    processed_simulations = []
    for sim in simulations:
        sim_obj = SimulationScenario(**sim)
        sim_dict = sim_obj.dict()
        
        # Get user's progress for this simulation
        user_progress = await db.simulation_progress.find_one({
            "user_id": current_user.id,
            "scenario_id": sim_obj.id
        })
        
        sim_dict["user_completed"] = bool(user_progress and user_progress.get("completed", False))
        sim_dict["user_best_score"] = user_progress.get("score", 0) if user_progress else 0
        sim_dict["user_attempts"] = await db.simulation_progress.count_documents({
            "user_id": current_user.id,
            "scenario_id": sim_obj.id
        })
        
        processed_simulations.append(sim_dict)
    
    return APIResponse(
        success=True,
        message="Simulations retrieved successfully",
        data=PaginatedResponse(
            items=processed_simulations,
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

@api_router.post("/simulations/{scenario_id}/start", response_model=APIResponse)
async def start_simulation(scenario_id: str, current_user: User = Depends(get_current_user)):
    """Start a new simulation session"""
    scenario = await db.simulation_scenarios.find_one({"id": scenario_id, "is_active": True})
    if not scenario:
        raise HTTPException(status_code=404, detail="Simulation scenario not found")
    
    scenario_obj = SimulationScenario(**scenario)
    
    # Create new progress record
    progress = SimulationProgress(
        user_id=current_user.id,
        scenario_id=scenario_id,
        current_node_id=scenario_obj.start_node_id,
        max_possible_score=calculate_max_score(scenario_obj)
    )
    
    await db.simulation_progress.insert_one(progress.dict())
    
    # Get the starting node
    start_node = next((node for node in scenario_obj.scenario_nodes if node.id == scenario_obj.start_node_id), None)
    if not start_node:
        raise HTTPException(status_code=500, detail="Invalid scenario configuration")
    
    return APIResponse(
        success=True,
        message="Simulation started successfully",
        data={
            "progress_id": progress.id,
            "scenario": scenario_obj.dict(),
            "current_node": start_node.dict()
        }
    )

@api_router.post("/simulations/progress/{progress_id}/choice", response_model=APIResponse)
async def make_simulation_choice(
    progress_id: str, 
    choice_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Make a choice in the simulation and advance to next node"""
    progress = await db.simulation_progress.find_one({
        "id": progress_id,
        "user_id": current_user.id,
        "completed": False
    })
    
    if not progress:
        raise HTTPException(status_code=404, detail="Simulation progress not found")
    
    scenario = await db.simulation_scenarios.find_one({"id": progress["scenario_id"]})
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    scenario_obj = SimulationScenario(**scenario)
    
    # Get current node
    current_node = next((node for node in scenario_obj.scenario_nodes if node.id == progress["current_node_id"]), None)
    if not current_node:
        raise HTTPException(status_code=500, detail="Invalid simulation state")
    
    # Validate choice
    choice_index = choice_data.get("choice_index")
    if choice_index is None or choice_index >= len(current_node.choices):
        raise HTTPException(status_code=400, detail="Invalid choice")
    
    selected_choice = current_node.choices[choice_index]
    next_node_id = selected_choice.get("next_node_id")
    choice_score = selected_choice.get("xp_value", 0)
    
    # Update progress
    new_path_entry = {
        "node_id": current_node.id,
        "choice_index": choice_index,
        "choice_text": selected_choice["choice_text"],
        "timestamp": datetime.utcnow().isoformat(),
        "points_earned": choice_score
    }
    
    updated_progress = {
        "path_taken": progress["path_taken"] + [new_path_entry],
        "score": progress["score"] + choice_score,
        "total_xp_earned": progress["total_xp_earned"] + choice_score
    }
    
    # Check if simulation is complete
    if not next_node_id or next_node_id == "END":
        # Simulation completed
        completion_time = int((datetime.utcnow() - datetime.fromisoformat(progress["started_at"].replace('Z', '+00:00'))).total_seconds())
        updated_progress.update({
            "completed": True,
            "completion_time": completion_time,
            "completed_at": datetime.utcnow(),
            "current_node_id": current_node.id  # Stay on final node
        })
        
        # Award XP to user
        await award_xp(current_user.id, updated_progress["total_xp_earned"], "complete_simulation")
        
        # Calculate final outcome
        final_score_percentage = (updated_progress["score"] / progress["max_possible_score"]) * 100
        outcome_message = get_simulation_outcome_message(final_score_percentage, scenario_obj)
        
        await db.simulation_progress.update_one(
            {"id": progress_id},
            {"$set": updated_progress}
        )
        
        return APIResponse(
            success=True,
            message="Simulation completed successfully",
            data={
                "completed": True,
                "final_score": updated_progress["score"],
                "final_score_percentage": final_score_percentage,
                "total_xp_earned": updated_progress["total_xp_earned"],
                "completion_time": completion_time,
                "outcome_message": outcome_message,
                "choice_feedback": selected_choice.get("feedback", ""),
                "legal_explanation": current_node.legal_explanation
            }
        )
    
    else:
        # Continue simulation
        next_node = next((node for node in scenario_obj.scenario_nodes if node.id == next_node_id), None)
        if not next_node:
            raise HTTPException(status_code=500, detail="Invalid next node")
        
        updated_progress["current_node_id"] = next_node_id
        
        await db.simulation_progress.update_one(
            {"id": progress_id},
            {"$set": updated_progress}
        )
        
        return APIResponse(
            success=True,
            message="Choice recorded successfully",
            data={
                "completed": False,
                "current_score": updated_progress["score"],
                "current_node": next_node.dict(),
                "choice_feedback": selected_choice.get("feedback", ""),
                "immediate_consequence": selected_choice.get("immediate_consequence", ""),
                "points_earned": choice_score
            }
        )

@api_router.get("/simulations/progress/{progress_id}", response_model=APIResponse)
async def get_simulation_progress(progress_id: str, current_user: User = Depends(get_current_user)):
    """Get current simulation progress"""
    progress = await db.simulation_progress.find_one({
        "id": progress_id,
        "user_id": current_user.id
    })
    
    if not progress:
        raise HTTPException(status_code=404, detail="Simulation progress not found")
    
    return APIResponse(
        success=True,
        message="Simulation progress retrieved successfully",
        data=SimulationProgress(**progress).dict()
    )

@api_router.get("/simulations/user/history", response_model=APIResponse)
async def get_user_simulation_history(current_user: User = Depends(get_current_user)):
    """Get user's simulation history"""
    history = await db.simulation_progress.find({
        "user_id": current_user.id,
        "completed": True
    }).sort("completed_at", -1).limit(20).to_list(20)
    
    # Enrich with scenario information
    enriched_history = []
    for record in history:
        scenario = await db.simulation_scenarios.find_one({"id": record["scenario_id"]})
        if scenario:
            record["scenario_title"] = scenario["title"]
            record["scenario_category"] = scenario["category"]
        enriched_history.append(record)
    
    return APIResponse(
        success=True,
        message="Simulation history retrieved successfully",
        data=enriched_history
    )

# Helper functions for simulations
def calculate_max_score(scenario: SimulationScenario) -> int:
    """Calculate the maximum possible score for a scenario"""
    total_score = 0
    for node in scenario.scenario_nodes:
        if node.choices:
            max_choice_score = max(choice.get("xp_value", 0) for choice in node.choices)
            total_score += max_choice_score
    return total_score

def get_simulation_outcome_message(score_percentage: float, scenario: SimulationScenario) -> str:
    """Get outcome message based on performance"""
    if score_percentage >= 90:
        return f"🏆 Outstanding! You demonstrated excellent knowledge of your legal rights in this {scenario.category.replace('_', ' ')} scenario. You're well-prepared for real-world situations!"
    elif score_percentage >= 75:
        return f"👏 Great job! You showed good understanding of the legal principles in this {scenario.category.replace('_', ' ')} scenario. A few small improvements and you'll be fully prepared!"
    elif score_percentage >= 60:
        return f"📚 Good effort! You have a basic understanding of the {scenario.category.replace('_', ' ')} scenario, but there's room for improvement. Review the feedback and try again!"
    else:
        return f"🎯 Keep learning! This {scenario.category.replace('_', ' ')} scenario is challenging. Review the legal explanations and practice more to build your confidence!"

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
    """Initialize database with common script templates, legal myths, and simulations"""
    await initialize_script_templates()
    await initialize_legal_myths()
    await initialize_legal_simulations()

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

async def initialize_legal_myths():
    """Initialize the database with engaging legal myths"""
    # Check if myths already exist
    existing_count = await db.legal_myths.count_documents({})
    if existing_count > 0:
        return  # Myths already initialized
    
    legal_myths_data = [
        {
            "title": "Police Must Read Miranda Rights During Any Arrest",
            "myth_statement": "Police are required to read you your Miranda rights as soon as they arrest you.",
            "fact_explanation": "Miranda rights only need to be read if police plan to conduct a custodial interrogation. If they don't question you, they don't need to read your rights. However, you still have the right to remain silent regardless.",
            "category": "criminal_law",
            "difficulty_level": 2,
            "sources": ["Miranda v. Arizona (1966)", "Supreme Court Decisions"],
            "tags": ["miranda", "arrest", "police", "rights"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "You Can't Be Arrested for Not Carrying ID",
            "myth_statement": "It's illegal to not carry identification, and you can be arrested for it.",
            "fact_explanation": "In most states, you're not required to carry ID unless you're driving. However, some 'stop and identify' states require you to provide your name if lawfully detained. You generally cannot be arrested solely for not having ID.",
            "category": "civil_rights",
            "difficulty_level": 3,
            "sources": ["Stop and Identify Laws", "4th Amendment"],
            "tags": ["id", "identification", "arrest", "stop and identify"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "Landlords Can Enter Your Apartment Anytime",
            "myth_statement": "Since landlords own the property, they can enter your rental unit whenever they want.",
            "fact_explanation": "Landlords must provide proper notice (usually 24-48 hours) and have a valid reason to enter your rental unit. Emergency situations are an exception. Tenant privacy rights are protected by law.",
            "category": "housing",
            "difficulty_level": 1,
            "sources": ["State Landlord-Tenant Laws", "Fair Housing Act"],
            "tags": ["landlord", "tenant", "privacy", "rental"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "You Must Answer Police Questions",
            "myth_statement": "If police ask you questions, you are legally required to answer them.",
            "fact_explanation": "You have the 5th Amendment right to remain silent. You're only required to identify yourself in 'stop and identify' states if lawfully detained. Beyond that, you can politely decline to answer questions.",
            "category": "civil_rights",
            "difficulty_level": 2,
            "sources": ["5th Amendment", "Terry v. Ohio"],
            "tags": ["police", "questioning", "5th amendment", "silence"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "Verbal Contracts Aren't Legally Binding",
            "myth_statement": "Only written contracts are legally enforceable - verbal agreements don't count.",
            "fact_explanation": "Verbal contracts can be legally binding, but they're harder to prove in court. Some contracts (like real estate transactions) must be in writing under the Statute of Frauds, but many verbal agreements are enforceable.",
            "category": "contracts",
            "difficulty_level": 3,
            "sources": ["Contract Law", "Statute of Frauds"],
            "tags": ["contracts", "verbal", "written", "binding"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "If You're Injured, You Can Always Sue",
            "myth_statement": "Anyone who gets injured can file a lawsuit and win compensation.",
            "fact_explanation": "To win a personal injury case, you must prove negligence, causation, and damages. Not all injuries result from someone else's fault. There are also statutes of limitations that limit when you can file a lawsuit.",
            "category": "torts",
            "difficulty_level": 2,
            "sources": ["Tort Law", "Negligence Standards"],
            "tags": ["personal injury", "lawsuit", "negligence", "damages"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "You Can't Be Fired Without Cause",
            "myth_statement": "Employers need a good reason to fire employees, and wrongful termination is always illegal.",
            "fact_explanation": "Most employment is 'at-will,' meaning you can be fired for any reason or no reason (except illegal discrimination). Only employees with contracts or in certain protected situations have additional job security.",
            "category": "employment",
            "difficulty_level": 2,
            "sources": ["At-Will Employment Laws", "Title VII"],
            "tags": ["employment", "firing", "at-will", "wrongful termination"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "Public School Students Have No Rights",
            "myth_statement": "Students lose all their constitutional rights when they enter school property.",
            "fact_explanation": "Students don't 'shed their constitutional rights at the schoolhouse gate.' However, schools can impose reasonable restrictions for educational purposes and safety. Students have reduced, but not eliminated, rights.",
            "category": "education",
            "difficulty_level": 3,
            "sources": ["Tinker v. Des Moines", "Student Rights Cases"],
            "tags": ["student rights", "education", "schools", "constitution"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "Speed Limits Are Just Suggestions",
            "myth_statement": "As long as you're driving safely, speed limits don't really matter.",
            "fact_explanation": "Speed limits are legally enforceable. While some states have 'absolute' vs 'prima facie' speed limit laws, exceeding posted limits can result in tickets and liability in accidents. Safe driving includes following speed limits.",
            "category": "traffic",
            "difficulty_level": 1,
            "sources": ["State Traffic Laws", "Vehicle Codes"],
            "tags": ["speed limits", "traffic", "driving", "tickets"],
            "status": "published",
            "published_at": datetime.utcnow()
        },
        {
            "title": "Credit Reports Can't Affect Employment",
            "myth_statement": "Employers can't check your credit report or use it in hiring decisions.",
            "fact_explanation": "Employers can check credit reports for many positions with your written consent. This is especially common for financial roles or positions requiring security clearances. However, some states have restrictions on credit check usage.",
            "category": "employment",
            "difficulty_level": 2,
            "sources": ["Fair Credit Reporting Act", "State Employment Laws"],
            "tags": ["credit report", "employment", "hiring", "background check"],
            "status": "published",
            "published_at": datetime.utcnow()
        }
    ]
    
    # Create legal myths with user ID
    current_user_id = "system"  # System-generated myths
    legal_myths = []
    for myth_data in legal_myths_data:
        myth = LegalMyth(**myth_data, created_by=current_user_id)
        legal_myths.append(myth)
    
async def initialize_legal_simulations():
    """Initialize the database with interactive legal simulation scenarios"""
    # Check if simulations already exist
    existing_count = await db.simulation_scenarios.count_documents({})
    if existing_count > 0:
        return  # Simulations already initialized
    
    simulation_scenarios = [
        # Traffic Stop Simulation
        {
            "title": "Traffic Stop: Know Your Rights",
            "description": "You're driving home when you see flashing lights behind you. How you handle this traffic stop can make all the difference. Practice your rights!",
            "category": "traffic_stop",
            "difficulty_level": 2,
            "estimated_duration": 5,
            "learning_objectives": [
                "Understand your rights during a traffic stop",
                "Learn when you can refuse searches",
                "Practice de-escalation techniques",
                "Know what information you must provide"
            ],
            "legal_context": "Traffic stops are governed by the 4th Amendment protection against unreasonable searches and state traffic laws.",
            "applicable_laws": ["4th Amendment", "State Traffic Codes", "Terry v. Ohio"],
            "start_node_id": "traffic_start",
            "scenario_nodes": [
                {
                    "id": "traffic_start",
                    "title": "Pulled Over",
                    "description": "You see police lights in your rearview mirror. The officer is approaching your vehicle. What's your first action?",
                    "choices": [
                        {
                            "choice_text": "Keep your hands on the steering wheel and wait for the officer",
                            "next_node_id": "traffic_compliant",
                            "is_optimal": True,
                            "feedback": "✅ Excellent! Keeping your hands visible shows you're not a threat and follows best practices.",
                            "immediate_consequence": "The officer approaches calmly, appreciating your cooperation.",
                            "xp_value": 15
                        },
                        {
                            "choice_text": "Get out of the car to meet the officer",
                            "next_node_id": "traffic_mistake",
                            "is_optimal": False,
                            "feedback": "❌ This could be seen as threatening. Stay in your vehicle unless instructed otherwise.",
                            "immediate_consequence": "The officer orders you back into your vehicle and seems more alert.",
                            "xp_value": 5
                        },
                        {
                            "choice_text": "Start looking through your glove compartment for documents",
                            "next_node_id": "traffic_searching",
                            "is_optimal": False,
                            "feedback": "⚠️ Wait for instructions before reaching for anything - officer safety is important.",
                            "immediate_consequence": "The officer asks you to stop moving and keep your hands visible.",
                            "xp_value": 8
                        }
                    ]
                },
                {
                    "id": "traffic_compliant",
                    "title": "Documents Requested",
                    "description": "The officer asks for your driver's license, registration, and insurance. You provide them. Now the officer asks: 'Do you know why I stopped you?'",
                    "choices": [
                        {
                            "choice_text": "Admit to speeding: 'Yes, I was going a bit fast'",
                            "next_node_id": "traffic_admission",
                            "is_optimal": False,
                            "feedback": "❌ Never admit guilt! This admission can be used against you in court.",
                            "immediate_consequence": "The officer notes your admission and continues the investigation.",
                            "xp_value": 5
                        },
                        {
                            "choice_text": "Exercise your right to remain silent: 'I prefer to remain silent'",
                            "next_node_id": "traffic_silent",
                            "is_optimal": True,
                            "feedback": "✅ Perfect! You have the right to remain silent and shouldn't incriminate yourself.",
                            "immediate_consequence": "The officer respects your right and continues with the traffic stop.",
                            "xp_value": 20
                        },
                        {
                            "choice_text": "Ask a question: 'What did I do wrong, officer?'",
                            "next_node_id": "traffic_question",
                            "is_optimal": True,
                            "feedback": "✅ Good! You're not admitting guilt but engaging respectfully.",
                            "immediate_consequence": "The officer explains they clocked you going 10 mph over the limit.",
                            "xp_value": 15
                        }
                    ]
                },
                {
                    "id": "traffic_silent",
                    "title": "Search Request",
                    "description": "The officer asks: 'Mind if I search your vehicle?' How do you respond?",
                    "choices": [
                        {
                            "choice_text": "Consent to the search: 'Sure, go ahead'",
                            "next_node_id": "traffic_consent",
                            "is_optimal": False,
                            "feedback": "❌ You just waived your 4th Amendment rights! Never consent unless they have a warrant.",
                            "immediate_consequence": "The officer searches your car, which could lead to additional complications.",
                            "xp_value": 5
                        },
                        {
                            "choice_text": "Refuse politely: 'I do not consent to searches'",
                            "next_node_id": "traffic_refuse",
                            "is_optimal": True,
                            "feedback": "✅ Excellent! You're exercising your 4th Amendment right against unreasonable searches.",
                            "immediate_consequence": "The officer respects your rights and cannot search without probable cause.",
                            "xp_value": 25
                        }
                    ]
                },
                {
                    "id": "traffic_refuse",
                    "title": "Traffic Stop Conclusion",
                    "description": "The officer respects your refusal and writes you a ticket for speeding. The stop concludes professionally.",
                    "is_end_node": True,
                    "legal_explanation": "You successfully exercised your constitutional rights during this traffic stop. Key takeaways: 1) Keep hands visible, 2) Provide required documents, 3) Exercise your right to remain silent, 4) Never consent to searches without a warrant. You can fight the ticket in court if you believe it was unjustified.",
                    "outcome_type": "positive",
                    "xp_reward": 30
                }
            ]
        },
        
        # ICE Encounter Simulation
        {
            "title": "ICE Encounter: Constitutional Rights",
            "description": "ICE agents appear at your door. Regardless of your immigration status, you have constitutional rights. Learn how to protect yourself and your family.",
            "category": "police_encounter",
            "difficulty_level": 3,
            "estimated_duration": 7,
            "learning_objectives": [
                "Understand your rights regardless of immigration status",
                "Learn about warrant requirements",
                "Practice asserting your rights respectfully",
                "Know when to remain silent"
            ],
            "legal_context": "Constitutional rights apply to all persons on US soil, regardless of immigration status. 4th Amendment protections require warrants for searches.",
            "applicable_laws": ["4th Amendment", "5th Amendment", "Immigration Laws"],
            "start_node_id": "ice_start",
            "scenario_nodes": [
                {
                    "id": "ice_start",
                    "title": "Knock at the Door",
                    "description": "Someone knocks loudly at your door early in the morning. Through the window, you see people in what appear to be official uniforms. What do you do?",
                    "choices": [
                        {
                            "choice_text": "Open the door immediately",
                            "next_node_id": "ice_opened",
                            "is_optimal": False,
                            "feedback": "❌ Never open the door without knowing who it is and seeing a warrant!",
                            "immediate_consequence": "Agents push into your home without showing a warrant.",
                            "xp_value": 5
                        },
                        {
                            "choice_text": "Ask 'Who is it?' through the closed door",
                            "next_node_id": "ice_identify",
                            "is_optimal": True,
                            "feedback": "✅ Good! Always identify who is at your door before opening it.",
                            "immediate_consequence": "The agents identify themselves as ICE officers.",
                            "xp_value": 15
                        },
                        {
                            "choice_text": "Stay silent and hope they go away",
                            "next_node_id": "ice_silent",
                            "is_optimal": False,
                            "feedback": "⚠️ While you have rights, it's better to assert them clearly.",
                            "immediate_consequence": "The knocking continues and gets more persistent.",
                            "xp_value": 10
                        }
                    ]
                },
                {
                    "id": "ice_identify",
                    "title": "ICE at Your Door",
                    "description": "The agents say they're ICE officers and want to come in to ask questions. They don't mention having a warrant. What's your response?",
                    "choices": [
                        {
                            "choice_text": "Ask to see a warrant signed by a judge",
                            "next_node_id": "ice_warrant_request",
                            "is_optimal": True,
                            "feedback": "✅ Perfect! ICE needs a judicial warrant to enter your home without consent.",
                            "immediate_consequence": "You assert your 4th Amendment rights properly.",
                            "xp_value": 25
                        },
                        {
                            "choice_text": "Let them in to cooperate",
                            "next_node_id": "ice_cooperate",
                            "is_optimal": False,
                            "feedback": "❌ You just consented to a search! Never let them in without a warrant.",
                            "immediate_consequence": "ICE enters your home and begins questioning everyone present.",
                            "xp_value": 5
                        }
                    ]
                },
                {
                    "id": "ice_warrant_request",
                    "title": "No Warrant Shown",
                    "description": "The agents cannot produce a judicial warrant. They insist they need to speak with someone inside. How do you respond?",
                    "choices": [
                        {
                            "choice_text": "State clearly: 'I do not consent to your entry. I am exercising my right to remain silent.'",
                            "next_node_id": "ice_rights_asserted",
                            "is_optimal": True,
                            "feedback": "✅ Excellent! You're asserting your constitutional rights clearly and respectfully.",
                            "immediate_consequence": "You've properly invoked your 4th and 5th Amendment rights.",
                            "xp_value": 30
                        },
                        {
                            "choice_text": "Argue with them about immigration law",
                            "next_node_id": "ice_argue",
                            "is_optimal": False,
                            "feedback": "❌ Don't engage in arguments. Simply assert your rights and remain silent.",
                            "immediate_consequence": "The conversation becomes heated and complicated.",
                            "xp_value": 10
                        }
                    ]
                },
                {
                    "id": "ice_rights_asserted",
                    "title": "Rights Successfully Asserted",
                    "description": "Without a warrant, the agents cannot legally enter your home. They eventually leave, unable to violate your constitutional rights.",
                    "is_end_node": True,
                    "legal_explanation": "You successfully protected your constitutional rights! Key points: 1) ICE needs a judicial warrant (not an administrative warrant) to enter your home, 2) You have the right to remain silent regardless of immigration status, 3) You have the right to refuse entry without a warrant, 4) Constitutional rights apply to everyone on US soil. Always remember: stay calm, assert your rights clearly, and contact an attorney if needed.",
                    "outcome_type": "positive",
                    "xp_reward": 40
                }
            ]
        },
        
        # Housing Dispute Simulation
        {
            "title": "Landlord Dispute: Tenant Rights",
            "description": "Your landlord is trying to evict you without proper notice. Learn your rights as a tenant and how to protect yourself from illegal eviction practices.",
            "category": "housing_dispute",
            "difficulty_level": 2,
            "estimated_duration": 6,
            "learning_objectives": [
                "Understand proper eviction procedures",
                "Learn about tenant rights and protections",
                "Know when to seek legal help",
                "Understand documentation requirements"
            ],
            "legal_context": "Tenant-landlord law varies by state but generally requires proper notice, just cause, and court orders for evictions.",
            "applicable_laws": ["State Tenant-Landlord Laws", "Fair Housing Act", "Local Housing Codes"],
            "start_node_id": "housing_start",
            "scenario_nodes": [
                {
                    "id": "housing_start",
                    "title": "Surprise Eviction Notice",
                    "description": "You come home to find a handwritten note on your door from your landlord saying 'You have 3 days to get out or I'm changing the locks.' What's your first step?",
                    "choices": [
                        {
                            "choice_text": "Pack up and leave immediately to avoid conflict",
                            "next_node_id": "housing_leave",
                            "is_optimal": False,
                            "feedback": "❌ Don't let illegal tactics scare you! You have rights that protect you from improper eviction.",
                            "immediate_consequence": "You lose your home and rights unnecessarily.",
                            "xp_value": 5
                        },
                        {
                            "choice_text": "Document the notice and research tenant rights",
                            "next_node_id": "housing_document",
                            "is_optimal": True,
                            "feedback": "✅ Smart! Documentation is crucial and knowing your rights is the first step.",
                            "immediate_consequence": "You have evidence and start building your case.",
                            "xp_value": 20
                        },
                        {
                            "choice_text": "Confront the landlord angrily",
                            "next_node_id": "housing_confront",
                            "is_optimal": False,
                            "feedback": "⚠️ Emotions are understandable, but stay calm and focus on legal remedies.",
                            "immediate_consequence": "The situation escalates and becomes more hostile.",
                            "xp_value": 8
                        }
                    ]
                },
                {
                    "id": "housing_document",
                    "title": "Research Phase",
                    "description": "You discover that your state requires 30 days written notice for eviction and landlords cannot change locks without a court order. Your landlord's notice is clearly illegal. What's next?",
                    "choices": [
                        {
                            "choice_text": "Contact a tenant rights organization or legal aid",
                            "next_node_id": "housing_legal_help",
                            "is_optimal": True,
                            "feedback": "✅ Excellent! Getting legal help early can prevent bigger problems.",
                            "immediate_consequence": "You connect with advocates who know tenant law.",
                            "xp_value": 25
                        },
                        {
                            "choice_text": "Send a certified letter to your landlord explaining their violation",
                            "next_node_id": "housing_letter",
                            "is_optimal": True,
                            "feedback": "✅ Good approach! Documenting your knowledge of the law can deter illegal actions.",
                            "immediate_consequence": "You create a paper trail and assert your rights formally.",
                            "xp_value": 20
                        }
                    ]
                },
                {
                    "id": "housing_legal_help",
                    "title": "Legal Support Secured",
                    "description": "The tenant rights attorney confirms your landlord's actions are illegal and helps you file a complaint. Your housing is protected and you may be entitled to damages.",
                    "is_end_node": True,
                    "legal_explanation": "You successfully protected your tenant rights! Key lessons: 1) Landlords must follow proper legal procedures for evictions, 2) Tenants have the right to proper notice (usually 30+ days), 3) Only courts can order evictions, not landlords, 4) Illegal eviction attempts can result in damages for tenants, 5) Documentation is crucial for protecting your rights. Always know your local tenant laws and don't hesitate to seek legal help.",
                    "outcome_type": "positive",
                    "xp_reward": 35
                }
            ]
        }
    ]
    
    # Create simulation scenarios
    created_scenarios = []
    for scenario_data in simulation_scenarios:
        # Convert scenario nodes
        scenario_nodes = []
        for node_data in scenario_data["scenario_nodes"]:
            node = SimulationNode(**node_data)
            scenario_nodes.append(node)
        
        # Create scenario
        scenario = SimulationScenario(
            **{k: v for k, v in scenario_data.items() if k != "scenario_nodes"},
            scenario_nodes=scenario_nodes,
            created_by="system"
        )
        created_scenarios.append(scenario)
    
    await db.simulation_scenarios.insert_many([scenario.dict() for scenario in created_scenarios])
    logging.info(f"Initialized {len(created_scenarios)} legal simulation scenarios")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
