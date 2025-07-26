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

# Search suggestions endpoint
@api_router.get("/statutes/search/suggestions", response_model=APIResponse)
async def get_search_suggestions(q: str):
    if len(q) < 2:
        return APIResponse(success=True, message="Query too short", data=[])
    
    # Get suggestions from titles and keywords
    title_matches = await db.legal_statutes.find({
        "title": {"$regex": f".*{q}.*", "$options": "i"}
    }).limit(5).to_list(5)
    
    keyword_matches = await db.legal_statutes.find({
        "keywords": {"$in": [{"$regex": f".*{q}.*", "$options": "i"}]}
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

# AI Query endpoints (placeholder - will need AI integration)
@api_router.post("/ai/query", response_model=APIResponse)
async def create_ai_query(query_data: AIQueryCreate, current_user: User = Depends(get_current_user)):
    # For now, create a placeholder response
    # TODO: Integrate with AI service (OpenAI, Claude, etc.)
    query = AIQuery(
        **query_data.dict(),
        user_id=current_user.id,
        response="This is a placeholder response. AI integration will be implemented.",
        confidence_score=0.8
    )
    await db.ai_queries.insert_one(query.dict())
    return APIResponse(success=True, message="AI query processed", data=query.dict())

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
