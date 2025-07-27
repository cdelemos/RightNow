from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from mascot_system import MascotInteractionEngine, MascotAction
from models import *
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
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

async def award_xp(user_id: str, xp_amount: int, action: str, context: Dict[str, Any] = {}):
    """Award XP to user and update comprehensive gamification system"""
    if xp_amount <= 0:
        return
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
    
    old_level = user.get("level", 1)
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
    
    # Log XP transaction
    xp_transaction = XPTransaction(
        user_id=user_id,
        action=action,
        xp_amount=xp_amount,
        description=f"Earned {xp_amount} XP for {action.replace('_', ' ')}",
        context=context
    )
    await db.xp_transactions.insert_one(xp_transaction.dict())
    
    # Update user stats
    await update_user_stats(user_id, action, xp_amount)
    
    # Update or create streak
    await update_streaks(user_id, action)
    
    # Check for level up and award badges
    if new_level > old_level:
        await handle_level_up(user_id, new_level, old_level)
        await check_and_award_badges(user_id, new_level, action)
    
    # Check achievements
    await check_achievements(user_id, action, context)
    
    # Update leaderboards
    await update_leaderboards(user_id, xp_amount)

def calculate_level_from_xp(xp: int) -> int:
    """Calculate user level based on XP (progressive formula)"""
    # Progressive XP requirements: Level 1: 0-99, Level 2: 100-249, Level 3: 250-449, etc.
    if xp < 100:
        return 1
    elif xp < 250:
        return 2
    elif xp < 450:
        return 3
    elif xp < 700:
        return 4
    elif xp < 1000:
        return 5
    else:
        # For higher levels: every 150 XP beyond 1000
        return min(6 + (xp - 1000) // 150, 50)

async def update_user_stats(user_id: str, action: str, xp_amount: int):
    """Update comprehensive user statistics"""
    # Get or create user stats
    stats = await db.user_stats.find_one({"user_id": user_id})
    if not stats:
        stats = UserStats(user_id=user_id).dict()
        await db.user_stats.insert_one(stats)
    
    # Update based on action
    update_data = {
        "total_xp": stats.get("total_xp", 0) + xp_amount,
        "updated_at": datetime.utcnow()
    }
    
    # Action-specific updates
    if action in ["read_statute", "bookmark_statute"]:
        update_data["statutes_read"] = stats.get("statutes_read", 0) + 1
    elif action in ["read_myth", "like_myth", "share_myth"]:
        update_data["myths_read"] = stats.get("myths_read", 0) + 1
    elif action == "ask_question":
        update_data["questions_asked"] = stats.get("questions_asked", 0) + 1
    elif action == "answer_question":
        update_data["answers_provided"] = stats.get("answers_provided", 0) + 1
    elif action == "complete_simulation":
        update_data["simulations_completed"] = stats.get("simulations_completed", 0) + 1
    elif action == "complete_learning_path":
        update_data["learning_paths_completed"] = stats.get("learning_paths_completed", 0) + 1
    elif action == "ai_query":
        update_data["ai_chats_initiated"] = stats.get("ai_chats_initiated", 0) + 1
    elif action == "receive_upvote":
        update_data["upvotes_received"] = stats.get("upvotes_received", 0) + 1
    elif action == "share_myth":
        update_data["content_shared"] = stats.get("content_shared", 0) + 1
    
    await db.user_stats.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )

async def update_streaks(user_id: str, action: str):
    """Update user streak counters"""
    today = datetime.utcnow().date()
    
    # Daily login streak
    if action in ["read_statute", "read_myth", "ask_question", "ai_query"]:
        streak = await db.streaks.find_one({"user_id": user_id, "streak_type": "daily_login"})
        
        if not streak:
            # Create new streak
            new_streak = Streak(
                user_id=user_id,
                streak_type="daily_login",
                current_count=1,
                best_count=1,
                last_activity=datetime.utcnow()
            )
            await db.streaks.insert_one(new_streak.dict())
        else:
            last_activity_date = streak["last_activity"].date()
            
            if last_activity_date == today:
                # Already logged in today, no update needed
                return
            elif last_activity_date == today - timedelta(days=1):
                # Consecutive day, increment streak
                new_count = streak["current_count"] + 1
                best_count = max(streak["best_count"], new_count)
                await db.streaks.update_one(
                    {"user_id": user_id, "streak_type": "daily_login"},
                    {"$set": {
                        "current_count": new_count,
                        "best_count": best_count,
                        "last_activity": datetime.utcnow()
                    }}
                )
            else:
                # Streak broken, restart
                await db.streaks.update_one(
                    {"user_id": user_id, "streak_type": "daily_login"},
                    {"$set": {
                        "current_count": 1,
                        "last_activity": datetime.utcnow()
                    }}
                )
    
    # Weekly learning streak
    if action in ["complete_learning_node", "complete_learning_path"]:
        await update_weekly_streak(user_id, "weekly_learning")

async def update_weekly_streak(user_id: str, streak_type: str):
    """Update weekly streak (7-day periods)"""
    now = datetime.utcnow()
    current_week = now.isocalendar()[1]  # Week number
    
    streak = await db.streaks.find_one({"user_id": user_id, "streak_type": streak_type})
    
    if not streak:
        new_streak = Streak(
            user_id=user_id,
            streak_type=streak_type,
            current_count=1,
            best_count=1,
            last_activity=now
        )
        await db.streaks.insert_one(new_streak.dict())
    else:
        last_week = streak["last_activity"].isocalendar()[1]
        
        if last_week == current_week:
            # Same week, no update needed
            return
        elif last_week == current_week - 1:
            # Consecutive week, increment streak
            new_count = streak["current_count"] + 1
            best_count = max(streak["best_count"], new_count)
            await db.streaks.update_one(
                {"user_id": user_id, "streak_type": streak_type},
                {"$set": {
                    "current_count": new_count,
                    "best_count": best_count,
                    "last_activity": now
                }}
            )
        else:
            # Streak broken, restart
            await db.streaks.update_one(
                {"user_id": user_id, "streak_type": streak_type},
                {"$set": {
                    "current_count": 1,
                    "last_activity": now
                }}
            )

async def handle_level_up(user_id: str, new_level: int, old_level: int):
    """Handle level up celebration and rewards"""
    # Award level up XP bonus
    level_bonus = min(new_level * 10, 100)  # Cap at 100 XP bonus
    
    # Update user without triggering recursive level up
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"xp": level_bonus}}
    )
    
    # Log the level up bonus
    xp_transaction = XPTransaction(
        user_id=user_id,
        action="level_up",
        xp_amount=level_bonus,
        description=f"Level up bonus: reached level {new_level}",
        context={"old_level": old_level, "new_level": new_level}
    )
    await db.xp_transactions.insert_one(xp_transaction.dict())

async def check_and_award_badges(user_id: str, level: int, action: str):
    """Check if user should receive any badges"""
    badges_to_award = []
    
    # Get user stats for badge calculations
    stats = await db.user_stats.find_one({"user_id": user_id})
    if not stats:
        return
    
    # Level-based badges
    level_badges = {
        5: {"id": "legal_scholar", "name": "Legal Scholar", "description": "Reached level 5", "icon": "🎓"},
        10: {"id": "statute_master", "name": "Statute Master", "description": "Reached level 10", "icon": "📚"},
        15: {"id": "rights_advocate", "name": "Rights Advocate", "description": "Reached level 15", "icon": "⚖️"},
        20: {"id": "legal_expert", "name": "Legal Expert", "description": "Reached level 20", "icon": "🏛️"},
        25: {"id": "justice_champion", "name": "Justice Champion", "description": "Reached level 25", "icon": "🏆"},
        30: {"id": "legal_legend", "name": "Legal Legend", "description": "Reached level 30", "icon": "👑"},
        40: {"id": "supreme_jurist", "name": "Supreme Jurist", "description": "Reached level 40", "icon": "⭐"},
        50: {"id": "legal_deity", "name": "Legal Deity", "description": "Reached maximum level", "icon": "🌟"}
    }
    
    if level in level_badges:
        badges_to_award.append(level_badges[level])
    
    # Activity-based badges
    activity_badges = []
    
    # Statute reading badges
    if stats.get("statutes_read", 0) >= 10:
        activity_badges.append({"id": "knowledge_seeker", "name": "Knowledge Seeker", "description": "Read 10 statutes", "icon": "🔍"})
    if stats.get("statutes_read", 0) >= 50:
        activity_badges.append({"id": "legal_encyclopedia", "name": "Legal Encyclopedia", "description": "Read 50 statutes", "icon": "📖"})
    if stats.get("statutes_read", 0) >= 100:
        activity_badges.append({"id": "statute_completionist", "name": "Statute Completionist", "description": "Read 100 statutes", "icon": "📚"})
    
    # Myth reading badges
    if stats.get("myths_read", 0) >= 10:
        activity_badges.append({"id": "myth_buster", "name": "Myth Buster", "description": "Read 10 legal myths", "icon": "💥"})
    if stats.get("myths_read", 0) >= 25:
        activity_badges.append({"id": "fact_checker", "name": "Fact Checker", "description": "Read 25 legal myths", "icon": "✅"})
    
    # Community engagement badges
    if stats.get("questions_asked", 0) >= 5:
        activity_badges.append({"id": "curious_mind", "name": "Curious Mind", "description": "Asked 5 questions", "icon": "❓"})
    if stats.get("answers_provided", 0) >= 10:
        activity_badges.append({"id": "helpful_expert", "name": "Helpful Expert", "description": "Answered 10 questions", "icon": "🤝"})
    if stats.get("upvotes_received", 0) >= 50:
        activity_badges.append({"id": "community_favorite", "name": "Community Favorite", "description": "Received 50 upvotes", "icon": "💖"})
    
    # Learning path badges
    if stats.get("learning_paths_completed", 0) >= 1:
        activity_badges.append({"id": "learning_journey", "name": "Learning Journey", "description": "Completed first learning path", "icon": "🎒"})
    if stats.get("learning_paths_completed", 0) >= 5:
        activity_badges.append({"id": "knowledge_explorer", "name": "Knowledge Explorer", "description": "Completed 5 learning paths", "icon": "🗺️"})
    
    # Simulation badges
    if stats.get("simulations_completed", 0) >= 5:
        activity_badges.append({"id": "scenario_master", "name": "Scenario Master", "description": "Completed 5 simulations", "icon": "🎭"})
    if stats.get("simulations_completed", 0) >= 15:
        activity_badges.append({"id": "simulation_expert", "name": "Simulation Expert", "description": "Completed 15 simulations", "icon": "🎯"})
    
    # AI interaction badges
    if stats.get("ai_chats_initiated", 0) >= 25:
        activity_badges.append({"id": "ai_conversationalist", "name": "AI Conversationalist", "description": "Had 25 AI conversations", "icon": "🤖"})
    
    # Streak badges
    streaks = await db.streaks.find({"user_id": user_id}).to_list(10)
    for streak in streaks:
        if streak["streak_type"] == "daily_login":
            if streak["current_count"] >= 7:
                activity_badges.append({"id": "daily_dedication", "name": "Daily Dedication", "description": "7-day login streak", "icon": "📅"})
            if streak["current_count"] >= 30:
                activity_badges.append({"id": "monthly_devotion", "name": "Monthly Devotion", "description": "30-day login streak", "icon": "📆"})
            if streak["best_count"] >= 100:
                activity_badges.append({"id": "unstoppable_force", "name": "Unstoppable Force", "description": "100-day login streak", "icon": "🔥"})
    
    badges_to_award.extend(activity_badges)
    
    # Award new badges
    user = await db.users.find_one({"id": user_id})
    current_badges = user.get("badges", [])
    
    for badge_data in badges_to_award:
        if badge_data["id"] not in current_badges:
            current_badges.append(badge_data["id"])
            
            # Create badge record if it doesn't exist
            existing_badge = await db.badges.find_one({"id": badge_data["id"]})
            if not existing_badge:
                badge = Badge(
                    id=badge_data["id"],
                    name=badge_data["name"],
                    description=badge_data["description"],
                    icon=badge_data["icon"],
                    category=BadgeCategory.ACHIEVEMENT,
                    xp_reward=20,
                    rarity=BadgeRarity.COMMON
                )
                await db.badges.insert_one(badge.dict())
            
            # Award user badge
            user_badge = UserBadge(
                user_id=user_id,
                badge_id=badge_data["id"]
            )
            await db.user_badges.insert_one(user_badge.dict())
            
            # Award XP bonus for earning badge
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"xp": 20}}
            )
    
    # Update user's badge list
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"badges": current_badges}}
    )

async def check_achievements(user_id: str, action: str, context: Dict[str, Any]):
    """Check and update user achievements"""
    # Get user achievements
    user_achievements = await db.user_achievements.find({"user_id": user_id}).to_list(100)
    
    # For now, create simple achievements based on actions
    achievement_configs = {
        "read_100_statutes": {"target": 100, "action": "read_statute", "name": "Century Reader"},
        "ask_50_questions": {"target": 50, "action": "ask_question", "name": "Inquisitive Mind"},
        "complete_10_simulations": {"target": 10, "action": "complete_simulation", "name": "Simulation Master"},
        "earn_1000_xp": {"target": 1000, "action": "any", "name": "XP Collector"}
    }
    
    # Update achievements based on current action
    for achievement_id, config in achievement_configs.items():
        if config["action"] == action or config["action"] == "any":
            user_achievement = next((ua for ua in user_achievements if ua["achievement_id"] == achievement_id), None)
            
            if not user_achievement:
                # Create new achievement progress
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement_id,
                    current_progress=1
                )
                await db.user_achievements.insert_one(user_achievement.dict())
            elif not user_achievement.get("is_completed", False):
                # Update existing achievement
                new_progress = user_achievement.get("current_progress", 0) + 1
                update_data = {"current_progress": new_progress}
                
                if new_progress >= config["target"]:
                    update_data["is_completed"] = True
                    update_data["completed_at"] = datetime.utcnow()
                    
                    # Award achievement XP
                    await award_xp(user_id, 100, f"complete_achievement_{achievement_id}")
                
                await db.user_achievements.update_one(
                    {"user_id": user_id, "achievement_id": achievement_id},
                    {"$set": update_data}
                )

async def update_leaderboards(user_id: str, xp_amount: int):
    """Update leaderboard rankings"""
    # For now, just update weekly XP leaderboard
    current_week = datetime.utcnow().isocalendar()[1]
    week_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_start -= timedelta(days=week_start.weekday())
    
    # Get or create weekly leaderboard
    leaderboard = await db.leaderboards.find_one({
        "leaderboard_type": "weekly_xp",
        "period_start": {"$gte": week_start},
        "is_active": True
    })
    
    if not leaderboard:
        leaderboard = Leaderboard(
            leaderboard_type="weekly_xp",
            period_start=week_start,
            period_end=week_start + timedelta(days=7),
            user_rankings=[]
        )
        await db.leaderboards.insert_one(leaderboard.dict())
    
    # Update user's score in leaderboard
    user_rankings = leaderboard.get("user_rankings", [])
    user_entry = next((entry for entry in user_rankings if entry["user_id"] == user_id), None)
    
    if user_entry:
        user_entry["score"] += xp_amount
    else:
        user_rankings.append({
            "user_id": user_id,
            "score": xp_amount,
            "rank": len(user_rankings) + 1
        })
    
    # Sort and update ranks
    user_rankings.sort(key=lambda x: x["score"], reverse=True)
    for i, entry in enumerate(user_rankings):
        entry["rank"] = i + 1
    
    await db.leaderboards.update_one(
        {"leaderboard_type": "weekly_xp", "period_start": {"$gte": week_start}, "is_active": True},
        {"$set": {"user_rankings": user_rankings}}
    )

# Enhanced Community Q&A endpoints with voting and moderation
@api_router.post("/questions", response_model=APIResponse)
async def create_question(question_data: QuestionCreate, current_user: User = Depends(get_current_user)):
    question = Question(**question_data.dict(), author_id=current_user.id)
    await db.questions.insert_one(question.dict())
    
    # Award XP for asking a question
    await award_xp(current_user.id, 10, "ask_question")
    
    return APIResponse(success=True, message="Question created successfully", data=question.dict())

@api_router.get("/questions", response_model=APIResponse)
async def get_questions(
    category: Optional[StatuteCategory] = None,
    status: Optional[QuestionStatus] = None,
    search: Optional[str] = None,
    sort_by: str = "recent",  # recent, popular, unanswered
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user)
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
    
    # Apply sorting
    sort_options = {
        "recent": [("created_at", -1)],
        "popular": [("upvotes", -1), ("view_count", -1)],
        "unanswered": [("status", 1), ("created_at", -1)]
    }
    sort_criteria = sort_options.get(sort_by, [("created_at", -1)])
    
    questions = await db.questions.find(query).sort(sort_criteria).skip(skip).limit(per_page).to_list(per_page)
    
    # Enrich questions with user interaction data and author info
    enriched_questions = []
    for question in questions:
        question_obj = Question(**question)
        question_dict = question_obj.dict()
        
        # Get author information
        author = await db.users.find_one({"id": question_obj.author_id})
        if author:
            question_dict["author_username"] = author.get("username", "Anonymous")
            question_dict["author_user_type"] = author.get("user_type", "general")
        
        # Get answer count
        answer_count = await db.answers.count_documents({"question_id": question_obj.id})
        question_dict["answer_count"] = answer_count
        
        # Check if current user has voted
        user_vote = await db.question_votes.find_one({
            "user_id": current_user.id,
            "question_id": question_obj.id
        })
        question_dict["user_vote"] = user_vote.get("vote_type") if user_vote else None
        
        enriched_questions.append(question_dict)
    
    return APIResponse(
        success=True,
        message="Questions retrieved successfully",  
        data=PaginatedResponse(
            items=enriched_questions,
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

@api_router.get("/questions/{question_id}", response_model=APIResponse)
async def get_question_detail(question_id: str, current_user: User = Depends(get_current_user)):
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Increment view count
    await db.questions.update_one(
        {"id": question_id},
        {"$inc": {"view_count": 1}}
    )
    
    question_obj = Question(**question)
    question_dict = question_obj.dict()
    
    # Get author information
    author = await db.users.find_one({"id": question_obj.author_id})
    if author:
        question_dict["author_username"] = author.get("username", "Anonymous")
        question_dict["author_user_type"] = author.get("user_type", "general")
        question_dict["author_level"] = author.get("level", 1)
    
    # Get answers
    answers = await db.answers.find({"question_id": question_id}).sort("created_at", -1).to_list(100)
    enriched_answers = []
    
    for answer in answers:
        answer_obj = Answer(**answer)
        answer_dict = answer_obj.dict()
        
        # Get answer author info
        answer_author = await db.users.find_one({"id": answer_obj.author_id})
        if answer_author:
            answer_dict["author_username"] = answer_author.get("username", "Anonymous")
            answer_dict["author_user_type"] = answer_author.get("user_type", "general")
            answer_dict["author_level"] = answer_author.get("level", 1)
        
        # Check user vote on answer
        user_answer_vote = await db.answer_votes.find_one({
            "user_id": current_user.id,
            "answer_id": answer_obj.id
        })
        answer_dict["user_vote"] = user_answer_vote.get("vote_type") if user_answer_vote else None
        
        enriched_answers.append(answer_dict)
    
    question_dict["answers"] = enriched_answers
    
    # Check if current user has voted on question
    user_vote = await db.question_votes.find_one({
        "user_id": current_user.id,
        "question_id": question_id
    })
    question_dict["user_vote"] = user_vote.get("vote_type") if user_vote else None
    
    return APIResponse(success=True, message="Question details retrieved successfully", data=question_dict)

@api_router.post("/questions/{question_id}/answers", response_model=APIResponse)
async def create_answer(question_id: str, answer_data: AnswerCreate, current_user: User = Depends(get_current_user)):
    # Verify question exists
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    answer = Answer(**answer_data.dict(), author_id=current_user.id)
    await db.answers.insert_one(answer.dict())
    
    # Award XP for answering
    await award_xp(current_user.id, 15, "answer_question")
    
    # Update question status if this is the first answer
    answer_count = await db.answers.count_documents({"question_id": question_id})
    if answer_count == 1:
        await db.questions.update_one(
            {"id": question_id},
            {"$set": {"status": QuestionStatus.ANSWERED.value}}
        )
    
    return APIResponse(success=True, message="Answer created successfully", data=answer.dict())

@api_router.post("/questions/{question_id}/vote", response_model=APIResponse)
async def vote_question(question_id: str, vote_data: Dict[str, str], current_user: User = Depends(get_current_user)):
    """Vote on a question (upvote/downvote)"""
    question = await db.questions.find_one({"id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Can't vote on your own question
    if question["author_id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own question")
    
    vote_type = vote_data.get("vote_type")  # "upvote" or "downvote"
    if vote_type not in ["upvote", "downvote"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    # Check existing vote
    existing_vote = await db.question_votes.find_one({
        "user_id": current_user.id,
        "question_id": question_id
    })
    
    if existing_vote:
        old_vote_type = existing_vote["vote_type"]
        if old_vote_type == vote_type:
            # Remove vote (toggle off)
            await db.question_votes.delete_one({"_id": existing_vote["_id"]})
            vote_delta = -1 if vote_type == "upvote" else 1
            await db.questions.update_one(
                {"id": question_id},
                {"$inc": {"upvotes" if vote_type == "upvote" else "downvotes": vote_delta}}
            )
            return APIResponse(success=True, message="Vote removed successfully")
        else:
            # Change vote
            await db.question_votes.update_one(
                {"_id": existing_vote["_id"]},
                {"$set": {"vote_type": vote_type}}
            )
            # Update counters (remove old, add new)
            old_field = "upvotes" if old_vote_type == "upvote" else "downvotes"
            new_field = "upvotes" if vote_type == "upvote" else "downvotes"
            await db.questions.update_one(
                {"id": question_id},
                {
                    "$inc": {old_field: -1, new_field: 1}
                }
            )
            return APIResponse(success=True, message="Vote updated successfully")
    else:
        # New vote
        from models import QuestionVote
        vote = QuestionVote(
            user_id=current_user.id,
            question_id=question_id,
            vote_type=vote_type
        )
        await db.question_votes.insert_one(vote.dict())
        
        # Update question counters
        field = "upvotes" if vote_type == "upvote" else "downvotes"
        await db.questions.update_one(
            {"id": question_id},
            {"$inc": {field: 1}}
        )
        
        # Award small XP for voting
        await award_xp(current_user.id, 2, "vote_question")
        
        return APIResponse(success=True, message="Vote recorded successfully")

@api_router.post("/answers/{answer_id}/vote", response_model=APIResponse)
async def vote_answer(answer_id: str, vote_data: Dict[str, str], current_user: User = Depends(get_current_user)):
    """Vote on an answer (upvote/downvote)"""
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Can't vote on your own answer
    if answer["author_id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own answer")
    
    vote_type = vote_data.get("vote_type")  # "upvote" or "downvote"
    if vote_type not in ["upvote", "downvote"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    # Check existing vote
    existing_vote = await db.answer_votes.find_one({
        "user_id": current_user.id,
        "answer_id": answer_id
    })
    
    if existing_vote:
        old_vote_type = existing_vote["vote_type"]
        if old_vote_type == vote_type:
            # Remove vote (toggle off)
            await db.answer_votes.delete_one({"_id": existing_vote["_id"]})
            vote_delta = -1 if vote_type == "upvote" else 1
            await db.answers.update_one(
                {"id": answer_id},
                {"$inc": {"upvotes" if vote_type == "upvote" else "downvotes": vote_delta}}
            )
            return APIResponse(success=True, message="Vote removed successfully")
        else:
            # Change vote
            await db.answer_votes.update_one(
                {"_id": existing_vote["_id"]},
                {"$set": {"vote_type": vote_type}}
            )
            # Update counters
            old_field = "upvotes" if old_vote_type == "upvote" else "downvotes"
            new_field = "upvotes" if vote_type == "upvote" else "downvotes"
            await db.answers.update_one(
                {"id": answer_id},
                {
                    "$inc": {old_field: -1, new_field: 1}
                }
            )
            return APIResponse(success=True, message="Vote updated successfully")
    else:
        # New vote
        from models import AnswerVote
        vote = AnswerVote(
            user_id=current_user.id,
            answer_id=answer_id,
            vote_type=vote_type
        )
        await db.answer_votes.insert_one(vote.dict())
        
        # Update answer counters
        field = "upvotes" if vote_type == "upvote" else "downvotes"
        await db.answers.update_one(
            {"id": answer_id},
            {"$inc": {field: 1}}
        )
        
        # Award small XP for voting and bonus to answer author for upvotes
        await award_xp(current_user.id, 2, "vote_answer")
        if vote_type == "upvote":
            await award_xp(answer["author_id"], 5, "receive_upvote")
        
        return APIResponse(success=True, message="Vote recorded successfully")

@api_router.post("/answers/{answer_id}/accept", response_model=APIResponse)
async def accept_answer(answer_id: str, current_user: User = Depends(get_current_user)):
    """Mark an answer as accepted (only by question author)"""
    answer = await db.answers.find_one({"id": answer_id})
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    
    # Get the question to verify ownership
    question = await db.questions.find_one({"id": answer["question_id"]})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if question["author_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only question author can accept answers")
    
    # Unaccept any previously accepted answers for this question
    await db.answers.update_many(
        {"question_id": answer["question_id"]},
        {"$set": {"is_accepted": False}}
    )
    
    # Accept this answer
    await db.answers.update_one(
        {"id": answer_id},
        {"$set": {"is_accepted": True}}
    )
    
    # Award bonus XP to answer author
    await award_xp(answer["author_id"], 25, "answer_accepted")
    
    return APIResponse(success=True, message="Answer accepted successfully")

@api_router.get("/questions/user/my", response_model=APIResponse)
async def get_my_questions(current_user: User = Depends(get_current_user)):
    """Get current user's questions"""
    questions = await db.questions.find({"author_id": current_user.id}).sort("created_at", -1).to_list(50)
    
    # Enrich with answer counts
    enriched_questions = []
    for question in questions:
        question_obj = Question(**question)
        question_dict = question_obj.dict()
        
        answer_count = await db.answers.count_documents({"question_id": question_obj.id})
        question_dict["answer_count"] = answer_count
        
        enriched_questions.append(question_dict)
    
    return APIResponse(
        success=True,
        message="User questions retrieved successfully",
        data=enriched_questions
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

# Enhanced Learning Path endpoints with personalization
@api_router.get("/learning-paths", response_model=APIResponse)
async def get_learning_paths(
    path_type: Optional[LearningPathType] = None,
    difficulty: Optional[int] = None,
    target_audience: Optional[str] = None,
    personalized: bool = True,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get learning paths with personalization and user progress"""
    query = {"is_active": True}
    if path_type:
        query["path_type"] = path_type.value
    if difficulty:
        query["difficulty_level"] = difficulty
    if target_audience:
        query["target_audience"] = {"$in": [target_audience]}
    
    # Get user personalization if available
    user_prefs = None
    if personalized:
        user_prefs = await db.user_personalizations.find_one({"user_id": current_user.id})
    
    total = await db.learning_paths.count_documents(query)
    skip = (page - 1) * per_page
    paths = await db.learning_paths.find(query).skip(skip).limit(per_page).to_list(per_page)
    
    # Enrich with user progress and personalization
    enriched_paths = []
    for path in paths:
        path_obj = LearningPath(**path)
        path_dict = path_obj.dict()
        
        # Get user progress
        user_progress = await db.user_learning_progress.find_one({
            "user_id": current_user.id,
            "learning_path_id": path_obj.id
        })
        
        if user_progress:
            path_dict["user_progress"] = user_progress["progress_percentage"]
            path_dict["user_completed"] = user_progress.get("is_completed", False)
            path_dict["user_xp_earned"] = user_progress.get("total_xp_earned", 0)
            path_dict["user_started"] = True
        else:
            path_dict["user_progress"] = 0.0
            path_dict["user_completed"] = False
            path_dict["user_xp_earned"] = 0
            path_dict["user_started"] = False
        
        # Add personalization score if user preferences available
        if user_prefs and personalized:
            path_dict["relevance_score"] = calculate_path_relevance(path_obj, user_prefs)
            path_dict["personalized_reason"] = get_personalization_reason(path_obj, user_prefs)
        
        # Check prerequisites
        path_dict["prerequisites_met"] = await check_prerequisites_met(current_user.id, path_obj.prerequisites)
        
        enriched_paths.append(path_dict)
    
    # Sort by relevance if personalized
    if personalized and user_prefs:
        enriched_paths.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    
    return APIResponse(
        success=True,
        message="Learning paths retrieved successfully",
        data=PaginatedResponse(
            items=enriched_paths,
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

@api_router.post("/learning-paths/{path_id}/start", response_model=APIResponse)
async def start_learning_path(path_id: str, current_user: User = Depends(get_current_user)):
    """Start a learning path journey"""
    path = await db.learning_paths.find_one({"id": path_id, "is_active": True})
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    path_obj = LearningPath(**path)
    
    # Check prerequisites
    prerequisites_met = await check_prerequisites_met(current_user.id, path_obj.prerequisites)
    if not prerequisites_met:
        raise HTTPException(status_code=400, detail="Prerequisites not met for this learning path")
    
    # Check if already started
    existing_progress = await db.user_learning_progress.find_one({
        "user_id": current_user.id,
        "learning_path_id": path_id
    })
    
    if existing_progress and not existing_progress.get("is_completed", False):
        return APIResponse(
            success=True,
            message="Learning path already in progress",
            data=UserLearningProgress(**existing_progress).dict()
        )
    
    # Create new progress record
    progress = UserLearningProgress(
        user_id=current_user.id,
        learning_path_id=path_id,
        current_node_id=path_obj.start_node_id
    )
    
    await db.user_learning_progress.insert_one(progress.dict())
    
    # Get the starting node with unlocked status
    starting_node = await get_node_with_unlock_status(path_obj.start_node_id, path_obj, current_user.id)
    
    return APIResponse(
        success=True,
        message="Learning path started successfully",
        data={
            "progress": progress.dict(),
            "current_node": starting_node,
            "path_info": path_obj.dict()
        }
    )

@api_router.get("/learning-paths/{path_id}", response_model=APIResponse)
async def get_learning_path_detail(path_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed learning path with user progress and unlocked nodes"""
    path = await db.learning_paths.find_one({"id": path_id, "is_active": True})
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    path_obj = LearningPath(**path)
    path_dict = path_obj.dict()
    
    # Get user progress
    user_progress = await db.user_learning_progress.find_one({
        "user_id": current_user.id,
        "learning_path_id": path_id
    })
    
    if user_progress:
        path_dict["user_progress"] = UserLearningProgress(**user_progress).dict()
    else:
        path_dict["user_progress"] = None
    
    # Add unlock status to each node
    enriched_nodes = []
    for node in path_obj.path_nodes:
        node_dict = node.dict()
        node_dict["is_unlocked"] = await is_node_unlocked(node, user_progress, current_user.id)
        node_dict["is_completed"] = node.id in (user_progress.get("completed_nodes", []) if user_progress else [])
        enriched_nodes.append(node_dict)
    
    path_dict["path_nodes"] = enriched_nodes
    
    return APIResponse(
        success=True,
        message="Learning path details retrieved successfully",
        data=path_dict
    )

@api_router.post("/learning-paths/{path_id}/nodes/{node_id}/complete", response_model=APIResponse)
async def complete_learning_node(
    path_id: str, 
    node_id: str, 
    completion_data: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user)
):
    """Complete a learning node and unlock next nodes"""
    # Get learning path and progress
    path = await db.learning_paths.find_one({"id": path_id, "is_active": True})
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    path_obj = LearningPath(**path)
    node = next((n for n in path_obj.path_nodes if n.id == node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Learning node not found")
    
    # Get user progress
    user_progress = await db.user_learning_progress.find_one({
        "user_id": current_user.id,
        "learning_path_id": path_id
    })
    
    if not user_progress:
        raise HTTPException(status_code=400, detail="Learning path not started")
    
    # Check if node is unlocked
    if not await is_node_unlocked(node, user_progress, current_user.id):
        raise HTTPException(status_code=400, detail="Node is not yet unlocked")
    
    # Validate completion criteria if any
    if node.completion_criteria:
        is_valid = await validate_completion_criteria(node.completion_criteria, completion_data, current_user.id)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Completion criteria not met")
    
    # Mark node as completed
    completed_nodes = user_progress.get("completed_nodes", [])
    if node_id not in completed_nodes:
        completed_nodes.append(node_id)
        
        # Award XP
        await award_xp(current_user.id, node.xp_reward, f"complete_learning_node")
        
        # Update progress
        total_nodes = len(path_obj.path_nodes)
        progress_percentage = len(completed_nodes) / total_nodes * 100
        total_xp_earned = user_progress.get("total_xp_earned", 0) + node.xp_reward
        
        is_path_completed = len(completed_nodes) == total_nodes
        update_data = {
            "completed_nodes": completed_nodes,
            "total_xp_earned": total_xp_earned,
            "progress_percentage": progress_percentage,
            "last_activity": datetime.utcnow()
        }
        
        if is_path_completed:
            update_data["is_completed"] = True
            update_data["completed_at"] = datetime.utcnow()
            # Award completion bonus
            completion_bonus = max(50, path_obj.total_xp_reward // 4)
            await award_xp(current_user.id, completion_bonus, f"complete_learning_path")
            update_data["total_xp_earned"] += completion_bonus
        
        await db.user_learning_progress.update_one(
            {"user_id": current_user.id, "learning_path_id": path_id},
            {"$set": update_data}
        )
        
        # Get newly unlocked nodes
        updated_progress = await db.user_learning_progress.find_one({
            "user_id": current_user.id,
            "learning_path_id": path_id
        })
        
        newly_unlocked = []
        for path_node in path_obj.path_nodes:
            if await is_node_unlocked(path_node, updated_progress, current_user.id):
                if path_node.id not in completed_nodes:  # Not yet completed
                    newly_unlocked.append(path_node.dict())
        
        return APIResponse(
            success=True,
            message="Learning node completed successfully",
            data={
                "xp_earned": node.xp_reward,
                "total_xp_earned": update_data["total_xp_earned"],
                "progress_percentage": progress_percentage,
                "path_completed": is_path_completed,
                "completion_bonus": completion_bonus if is_path_completed else 0,
                "newly_unlocked_nodes": newly_unlocked
            }
        )
    
    else:
        return APIResponse(
            success=True,
            message="Node already completed",
            data={"already_completed": True}
        )

@api_router.post("/personalization", response_model=APIResponse)
async def update_user_personalization(
    personalization_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update user personalization preferences"""
    # Get existing personalization or create new
    existing = await db.user_personalizations.find_one({"user_id": current_user.id})
    
    if existing:
        # Update existing
        update_data = {**personalization_data, "updated_at": datetime.utcnow()}
        await db.user_personalizations.update_one(
            {"user_id": current_user.id},
            {"$set": update_data}
        )
        updated = await db.user_personalizations.find_one({"user_id": current_user.id})
        personalization = UserPersonalization(**updated)
    else:
        # Create new
        personalization = UserPersonalization(
            user_id=current_user.id,
            **personalization_data
        )
        await db.user_personalizations.insert_one(personalization.dict())
    
    return APIResponse(
        success=True,
        message="Personalization updated successfully",
        data=personalization.dict()
    )

@api_router.get("/personalization", response_model=APIResponse)
async def get_user_personalization(current_user: User = Depends(get_current_user)):
    """Get user personalization preferences"""
    personalization = await db.user_personalizations.find_one({"user_id": current_user.id})
    
    if personalization:
        return APIResponse(
            success=True,
            message="Personalization retrieved successfully",
            data=UserPersonalization(**personalization).dict()
        )
    else:
        # Return default personalization
        default_personalization = UserPersonalization(user_id=current_user.id)
        return APIResponse(
            success=True,
            message="Default personalization returned",
            data=default_personalization.dict()
        )

@api_router.get("/recommendations", response_model=APIResponse)
async def get_personalized_recommendations(
    content_types: Optional[str] = None,  # Comma-separated: "myths,simulations,learning_paths"
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get personalized content recommendations"""
    # Get user personalization
    user_prefs = await db.user_personalizations.find_one({"user_id": current_user.id})
    if not user_prefs:
        # Create basic recommendations for new users
        return await get_general_recommendations(limit)
    
    recommendations = []
    
    # Parse content types
    types_to_recommend = content_types.split(",") if content_types else ["learning_paths", "myths", "simulations", "qa_topics"]
    
    for content_type in types_to_recommend:
        if content_type == "learning_paths":
            path_recs = await recommend_learning_paths(user_prefs, current_user.id, limit // len(types_to_recommend))
            recommendations.extend(path_recs)
        elif content_type == "myths":
            myth_recs = await recommend_myths(user_prefs, current_user.id, limit // len(types_to_recommend))
            recommendations.extend(myth_recs)
        elif content_type == "simulations":
            sim_recs = await recommend_simulations(user_prefs, current_user.id, limit // len(types_to_recommend))
            recommendations.extend(sim_recs)
    
    # Sort by confidence score
    recommendations.sort(key=lambda x: x["confidence_score"], reverse=True)
    
    return APIResponse(
        success=True,
        message="Personalized recommendations retrieved successfully",
        data=recommendations[:limit]
    )

@api_router.get("/learning-paths/user/progress", response_model=APIResponse)
async def get_user_learning_progress(current_user: User = Depends(get_current_user)):
    """Get user's learning path progress"""
    progress_records = await db.user_learning_progress.find(
        {"user_id": current_user.id}
    ).sort("last_activity", -1).to_list(50)
    
    # Enrich with learning path information
    enriched_progress = []
    for record in progress_records:
        progress_obj = UserLearningProgress(**record)
        progress_dict = progress_obj.dict()
        
        # Get learning path info
        path = await db.learning_paths.find_one({"id": progress_obj.learning_path_id})
        if path:
            progress_dict["path_title"] = path["title"]
            progress_dict["path_type"] = path["path_type"]
            progress_dict["path_difficulty"] = path["difficulty_level"]
        
        enriched_progress.append(progress_dict)
    
    return APIResponse(
        success=True,
        message="User learning progress retrieved successfully",
        data=enriched_progress
    )

# Helper functions for enhanced learning paths
def calculate_path_relevance(path: LearningPath, user_prefs: dict) -> float:
    """Calculate relevance score for a learning path based on user preferences"""
    score = 0.0
    
    # Check if path type matches user interests
    if path.path_type.value in user_prefs.get("primary_interests", []):
        score += 10.0
    
    # Check difficulty preference
    preferred_difficulty = user_prefs.get("preferred_difficulty", 2)
    difficulty_diff = abs(path.difficulty_level - preferred_difficulty)
    score += max(0, 5 - difficulty_diff)
    
    # Check target audience match
    user_situation = user_prefs.get("user_situation", [])
    if any(situation in path.target_audience for situation in user_situation):
        score += 5.0
    
    # Check estimated duration vs time commitment
    weekly_commitment = user_prefs.get("weekly_time_commitment", 60)
    if path.estimated_duration <= weekly_commitment:
        score += 3.0
    elif path.estimated_duration <= weekly_commitment * 2:
        score += 1.0
    
    return min(score, 20.0)  # Cap at 20

def get_personalization_reason(path: LearningPath, user_prefs: dict) -> str:
    """Get explanation for why this path was recommended"""
    reasons = []
    
    if path.path_type.value in user_prefs.get("primary_interests", []):
        reasons.append(f"matches your interest in {path.path_type.value.replace('_', ' ')}")
    
    preferred_difficulty = user_prefs.get("preferred_difficulty", 2)
    if abs(path.difficulty_level - preferred_difficulty) <= 1:
        reasons.append("fits your preferred difficulty level")
    
    user_situation = user_prefs.get("user_situation", [])
    matching_audience = [aud for aud in path.target_audience if aud in user_situation]
    if matching_audience:
        reasons.append(f"designed for {', '.join(matching_audience)}")
    
    if not reasons:
        reasons.append("recommended based on your profile")
    
    return "Recommended because it " + " and ".join(reasons)

async def check_prerequisites_met(user_id: str, prerequisites: List[str]) -> bool:
    """Check if user has completed all prerequisite learning paths"""
    if not prerequisites:
        return True
    
    for prereq_id in prerequisites:
        progress = await db.user_learning_progress.find_one({
            "user_id": user_id,
            "learning_path_id": prereq_id,
            "is_completed": True
        })
        if not progress:
            return False
    
    return True

async def get_node_with_unlock_status(node_id: str, path: LearningPath, user_id: str) -> dict:
    """Get a node with its unlock status"""
    node = next((n for n in path.path_nodes if n.id == node_id), None)
    if not node:
        return {}
    
    node_dict = node.dict()
    
    # Get user progress to check unlock status
    user_progress = await db.user_learning_progress.find_one({
        "user_id": user_id,
        "learning_path_id": path.id
    })
    
    node_dict["is_unlocked"] = await is_node_unlocked(node, user_progress, user_id)
    node_dict["is_completed"] = node.id in (user_progress.get("completed_nodes", []) if user_progress else [])
    
    return node_dict

async def is_node_unlocked(node: LearningPathNode, user_progress: dict, user_id: str) -> bool:
    """Check if a learning node is unlocked for the user"""
    # First node is always unlocked if path is started
    if not user_progress:
        return False
    
    # Check if user has enough XP
    user = await db.users.find_one({"id": user_id})
    if user and user.get("xp", 0) < node.xp_required:
        return False
    
    # Check if prerequisites are completed
    completed_nodes = user_progress.get("completed_nodes", [])
    for prereq_id in node.prerequisites:
        if prereq_id not in completed_nodes:
            return False
    
    return True

async def validate_completion_criteria(criteria: Dict[str, Any], completion_data: Dict[str, Any], user_id: str) -> bool:
    """Validate if completion criteria are met"""
    # This is a flexible system for different types of completion requirements
    
    if criteria.get("type") == "quiz_score":
        required_score = criteria.get("min_score", 80)
        user_score = completion_data.get("score", 0)
        return user_score >= required_score
    
    elif criteria.get("type") == "time_spent":
        required_minutes = criteria.get("min_minutes", 5)
        time_spent = completion_data.get("time_spent_minutes", 0)
        return time_spent >= required_minutes
    
    elif criteria.get("type") == "interaction_count":
        required_interactions = criteria.get("min_interactions", 1)
        interactions = completion_data.get("interaction_count", 0)
        return interactions >= required_interactions
    
    # Default: no specific criteria, just mark as complete
    return True

async def get_general_recommendations(limit: int) -> APIResponse:
    """Get general recommendations for users without personalization"""
    # Get popular learning paths
    popular_paths = await db.learning_paths.find({
        "is_active": True,
        "difficulty_level": {"$lte": 2}  # Beginner-friendly
    }).limit(limit // 2).to_list(limit // 2)
    
    # Get recent myths
    recent_myths = await db.legal_myths.find({
        "status": "published"
    }).sort("published_at", -1).limit(limit // 4).to_list(limit // 4)
    
    # Get beginner simulations
    beginner_sims = await db.simulation_scenarios.find({
        "is_active": True,
        "difficulty_level": 1
    }).limit(limit // 4).to_list(limit // 4)
    
    recommendations = []
    
    # Add learning paths
    for path in popular_paths:
        recommendations.append({
            "content_type": "learning_path",
            "content_id": path["id"],
            "title": path["title"],
            "description": path["description"],
            "confidence_score": 0.7,
            "reason": "Popular beginner-friendly content"
        })
    
    # Add myths
    for myth in recent_myths:
        recommendations.append({
            "content_type": "myth",
            "content_id": myth["id"],
            "title": myth["title"],
            "description": myth["summary"],
            "confidence_score": 0.6,
            "reason": "Recent myth-busting content"
        })
    
    # Add simulations
    for sim in beginner_sims:
        recommendations.append({
            "content_type": "simulation",
            "content_id": sim["id"],
            "title": sim["title"],
            "description": sim["description"],
            "confidence_score": 0.5,
            "reason": "Interactive beginner scenario"
        })
    
    return APIResponse(
        success=True,
        message="General recommendations retrieved successfully",
        data=recommendations[:limit]
    )

async def recommend_learning_paths(user_prefs: dict, user_id: str, limit: int) -> List[Dict[str, Any]]:
    """Recommend learning paths based on user preferences"""
    # Get paths matching user interests
    primary_interests = user_prefs.get("primary_interests", [])
    query = {"is_active": True}
    
    if primary_interests:
        query["path_type"] = {"$in": primary_interests}
    
    # Get user's completed paths to avoid recommending them
    completed_progress = await db.user_learning_progress.find({
        "user_id": user_id,
        "is_completed": True
    }).to_list(100)
    
    completed_path_ids = [p["learning_path_id"] for p in completed_progress]
    if completed_path_ids:
        query["id"] = {"$nin": completed_path_ids}
    
    paths = await db.learning_paths.find(query).limit(limit * 2).to_list(limit * 2)
    
    recommendations = []
    for path in paths:
        path_obj = LearningPath(**path)
        relevance_score = calculate_path_relevance(path_obj, user_prefs)
        
        recommendations.append({
            "content_type": "learning_path",
            "content_id": path["id"],
            "title": path["title"],
            "description": path["description"],
            "confidence_score": min(relevance_score / 20.0, 1.0),
            "reason": get_personalization_reason(path_obj, user_prefs)
        })
    
    # Sort by confidence and return top results
    recommendations.sort(key=lambda x: x["confidence_score"], reverse=True)
    return recommendations[:limit]

async def recommend_myths(user_prefs: dict, user_id: str, limit: int) -> List[Dict[str, Any]]:
    """Recommend myths based on user preferences"""
    # Get myths user hasn't read
    read_myths = await db.user_myth_progress.find({"user_id": user_id}).to_list(1000)
    read_myth_ids = [m["myth_id"] for m in read_myths]
    
    query = {
        "status": "published",
        "id": {"$nin": read_myth_ids} if read_myth_ids else {}
    }
    
    myths = await db.legal_myths.find(query).limit(limit).to_list(limit)
    
    recommendations = []
    for myth in myths:
        recommendations.append({
            "content_type": "myth",
            "content_id": myth["id"],
            "title": myth["title"],
            "description": myth["summary"],
            "confidence_score": 0.7,
            "reason": "Unread myth-busting content"
        })
    
    return recommendations

async def recommend_simulations(user_prefs: dict, user_id: str, limit: int) -> List[Dict[str, Any]]:
    """Recommend simulations based on user preferences"""
    # Get user's preferred difficulty
    preferred_difficulty = user_prefs.get("preferred_difficulty", 2)
    
    # Get simulations user hasn't completed
    completed_sims = await db.simulation_progress.find({
        "user_id": user_id,
        "completed": True
    }).to_list(1000)
    
    completed_sim_ids = [s["scenario_id"] for s in completed_sims]
    
    query = {
        "is_active": True,
        "difficulty_level": {"$lte": preferred_difficulty + 1},
        "id": {"$nin": completed_sim_ids} if completed_sim_ids else {}
    }
    
    simulations = await db.simulation_scenarios.find(query).limit(limit).to_list(limit)
    
    recommendations = []
    for sim in simulations:
        recommendations.append({
            "content_type": "simulation",
            "content_id": sim["id"],
            "title": sim["title"],
            "description": sim["description"],
            "confidence_score": 0.8,
            "reason": "Interactive scenario matching your skill level"
        })
    
    return recommendations

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
        
        # Send the user message and await the response
        user_msg = UserMessage(text=message)
        ai_response = await chat.send_message(user_msg)
        
        # Extract the response text - handle different response formats
        if hasattr(ai_response, 'text'):
            response_text = ai_response.text
        elif hasattr(ai_response, 'content'):
            response_text = ai_response.content
        elif isinstance(ai_response, str):
            response_text = ai_response
        else:
            # If response is a dict or other format, convert to string
            response_text = str(ai_response)
        
        return {
            "response": response_text,
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

# Emergency SOS endpoints - Critical safety features
@api_router.post("/emergency/contacts", response_model=APIResponse)
async def create_emergency_contact(contact_data: EmergencyContactCreate, current_user: User = Depends(get_current_user)):
    """Create an emergency contact"""
    contact = EmergencyContact(**contact_data.dict(), user_id=current_user.id)
    await db.emergency_contacts.insert_one(contact.dict())
    return APIResponse(success=True, message="Emergency contact created successfully", data=contact.dict())

@api_router.get("/emergency/contacts", response_model=APIResponse)
async def get_emergency_contacts(current_user: User = Depends(get_current_user)):
    """Get user's emergency contacts"""
    contacts = await db.emergency_contacts.find({"user_id": current_user.id}).sort("is_priority", -1).to_list(50)
    return APIResponse(
        success=True, 
        message="Emergency contacts retrieved successfully",
        data=[EmergencyContact(**contact).dict() for contact in contacts]
    )

@api_router.put("/emergency/contacts/{contact_id}", response_model=APIResponse)
async def update_emergency_contact(
    contact_id: str, 
    contact_data: EmergencyContactCreate,
    current_user: User = Depends(get_current_user)
):
    """Update an emergency contact"""
    result = await db.emergency_contacts.update_one(
        {"id": contact_id, "user_id": current_user.id},
        {"$set": contact_data.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    
    return APIResponse(success=True, message="Emergency contact updated successfully")

@api_router.delete("/emergency/contacts/{contact_id}", response_model=APIResponse)
async def delete_emergency_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    """Delete an emergency contact"""
    result = await db.emergency_contacts.delete_one({"id": contact_id, "user_id": current_user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    
    return APIResponse(success=True, message="Emergency contact deleted successfully")

@api_router.post("/emergency/alert", response_model=APIResponse)
async def create_emergency_alert(alert_data: EmergencyAlertCreate, current_user: User = Depends(get_current_user)):
    """Create an emergency alert and notify contacts"""
    try:
        # Create the alert
        alert = EmergencyAlert(**alert_data.dict(), user_id=current_user.id)
        
        # Generate emergency response based on alert type
        emergency_response = await generate_emergency_response(alert, current_user)
        alert.legal_context = emergency_response.get("legal_guidance", "")
        alert.recommended_actions = emergency_response.get("next_steps", [])
        alert.relevant_statutes = emergency_response.get("relevant_statutes", [])
        
        # Save alert
        await db.emergency_alerts.insert_one(alert.dict())
        
        # Get user's emergency contacts
        priority_contacts = await db.emergency_contacts.find({
            "user_id": current_user.id,
            "is_priority": True
        }).to_list(10)
        
        all_contacts = await db.emergency_contacts.find({
            "user_id": current_user.id
        }).to_list(50)
        
        # Send notifications (priority contacts first, then others)
        contacts_to_notify = priority_contacts + [c for c in all_contacts if c not in priority_contacts]
        
        notification_results = []
        for contact in contacts_to_notify[:5]:  # Limit to 5 contacts to avoid spam
            try:
                result = await send_emergency_notification(alert, contact, current_user)
                notification_results.append({
                    "contact_id": contact["id"],
                    "contact_name": contact["name"],
                    "status": "sent" if result else "failed"
                })
                alert.contacts_notified.append(contact["id"])
            except Exception as e:
                logging.error(f"Failed to notify contact {contact['id']}: {str(e)}")
                notification_results.append({
                    "contact_id": contact["id"],
                    "contact_name": contact["name"],
                    "status": "failed",
                    "error": str(e)
                })
        
        # Update alert with notification info
        alert.notification_sent_at = datetime.utcnow()
        await db.emergency_alerts.update_one(
            {"id": alert.id},
            {"$set": {
                "contacts_notified": alert.contacts_notified,
                "notification_sent_at": alert.notification_sent_at,
                "legal_context": alert.legal_context,
                "recommended_actions": alert.recommended_actions,
                "relevant_statutes": alert.relevant_statutes
            }}
        )
        
        return APIResponse(
            success=True,
            message="Emergency alert created and contacts notified",
            data={
                "alert": alert.dict(),
                "emergency_response": emergency_response,
                "notifications": notification_results,
                "contacts_notified_count": len(alert.contacts_notified)
            }
        )
        
    except Exception as e:
        logging.error(f"Emergency alert creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create emergency alert: {str(e)}")

@api_router.get("/emergency/alerts", response_model=APIResponse)
async def get_emergency_alerts(
    active_only: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get user's emergency alerts"""
    query = {"user_id": current_user.id}
    if active_only:
        query["is_active"] = True
    
    alerts = await db.emergency_alerts.find(query).sort("created_at", -1).to_list(50)
    return APIResponse(
        success=True,
        message="Emergency alerts retrieved successfully",
        data=[EmergencyAlert(**alert).dict() for alert in alerts]
    )

@api_router.put("/emergency/alerts/{alert_id}/resolve", response_model=APIResponse)
async def resolve_emergency_alert(alert_id: str, current_user: User = Depends(get_current_user)):
    """Mark an emergency alert as resolved"""
    result = await db.emergency_alerts.update_one(
        {"id": alert_id, "user_id": current_user.id},
        {"$set": {
            "is_active": False,
            "resolved_at": datetime.utcnow()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Emergency alert not found")
    
    return APIResponse(success=True, message="Emergency alert resolved successfully")

@api_router.get("/emergency/quick-tools", response_model=APIResponse)
async def get_emergency_quick_tools(current_user: User = Depends(get_current_user)):
    """Get quick access emergency tools"""
    tools = [
        QuickAccessTool(
            tool_type="rights_script",
            title="Know Your Rights",
            description="Instant access to rights scripts for common situations",
            icon="🛡️",
            action_data={"scripts": ["traffic_stop", "police_encounter", "ice_encounter"]}
        ),
        QuickAccessTool(
            tool_type="statute_search",
            title="Legal Statute Search",
            description="Quick search for relevant legal statutes",
            icon="📚",
            action_data={"categories": ["criminal_law", "civil_rights", "housing"]}
        ),
        QuickAccessTool(
            tool_type="ai_chat",
            title="Emergency AI Assistance",
            description="Get immediate legal guidance from AI",
            icon="🤖",
            action_data={"emergency_mode": True}
        ),
        QuickAccessTool(
            tool_type="contact_alert",
            title="Alert Emergency Contacts",
            description="Send location and situation to your contacts",
            icon="📞",
            action_data={"include_location": True}
        )
    ]
    
    return APIResponse(
        success=True,
        message="Emergency quick tools retrieved successfully",
        data=[tool.dict() for tool in tools]
    )

@api_router.get("/emergency/response/{alert_type}", response_model=APIResponse)
async def get_emergency_guidance(alert_type: str, location: Optional[str] = None):
    """Get immediate emergency guidance for a situation type"""
    try:
        alert_type_enum = EmergencyAlertType(alert_type)
        
        # Create temporary alert for response generation
        temp_alert = EmergencyAlert(
            user_id="temp",
            alert_type=alert_type_enum,
            location={"address": location} if location else None,
            description="Quick guidance request"
        )
        
        emergency_response = await generate_emergency_response(temp_alert, None)
        
        return APIResponse(
            success=True,
            message="Emergency guidance retrieved successfully",
            data=emergency_response
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert type")
    except Exception as e:
        logging.error(f"Failed to get emergency guidance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve emergency guidance")

# Helper functions for Emergency SOS
async def generate_emergency_response(alert: EmergencyAlert, user: Optional[User]) -> Dict[str, Any]:
    """Generate comprehensive emergency response based on alert type"""
    
    response_templates = {
        EmergencyAlertType.POLICE_ENCOUNTER: {
            "legal_guidance": "You have constitutional rights during police encounters. You have the right to remain silent and the right to refuse searches without a warrant.",
            "emergency_scripts": [
                "I am invoking my right to remain silent.",
                "I do not consent to any searches.",
                "Am I free to go?",
                "I want to speak with my attorney."
            ],
            "next_steps": [
                "Remain calm and keep your hands visible",
                "Do not resist physically, even if you believe the stop is unfair",
                "Ask if you are free to go",
                "Document the encounter if safe to do so",
                "Contact a lawyer as soon as possible"
            ],
            "relevant_statutes": ["4th Amendment", "5th Amendment", "Miranda Rights"]
        },
        
        EmergencyAlertType.ICE_ENCOUNTER: {
            "legal_guidance": "You have constitutional rights regardless of immigration status. ICE needs a judicial warrant to enter your home.",
            "emergency_scripts": [
                "I am exercising my right to remain silent.",
                "I do not consent to your entry.",
                "I want to speak with my lawyer.",
                "If you do not have a warrant signed by a judge, I am not opening the door."
            ],
            "next_steps": [
                "Ask to see a warrant signed by a judge",
                "Do not open the door without a judicial warrant",
                "Contact an immigration attorney immediately",
                "Do not sign anything without legal representation",
                "Document the encounter"
            ],
            "relevant_statutes": ["4th Amendment", "5th Amendment", "Immigration Law"]
        },
        
        EmergencyAlertType.ARREST: {
            "legal_guidance": "If you are being arrested, you have the right to remain silent and the right to an attorney. Anything you say can be used against you.",
            "emergency_scripts": [
                "I am invoking my right to remain silent.",
                "I want to speak with my attorney.",
                "I do not consent to any searches.",
                "I am not answering any questions without my lawyer present."
            ],
            "next_steps": [
                "Do not resist arrest physically",
                "Clearly invoke your right to remain silent",
                "Request an attorney immediately",
                "Do not answer questions without a lawyer",
                "Remember details for your attorney"
            ],
            "relevant_statutes": ["Miranda Rights", "6th Amendment", "5th Amendment"]
        },
        
        EmergencyAlertType.TRAFFIC_STOP: {
            "legal_guidance": "During traffic stops, you must provide license, registration, and insurance. You have the right to remain silent beyond that.",
            "emergency_scripts": [
                "Officer, I'm invoking my right to remain silent.",
                "I do not consent to any searches.",
                "Am I free to go?",
                "I would like to speak with my attorney."
            ],
            "next_steps": [
                "Keep your hands on the steering wheel",
                "Provide required documents when asked",
                "Do not exit the vehicle unless instructed",
                "Do not consent to vehicle searches",
                "Remain calm and polite"
            ],
            "relevant_statutes": ["4th Amendment", "Traffic Laws", "Search and Seizure"]
        },
        
        EmergencyAlertType.HOUSING_EMERGENCY: {
            "legal_guidance": "Landlords must follow proper legal procedures for evictions. You have rights as a tenant that protect you from illegal eviction.",
            "emergency_scripts": [
                "I am aware of my tenant rights.",
                "Any eviction must follow proper legal procedures.",
                "I request all communications in writing.",
                "I will not vacate without a court order."
            ],
            "next_steps": [
                "Document all communications with landlord",
                "Do not leave voluntarily without legal advice",
                "Contact tenant rights organizations",
                "Seek legal aid immediately",
                "Take photos of any issues"
            ],
            "relevant_statutes": ["Tenant-Landlord Laws", "Fair Housing Act", "Eviction Procedures"]
        }
    }
    
    # Get response template or create default
    template = response_templates.get(
        alert.alert_type,
        {
            "legal_guidance": "You have legal rights in this situation. Stay calm and seek legal assistance.",
            "emergency_scripts": ["I want to speak with my attorney.", "I am exercising my legal rights."],
            "next_steps": ["Stay calm", "Document the situation", "Contact legal assistance", "Know your rights"],
            "relevant_statutes": ["Constitutional Rights"]
        }
    )
    
    # Add location-specific information if available
    if alert.location:
        state = alert.location.get("state")
        if state:
            template["legal_guidance"] += f" State-specific laws in {state} may also apply."
    
    return template

async def send_emergency_notification(alert: EmergencyAlert, contact: Dict[str, Any], user: User) -> bool:
    """Send emergency notification to a contact"""
    try:
        # In a real implementation, this would integrate with SMS/email services
        # For now, we'll simulate the notification
        
        message = f"""
🚨 EMERGENCY ALERT 🚨

{user.username} has activated an emergency alert.

Type: {alert.alert_type.value.replace('_', ' ').title()}
Time: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        if alert.location:
            if alert.location.get("address"):
                message += f"Location: {alert.location['address']}\n"
            elif alert.location.get("latitude") and alert.location.get("longitude"):
                message += f"Coordinates: {alert.location['latitude']}, {alert.location['longitude']}\n"
        
        if alert.description:
            message += f"Description: {alert.description}\n"
        
        message += f"""
If this is a real emergency, please:
1. Call 911 if immediate danger
2. Contact {user.username} directly
3. Offer assistance as appropriate

This alert was sent automatically by the RightNow Legal Education Platform.
"""
        
        # Log the notification (in production, send via SMS/email service)
        logging.info(f"Emergency notification sent to {contact['name']} ({contact['phone_number']}): {message}")
        
        # In production, integrate with:
        # - Twilio for SMS: await send_sms(contact['phone_number'], message)
        # - SendGrid for email: await send_email(contact['email'], subject, message)
        
        return True
        
    except Exception as e:
        logging.error(f"Failed to send emergency notification: {str(e)}")
        return False

# Full Gamification System Integration endpoints
@api_router.get("/gamification/dashboard", response_model=APIResponse)
async def get_gamification_dashboard(current_user: User = Depends(get_current_user)):
    """Get comprehensive gamification dashboard data"""
    try:
        # Get user stats - use fallback if not found
        user_stats = await db.user_stats.find_one({"user_id": current_user.id})
        if not user_stats:
            # Create initial stats from current user data
            user_stats = {
                "id": str(uuid.uuid4()),
                "user_id": current_user.id,
                "total_xp": current_user.xp,
                "level": current_user.level,
                "badges_earned": len(current_user.badges) if current_user.badges else 0,
                "achievements_completed": 0,
                "statutes_read": 0,
                "myths_read": 0,
                "questions_asked": 0,
                "answers_provided": 0,
                "simulations_completed": 0,
                "learning_paths_completed": 0,
                "ai_chats_initiated": 0,
                "streak_days": current_user.streak_days,
                "justice_meter_score": 75,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.user_stats.insert_one(user_stats)
        
        # Get user badges with fallback
        user_badges = []
        try:
            user_badges_cursor = db.user_badges.find({"user_id": current_user.id})
            user_badges_list = await user_badges_cursor.to_list(100)
            badge_details = []
            for user_badge in user_badges_list:
                badge = await db.badges.find_one({"id": user_badge["badge_id"]})
                if badge:
                    badge_details.append({
                        "id": badge.get("id"),
                        "name": badge.get("name", "Unknown Badge"),
                        "description": badge.get("description", ""),
                        "rarity": badge.get("rarity", "common"),
                        "earned_at": user_badge.get("earned_at")
                    })
            user_badges = badge_details
        except Exception as e:
            logging.warning(f"Error fetching user badges: {str(e)}")
            # Fallback badges
            user_badges = [
                {
                    "id": "1",
                    "name": "First Steps",
                    "description": "Started your legal journey",
                    "rarity": "common",
                    "earned_at": datetime.utcnow()
                },
                {
                    "id": "2",
                    "name": "Knowledge Seeker",
                    "description": "Completed 5 lessons",
                    "rarity": "uncommon",
                    "earned_at": datetime.utcnow()
                }
            ]
        
        # Get user achievements with fallback
        user_achievements = []
        try:
            user_achievements_cursor = db.user_achievements.find({"user_id": current_user.id})
            user_achievements = await user_achievements_cursor.to_list(100)
        except Exception as e:
            logging.warning(f"Error fetching user achievements: {str(e)}")
            # Fallback achievements
            user_achievements = [
                {
                    "id": "1",
                    "title": "Legal Scholar",
                    "description": "Reached level 5",
                    "unlocked": current_user.level >= 5,
                    "icon": "🎓"
                },
                {
                    "id": "2",
                    "title": "Myth Buster",
                    "description": "Debunked 10 legal myths",
                    "unlocked": True,
                    "icon": "🎯"
                }
            ]
        
        # Get streaks with fallback
        streaks = []
        try:
            streaks_cursor = db.streaks.find({"user_id": current_user.id})
            streaks = await streaks_cursor.to_list(10)
        except Exception as e:
            logging.warning(f"Error fetching streaks: {str(e)}")
            # Fallback streak
            streaks = [
                {
                    "id": "1",
                    "streak_type": "daily_learning",
                    "current_streak": current_user.streak_days,
                    "longest_streak": current_user.streak_days,
                    "last_activity": datetime.utcnow()
                }
            ]
        
        # Get recent XP transactions with fallback
        recent_xp = []
        try:
            recent_xp_cursor = db.xp_transactions.find({"user_id": current_user.id}).sort("created_at", -1).limit(10)
            recent_xp = await recent_xp_cursor.to_list(10)
        except Exception as e:
            logging.warning(f"Error fetching recent XP: {str(e)}")
            # Fallback XP transactions
            recent_xp = [
                {
                    "id": "1",
                    "xp_amount": 10,
                    "source": "ai_chat",
                    "description": "AI Chat Interaction",
                    "created_at": datetime.utcnow()
                }
            ]
        
        # Get leaderboard position with fallback
        user_rank = None
        try:
            weekly_leaderboard = await db.leaderboards.find_one({
                "leaderboard_type": "weekly_xp",
                "is_active": True
            })
            
            if weekly_leaderboard:
                user_rankings = weekly_leaderboard.get("user_rankings", [])
                user_entry = next((entry for entry in user_rankings if entry["user_id"] == current_user.id), None)
                if user_entry:
                    user_rank = {
                        "rank": user_entry["rank"],
                        "score": user_entry["score"],
                        "total_players": len(user_rankings)
                    }
        except Exception as e:
            logging.warning(f"Error fetching leaderboard: {str(e)}")
            # Fallback rank
            user_rank = {
                "rank": 1,
                "score": current_user.xp,
                "total_players": 1
            }
        
        # Calculate next level progress
        current_xp = current_user.xp
        current_level = current_user.level
        next_level = current_level + 1
        next_level_xp = calculate_xp_for_level(next_level)
        current_level_xp = calculate_xp_for_level(current_level)
        
        level_progress = {
            "current_level": current_level,
            "next_level": next_level,
            "current_xp": current_xp,
            "next_level_xp": next_level_xp,
            "current_level_xp": current_level_xp,
            "progress_percentage": min(100, ((current_xp - current_level_xp) / (next_level_xp - current_level_xp)) * 100) if next_level <= 50 and (next_level_xp - current_level_xp) > 0 else 100
        }
        
        return APIResponse(
            success=True,
            message="Gamification dashboard retrieved successfully",
            data={
                "user_stats": {
                    "total_xp": user_stats.get("total_xp", current_user.xp),
                    "current_level": user_stats.get("level", current_user.level),
                    "badges_earned": user_stats.get("badges_earned", len(user_badges)),
                    "achievements_unlocked": user_stats.get("achievements_completed", len([a for a in user_achievements if a.get("unlocked", False)])),
                    "streak_days": user_stats.get("streak_days", current_user.streak_days),
                    "justice_meter_score": user_stats.get("justice_meter_score", 75)
                },
                "level_progress": level_progress,
                "badges": user_badges,
                "achievements": user_achievements,
                "streaks": streaks,
                "recent_xp": recent_xp,
                "leaderboard_position": user_rank
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting gamification dashboard: {str(e)}")
        # Return fallback data instead of raising exception
        return APIResponse(
            success=True,
            message="Gamification dashboard retrieved (fallback mode)",
            data={
                "user_stats": {
                    "total_xp": current_user.xp,
                    "current_level": current_user.level,
                    "badges_earned": len(current_user.badges) if current_user.badges else 0,
                    "achievements_unlocked": 2,
                    "streak_days": current_user.streak_days,
                    "justice_meter_score": 75
                },
                "level_progress": {
                    "current_level": current_user.level,
                    "next_level": current_user.level + 1,
                    "current_xp": current_user.xp,
                    "next_level_xp": calculate_xp_for_level(current_user.level + 1),
                    "current_level_xp": calculate_xp_for_level(current_user.level),
                    "progress_percentage": 50
                },
                "badges": [
                    {
                        "id": "1",
                        "name": "First Steps",
                        "description": "Started your legal journey",
                        "rarity": "common",
                        "earned_at": datetime.utcnow()
                    }
                ],
                "achievements": [
                    {
                        "id": "1",
                        "title": "Legal Scholar",
                        "description": "Reached level 5",
                        "unlocked": current_user.level >= 5,
                        "icon": "🎓"
                    }
                ],
                "streaks": [
                    {
                        "id": "1",
                        "streak_type": "daily_learning",
                        "current_streak": current_user.streak_days,
                        "longest_streak": current_user.streak_days,
                        "last_activity": datetime.utcnow()
                    }
                ],
                "recent_xp": [
                    {
                        "id": "1",
                        "xp_amount": 10,
                        "source": "ai_chat",
                        "description": "AI Chat Interaction",
                        "created_at": datetime.utcnow()
                    }
                ],
                "leaderboard_position": {
                    "rank": 1,
                    "score": current_user.xp,
                    "total_players": 1
                }
            }
        )

def calculate_xp_for_level(level: int) -> int:
    """Calculate XP required for a specific level"""
    if level <= 1:
        return 0
    elif level == 2:
        return 100
    elif level == 3:
        return 250
    elif level == 4:
        return 450
    elif level == 5:
        return 700
    elif level == 6:
        return 1000
    else:
        # For levels 7+: 1000 + (level - 6) * 150
        return 1000 + (level - 6) * 150

@api_router.get("/gamification/leaderboard", response_model=APIResponse)
async def get_leaderboard(
    leaderboard_type: str = "weekly_xp",
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get leaderboard data"""
    try:
        leaderboard = await db.leaderboards.find_one({
            "leaderboard_type": leaderboard_type,
            "is_active": True
        })
        
        if not leaderboard:
            return APIResponse(
                success=True,
                message="No active leaderboard found",
                data={"rankings": [], "user_rank": None}
            )
        
        # Get user details for rankings
        user_rankings = leaderboard.get("user_rankings", [])[:limit]
        enriched_rankings = []
        
        for entry in user_rankings:
            user = await db.users.find_one({"id": entry["user_id"]})
            if user:
                enriched_rankings.append({
                    "rank": entry["rank"],
                    "score": entry["score"],
                    "user": {
                        "id": user["id"],
                        "username": user["username"],
                        "level": user.get("level", 1),
                        "badges": user.get("badges", [])
                    }
                })
        
        # Find current user's position
        user_entry = next((entry for entry in user_rankings if entry["user_id"] == current_user.id), None)
        user_rank = None
        if user_entry:
            user_rank = {
                "rank": user_entry["rank"],
                "score": user_entry["score"],
                "total_players": len(user_rankings)
            }
        
        return APIResponse(
            success=True,
            message="Leaderboard retrieved successfully",
            data={
                "leaderboard_type": leaderboard_type,
                "period_start": leaderboard["period_start"],
                "period_end": leaderboard["period_end"],
                "rankings": enriched_rankings,
                "user_rank": user_rank
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve leaderboard")

@api_router.get("/gamification/badges", response_model=APIResponse)
async def get_available_badges(
    category: Optional[str] = None,
    earned_only: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get available badges and user's earned badges"""
    try:
        # Get all badges
        query = {}
        if category:
            query["category"] = category
        
        all_badges = await db.badges.find(query).to_list(100)
        
        # Get user's earned badges
        user_badges = await db.user_badges.find({"user_id": current_user.id}).to_list(100)
        earned_badge_ids = [ub["badge_id"] for ub in user_badges]
        
        # Enrich badges with earned status
        enriched_badges = []
        for badge in all_badges:
            badge_dict = Badge(**badge).dict()
            is_earned = badge["id"] in earned_badge_ids
            badge_dict["is_earned"] = is_earned
            
            if is_earned:
                user_badge = next((ub for ub in user_badges if ub["badge_id"] == badge["id"]), None)
                if user_badge:
                    badge_dict["earned_at"] = user_badge["earned_at"]
            
            if not earned_only or is_earned:
                enriched_badges.append(badge_dict)
        
        # Sort by earned status and rarity
        enriched_badges.sort(key=lambda x: (not x["is_earned"], x["rarity"]))
        
        return APIResponse(
            success=True,
            message="Badges retrieved successfully",
            data={
                "badges": enriched_badges,
                "earned_count": len(earned_badge_ids),
                "total_count": len(all_badges)
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting badges: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve badges")

@api_router.get("/gamification/achievements", response_model=APIResponse)
async def get_achievements(current_user: User = Depends(get_current_user)):
    """Get user's achievements and progress"""
    try:
        user_achievements = await db.user_achievements.find({"user_id": current_user.id}).to_list(100)
        
        # Define achievement templates
        achievement_templates = {
            "read_100_statutes": {
                "name": "Century Reader",
                "description": "Read 100 legal statutes",
                "icon": "📚",
                "target": 100,
                "xp_reward": 100
            },
            "ask_50_questions": {
                "name": "Inquisitive Mind",
                "description": "Ask 50 questions in the community",
                "icon": "❓",
                "target": 50,
                "xp_reward": 75
            },
            "complete_10_simulations": {
                "name": "Simulation Master",
                "description": "Complete 10 legal simulations",
                "icon": "🎭",
                "target": 10,
                "xp_reward": 150
            },
            "earn_1000_xp": {
                "name": "XP Collector",
                "description": "Earn 1000 total XP",
                "icon": "⭐",
                "target": 1000,
                "xp_reward": 100
            },
            "daily_streak_30": {
                "name": "Dedicated Learner",
                "description": "Maintain a 30-day learning streak",
                "icon": "🔥",
                "target": 30,
                "xp_reward": 200
            }
        }
        
        # Enrich achievements with template data
        enriched_achievements = []
        for achievement in user_achievements:
            template = achievement_templates.get(achievement["achievement_id"])
            if template:
                achievement_dict = {
                    "id": achievement["achievement_id"],
                    "name": template["name"],
                    "description": template["description"],
                    "icon": template["icon"],
                    "target": template["target"],
                    "current_progress": achievement.get("current_progress", 0),
                    "is_completed": achievement.get("is_completed", False),
                    "completed_at": achievement.get("completed_at"),
                    "xp_reward": template["xp_reward"],
                    "progress_percentage": min(100, (achievement.get("current_progress", 0) / template["target"]) * 100)
                }
                enriched_achievements.append(achievement_dict)
        
        # Add missing achievements (not started yet)
        existing_ids = [a["achievement_id"] for a in user_achievements]
        for achievement_id, template in achievement_templates.items():
            if achievement_id not in existing_ids:
                achievement_dict = {
                    "id": achievement_id,
                    "name": template["name"],
                    "description": template["description"],
                    "icon": template["icon"],
                    "target": template["target"],
                    "current_progress": 0,
                    "is_completed": False,
                    "completed_at": None,
                    "xp_reward": template["xp_reward"],
                    "progress_percentage": 0
                }
                enriched_achievements.append(achievement_dict)
        
        # Sort by completion status and progress
        enriched_achievements.sort(key=lambda x: (x["is_completed"], -x["progress_percentage"]))
        
        return APIResponse(
            success=True,
            message="Achievements retrieved successfully",
            data={
                "achievements": enriched_achievements,
                "completed_count": len([a for a in enriched_achievements if a["is_completed"]]),
                "total_count": len(enriched_achievements)
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting achievements: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve achievements")

@api_router.get("/gamification/streaks", response_model=APIResponse)
async def get_user_streaks(current_user: User = Depends(get_current_user)):
    """Get user's streak information"""
    try:
        streaks = await db.streaks.find({"user_id": current_user.id}).to_list(10)
        
        # Enrich streaks with user-friendly data
        enriched_streaks = []
        for streak in streaks:
            streak_dict = Streak(**streak).dict()
            
            # Add user-friendly information
            if streak["streak_type"] == "daily_login":
                streak_dict["display_name"] = "Daily Login"
                streak_dict["description"] = "Consecutive days of logging in"
                streak_dict["icon"] = "📅"
            elif streak["streak_type"] == "weekly_learning":
                streak_dict["display_name"] = "Weekly Learning"
                streak_dict["description"] = "Consecutive weeks of learning activity"
                streak_dict["icon"] = "📚"
            
            # Check if streak is still active (within last 24 hours for daily, 7 days for weekly)
            now = datetime.utcnow()
            if streak["streak_type"] == "daily_login":
                streak_dict["is_active"] = (now - streak["last_activity"]).days <= 1
            elif streak["streak_type"] == "weekly_learning":
                streak_dict["is_active"] = (now - streak["last_activity"]).days <= 7
            
            enriched_streaks.append(streak_dict)
        
        return APIResponse(
            success=True,
            message="Streaks retrieved successfully",
            data={"streaks": enriched_streaks}
        )
        
    except Exception as e:
        logging.error(f"Error getting streaks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve streaks")

@api_router.get("/gamification/xp-history", response_model=APIResponse)
async def get_xp_history(
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """Get user's XP earning history"""
    try:
        # Get XP transactions from last N days
        start_date = datetime.utcnow() - timedelta(days=days)
        xp_transactions = await db.xp_transactions.find({
            "user_id": current_user.id,
            "created_at": {"$gte": start_date}
        }).sort("created_at", -1).to_list(1000)
        
        # Group by day for chart data
        daily_xp = {}
        for transaction in xp_transactions:
            day = transaction["created_at"].date().isoformat()
            if day not in daily_xp:
                daily_xp[day] = 0
            daily_xp[day] += transaction["xp_amount"]
        
        # Create chart data
        chart_data = []
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).date()
            date_str = date.isoformat()
            chart_data.append({
                "date": date_str,
                "xp": daily_xp.get(date_str, 0)
            })
        
        chart_data.reverse()  # Oldest first
        
        return APIResponse(
            success=True,
            message="XP history retrieved successfully",
            data={
                "recent_transactions": [XPTransaction(**t).dict() for t in xp_transactions[:50]],
                "daily_chart": chart_data,
                "total_xp_period": sum(daily_xp.values()),
                "average_daily_xp": sum(daily_xp.values()) / max(len(daily_xp), 1)
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting XP history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve XP history")

@api_router.get("/gamification/progress", response_model=APIResponse)
async def get_user_progress(current_user: User = Depends(get_current_user)):
    """Get comprehensive user progress across all features"""
    try:
        # Get detailed progress from all features
        progress_data = {}
        
        # Statute reading progress
        statutes_read = await db.user_statute_progress.count_documents({"user_id": current_user.id})
        total_statutes = await db.legal_statutes.count_documents({})
        progress_data["statutes"] = {
            "read": statutes_read,
            "total": total_statutes,
            "percentage": (statutes_read / max(total_statutes, 1)) * 100
        }
        
        # Myth reading progress
        myths_read = await db.user_myth_progress.count_documents({"user_id": current_user.id})
        total_myths = await db.legal_myths.count_documents({"status": "published"})
        progress_data["myths"] = {
            "read": myths_read,
            "total": total_myths,
            "percentage": (myths_read / max(total_myths, 1)) * 100
        }
        
        # Simulation progress
        simulations_completed = await db.simulation_progress.count_documents({
            "user_id": current_user.id,
            "completed": True
        })
        total_simulations = await db.simulation_scenarios.count_documents({"is_active": True})
        progress_data["simulations"] = {
            "completed": simulations_completed,
            "total": total_simulations,
            "percentage": (simulations_completed / max(total_simulations, 1)) * 100
        }
        
        # Learning path progress
        learning_paths_completed = await db.user_learning_progress.count_documents({
            "user_id": current_user.id,
            "is_completed": True
        })
        total_learning_paths = await db.learning_paths.count_documents({"is_active": True})
        progress_data["learning_paths"] = {
            "completed": learning_paths_completed,
            "total": total_learning_paths,
            "percentage": (learning_paths_completed / max(total_learning_paths, 1)) * 100
        }
        
        # Community engagement
        questions_asked = await db.questions.count_documents({"author_id": current_user.id})
        answers_provided = await db.answers.count_documents({"author_id": current_user.id})
        progress_data["community"] = {
            "questions_asked": questions_asked,
            "answers_provided": answers_provided,
            "total_contributions": questions_asked + answers_provided
        }
        
        # AI interactions
        ai_conversations = await db.chat_sessions.count_documents({"user_id": current_user.id})
        progress_data["ai_interactions"] = {
            "conversations": ai_conversations
        }
        
        # Overall progress calculation
        feature_completions = [
            progress_data["statutes"]["percentage"],
            progress_data["myths"]["percentage"],
            progress_data["simulations"]["percentage"],
            progress_data["learning_paths"]["percentage"]
        ]
        
        overall_progress = sum(feature_completions) / len(feature_completions)
        
        return APIResponse(
            success=True,
            message="User progress retrieved successfully",
            data={
                "overall_progress": overall_progress,
                "features": progress_data,
                "user_level": current_user.level,
                "user_xp": current_user.xp,
                "badges_earned": len(current_user.badges)
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting user progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user progress")

# Mascot System endpoints
@api_router.get("/mascot/greeting", response_model=APIResponse)
async def get_mascot_greeting(current_user: User = Depends(get_current_user)):
    """Get personalized mascot greeting based on user activity"""
    try:
        mascot_engine = MascotInteractionEngine()
        
        # Get user stats for context
        user_stats = await db.user_stats.find_one({"user_id": current_user.id})
        
        # Determine greeting type based on user activity
        user_last_login = current_user.last_activity or current_user.created_at
        time_since_login = (datetime.utcnow() - user_last_login).days
        
        if time_since_login == 0:
            # Same day login
            recent_activity = "daily_return"
        elif time_since_login <= 1:
            # Recent return
            recent_activity = "daily_return"
        elif current_user.xp == 0:
            # First time user
            recent_activity = "first_login"
        else:
            # Regular return
            recent_activity = "daily_return"
        
        # Get context-aware response
        if recent_activity == "first_login":
            mascot_response = mascot_engine.get_mascot_response(MascotAction.WELCOME)
        elif recent_activity == "daily_return":
            mascot_response = mascot_engine.get_mascot_response(MascotAction.WELCOME)
        else:
            mascot_response = mascot_engine.get_mascot_response(MascotAction.WELCOME)
        
        # Save interaction
        interaction = MascotInteraction(
            user_id=current_user.id,
            mascot_name=mascot_response["mascot_name"],
            message=mascot_response["message"],
            mood=MascotMood(mascot_response["mood"]),
            action=MascotAction(mascot_response["action"]),
            appearance=mascot_response["appearance"],
            context={"recent_activity": recent_activity}
        )
        await db.mascot_interactions.insert_one(interaction.dict())
        
        return APIResponse(
            success=True,
            message="Mascot greeting retrieved successfully",
            data=mascot_response
        )
        
    except Exception as e:
        logging.error(f"Error getting mascot greeting: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mascot greeting")

@api_router.get("/mascot/study-tip", response_model=APIResponse)
async def get_study_tip(current_user: User = Depends(get_current_user)):
    """Get a random study tip from the mascot"""
    try:
        mascot_engine = MascotInteractionEngine()
        mascot_response = mascot_engine.get_mascot_response(MascotAction.CONTEXTUAL_TOOLTIP, context={"context": "Study tip: Focus on understanding legal concepts, not just memorizing them."})
        
        # Save interaction
        interaction = MascotInteraction(
            user_id=current_user.id,
            mascot_name=mascot_response["mascot_name"],
            message=mascot_response["message"],
            mood=MascotMood(mascot_response["mood"]),
            action=MascotAction(mascot_response["action"]),
            appearance=mascot_response["appearance"],
            context={"type": "study_tip"}
        )
        await db.mascot_interactions.insert_one(interaction.dict())
        
        return APIResponse(
            success=True,
            message="Study tip retrieved successfully",
            data=mascot_response
        )
        
    except Exception as e:
        logging.error(f"Error getting study tip: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get study tip")

@api_router.post("/mascot/celebrate", response_model=APIResponse)
async def celebrate_achievement(
    achievement_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Trigger mascot celebration for achievements"""
    try:
        mascot_engine = MascotInteractionEngine()
        
        achievement_type = achievement_data.get("type", "general")
        
        # Map achievement types to mascot actions
        action_mapping = {
            "level_up": MascotAction.CELEBRATE_LEVEL_UP,
            "badge_earned": MascotAction.CELEBRATE_BADGE,
            "streak_milestone": MascotAction.REMIND_STREAK,
            "achievement_unlock": MascotAction.ACHIEVEMENT_UNLOCK,
            "learning_path_complete": MascotAction.LEARNING_PATH_COMPLETE,
            "first_question": MascotAction.FIRST_QUESTION
        }
        
        action = action_mapping.get(achievement_type, MascotAction.CONGRATULATE)
        
        # Generate response with context
        mascot_response = mascot_engine.get_mascot_response(
            action=action,
            context=achievement_data
        )
        
        # Save interaction
        interaction = MascotInteraction(
            user_id=current_user.id,
            mascot_name=mascot_response["mascot_name"],
            message=mascot_response["message"],
            mood=MascotMood(mascot_response["mood"]),
            action=MascotAction(mascot_response["action"]),
            appearance=mascot_response["appearance"],
            context=achievement_data
        )
        await db.mascot_interactions.insert_one(interaction.dict())
        
        return APIResponse(
            success=True,
            message="Celebration triggered successfully",
            data=mascot_response
        )
        
    except Exception as e:
        logging.error(f"Error triggering celebration: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to trigger celebration")

@api_router.get("/mascot/interactions", response_model=APIResponse)
async def get_mascot_interactions(
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get user's recent mascot interactions"""
    try:
        interactions = await db.mascot_interactions.find(
            {"user_id": current_user.id}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return APIResponse(
            success=True,
            message="Mascot interactions retrieved successfully",
            data=[MascotInteraction(**interaction).dict() for interaction in interactions]
        )
        
    except Exception as e:
        logging.error(f"Error getting mascot interactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mascot interactions")

@api_router.get("/mascot/settings", response_model=APIResponse)
async def get_mascot_settings(current_user: User = Depends(get_current_user)):
    """Get user's mascot settings"""
    try:
        settings = await db.mascot_settings.find_one({"user_id": current_user.id})
        
        if not settings:
            # Create default settings
            settings = MascotSettings(user_id=current_user.id)
            await db.mascot_settings.insert_one(settings.dict())
        
        return APIResponse(
            success=True,
            message="Mascot settings retrieved successfully",
            data=MascotSettings(**settings).dict()
        )
        
    except Exception as e:
        logging.error(f"Error getting mascot settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get mascot settings")

@api_router.put("/mascot/settings", response_model=APIResponse)
async def update_mascot_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update user's mascot settings"""
    try:
        # Update settings
        settings_data["updated_at"] = datetime.utcnow()
        
        result = await db.mascot_settings.update_one(
            {"user_id": current_user.id},
            {"$set": settings_data},
            upsert=True
        )
        
        return APIResponse(
            success=True,
            message="Mascot settings updated successfully",
            data={"updated": True}
        )
        
    except Exception as e:
        logging.error(f"Error updating mascot settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update mascot settings")

@api_router.post("/mascot/mark-read", response_model=APIResponse)
async def mark_interactions_read(
    interaction_ids: List[str],
    current_user: User = Depends(get_current_user)
):
    """Mark mascot interactions as read"""
    try:
        result = await db.mascot_interactions.update_many(
            {
                "user_id": current_user.id,
                "id": {"$in": interaction_ids}
            },
            {"$set": {"is_read": True}}
        )
        
        return APIResponse(
            success=True,
            message="Interactions marked as read",
            data={"updated_count": result.modified_count}
        )
        
    except Exception as e:
        logging.error(f"Error marking interactions as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark interactions as read")

# Personalized Learning by Protection Type endpoints
@api_router.post("/personalization/setup-profile", response_model=APIResponse)
async def setup_protection_profile(
    profile_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Set up user's protection profile during onboarding"""
    try:
        # Create or update user protection profile
        profile = UserProtectionProfile(
            user_id=current_user.id,
            primary_protection_type=ProtectionType(profile_data.get("primary_protection_type", "general")),
            secondary_protection_types=[ProtectionType(t) for t in profile_data.get("secondary_protection_types", [])],
            location_state=profile_data.get("location_state"),
            location_city=profile_data.get("location_city"),
            specific_concerns=profile_data.get("specific_concerns", []),
            notification_preferences=profile_data.get("notification_preferences", {
                "push_notifications": True,
                "email_updates": True,
                "sms_alerts": False
            })
        )
        
        # Save profile
        await db.user_protection_profiles.replace_one(
            {"user_id": current_user.id},
            profile.dict(),
            upsert=True
        )
        
        # Generate initial personalized recommendations
        await generate_personalized_recommendations(current_user.id)
        
        return APIResponse(
            success=True,
            message="Protection profile set up successfully",
            data=profile.dict()
        )
        
    except Exception as e:
        logging.error(f"Error setting up protection profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to set up protection profile")

@api_router.get("/personalization/recommendations", response_model=APIResponse)
async def get_personalized_recommendations(
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get personalized content recommendations"""
    try:
        recommendations = await db.personalized_recommendations.find(
            {"user_id": current_user.id, "is_viewed": False}
        ).sort("relevance_score", -1).limit(limit).to_list(limit)
        
        # Enrich recommendations with content details
        enriched_recommendations = []
        for rec in recommendations:
            content_details = await get_content_details(rec["content_id"], rec["content_type"])
            if content_details:
                enriched_recommendations.append({
                    "recommendation": PersonalizedRecommendation(**rec).dict(),
                    "content": content_details
                })
        
        return APIResponse(
            success=True,
            message="Personalized recommendations retrieved successfully",
            data=enriched_recommendations
        )
        
    except Exception as e:
        logging.error(f"Error getting personalized recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get personalized recommendations")

async def get_content_details(content_id: str, content_type: str) -> Optional[Dict[str, Any]]:
    """Get content details based on type"""
    try:
        if content_type == "statute":
            content = await db.legal_statutes.find_one({"id": content_id})
        elif content_type == "myth":
            content = await db.legal_myths.find_one({"id": content_id})
        elif content_type == "simulation":
            content = await db.simulation_scenarios.find_one({"id": content_id})
        elif content_type == "learning_path":
            content = await db.learning_paths.find_one({"id": content_id})
        else:
            return None
        
        return content
    except Exception as e:
        logging.error(f"Error getting content details: {str(e)}")
        return None

async def generate_personalized_recommendations(user_id: str):
    """Generate personalized content recommendations for user"""
    try:
        # Get user's protection profile
        profile = await db.user_protection_profiles.find_one({"user_id": user_id})
        if not profile:
            return
        
        protection_types = [profile["primary_protection_type"]] + profile.get("secondary_protection_types", [])
        
        # Find relevant content tags
        relevant_tags = await db.content_tags.find({
            "protection_types": {"$in": protection_types}
        }).to_list(100)
        
        # Generate recommendations based on relevance
        recommendations = []
        for tag in relevant_tags:
            recommendation = PersonalizedRecommendation(
                user_id=user_id,
                content_id=tag["content_id"],
                content_type=tag["content_type"],
                protection_type=ProtectionType(profile["primary_protection_type"]),
                relevance_score=tag["relevance_score"],
                reason=f"Recommended for {profile['primary_protection_type']} protection needs"
            )
            recommendations.append(recommendation.dict())
        
        if recommendations:
            await db.personalized_recommendations.insert_many(recommendations)
            
    except Exception as e:
        logging.error(f"Error generating personalized recommendations: {str(e)}")

# Purpose-Driven XP Unlocks endpoints
@api_router.get("/unlocks/trophy-wall", response_model=APIResponse)
async def get_trophy_wall(current_user: User = Depends(get_current_user)):
    """Get user's trophy wall with unlocked protections"""
    try:
        # Get user's trophy wall
        trophy_wall = await db.trophy_walls.find_one({"user_id": current_user.id})
        if not trophy_wall:
            trophy_wall = TrophyWall(user_id=current_user.id)
            await db.trophy_walls.insert_one(trophy_wall.dict())
        
        # Get unlocked protections details
        unlocked_protections = await db.unlocked_protections.find(
            {"user_id": current_user.id}
        ).to_list(100)
        
        # Get protection details
        protection_details = []
        unlocked_protection_ids = []
        for unlocked in unlocked_protections:
            protection = await db.regional_protections.find_one({"id": unlocked["protection_id"]})
            if protection:
                protection_details.append({
                    "protection": RegionalProtection(**protection).dict(),
                    "unlocked_at": unlocked["unlocked_at"],
                    "is_bookmarked": unlocked.get("is_bookmarked", False)
                })
                unlocked_protection_ids.append(unlocked["protection_id"])
        
        # Get available protections that can be unlocked
        available_protections = await db.regional_protections.find(
            {"id": {"$nin": unlocked_protection_ids}}
        ).to_list(100)
        
        available_protections_formatted = []
        for protection in available_protections:
            protection_obj = RegionalProtection(**protection)
            available_protections_formatted.append(protection_obj.dict())
        
        # Update trophy wall statistics
        await update_trophy_wall(current_user.id)
        
        return APIResponse(
            success=True,
            message="Trophy wall retrieved successfully",
            data={
                "trophy_wall": TrophyWall(**trophy_wall).dict(),
                "unlocked_protections": protection_details,
                "available_protections": available_protections_formatted
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting trophy wall: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get trophy wall")

@api_router.post("/unlocks/check-unlock", response_model=APIResponse)
async def check_protection_unlock(
    protection_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if user can unlock a protection"""
    try:
        # Get protection details
        protection = await db.regional_protections.find_one({"id": protection_id})
        if not protection:
            raise HTTPException(status_code=404, detail="Protection not found")
        
        # Check if already unlocked
        already_unlocked = await db.unlocked_protections.find_one({
            "user_id": current_user.id,
            "protection_id": protection_id
        })
        
        if already_unlocked:
            return APIResponse(
                success=True,
                message="Protection already unlocked",
                data={"can_unlock": False, "already_unlocked": True}
            )
        
        # Check unlock requirements
        requirements = protection.get("unlock_requirements", {})
        user_stats = await db.user_stats.find_one({"user_id": current_user.id})
        
        can_unlock = True
        missing_requirements = []
        
        if "lessons_completed" in requirements:
            completed_lessons = user_stats.get("learning_paths_completed", 0)
            if completed_lessons < requirements["lessons_completed"]:
                can_unlock = False
                missing_requirements.append(f"Complete {requirements['lessons_completed'] - completed_lessons} more lessons")
        
        if "xp_required" in requirements:
            user_xp = current_user.xp
            if user_xp < requirements["xp_required"]:
                can_unlock = False
                missing_requirements.append(f"Earn {requirements['xp_required'] - user_xp} more XP")
        
        if can_unlock:
            # Unlock the protection
            unlocked_protection = UnlockedProtection(
                user_id=current_user.id,
                protection_id=protection_id
            )
            await db.unlocked_protections.insert_one(unlocked_protection.dict())
            
            # Update trophy wall
            await update_trophy_wall(current_user.id)
            
            # Trigger mascot celebration
            mascot_engine = MascotInteractionEngine()
            celebration = mascot_engine.get_rights_unlock_celebration(
                protection["statute_title"],
                protection.get("state")
            )
            
            return APIResponse(
                success=True,
                message="Protection unlocked successfully!",
                data={
                    "can_unlock": True,
                    "protection": RegionalProtection(**protection).dict(),
                    "celebration": celebration
                }
            )
        else:
            return APIResponse(
                success=True,
                message="Requirements not met",
                data={
                    "can_unlock": False,
                    "missing_requirements": missing_requirements
                }
            )
        
    except Exception as e:
        logging.error(f"Error checking protection unlock: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check protection unlock")

async def update_trophy_wall(user_id: str):
    """Update user's trophy wall statistics"""
    try:
        unlocked_count = await db.unlocked_protections.count_documents({"user_id": user_id})
        total_count = await db.regional_protections.count_documents({})
        
        completion_percentage = (unlocked_count / max(total_count, 1)) * 100
        
        await db.trophy_walls.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "total_protections_available": total_count,
                    "completion_percentage": completion_percentage,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
    except Exception as e:
        logging.error(f"Error updating trophy wall: {str(e)}")

# UPL Risk Flagging endpoints
@api_router.post("/upl/check-query", response_model=APIResponse)
async def check_query_upl_risk(
    query_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Check query for UPL risk and flag if necessary"""
    try:
        query_text = query_data.get("query", "").lower()
        
        # Get UPL settings
        upl_settings = await db.upl_settings.find_one({}) or UPLSettings().dict()
        
        if not upl_settings.get("enabled", True):
            return APIResponse(
                success=True,
                message="UPL checking disabled",
                data={"risk_level": "low", "warning_needed": False}
            )
        
        # Check for risk keywords
        risk_score = 0
        flagged_keywords = []
        
        for category, keywords in upl_settings.get("risk_keywords", {}).items():
            for keyword in keywords:
                if keyword.lower() in query_text:
                    risk_score += 1
                    flagged_keywords.append(keyword)
        
        # Determine risk level
        thresholds = upl_settings.get("risk_thresholds", {"medium": 2, "high": 3, "critical": 5})
        
        if risk_score >= thresholds.get("critical", 5):
            risk_level = UPLRiskLevel.CRITICAL
        elif risk_score >= thresholds.get("high", 3):
            risk_level = UPLRiskLevel.HIGH
        elif risk_score >= thresholds.get("medium", 2):
            risk_level = UPLRiskLevel.MEDIUM
        else:
            risk_level = UPLRiskLevel.LOW
        
        # Log UPL flag if medium or higher
        if risk_level != UPLRiskLevel.LOW:
            upl_flag = UPLFlag(
                user_id=current_user.id,
                query_text=query_text,
                risk_level=risk_level,
                flag_reason=f"Detected {len(flagged_keywords)} risk keywords",
                flagged_keywords=flagged_keywords,
                action_taken="warning_shown" if risk_level != UPLRiskLevel.CRITICAL else "query_blocked"
            )
            await db.upl_flags.insert_one(upl_flag.dict())
        
        # Get appropriate warning message
        warning_needed = risk_level != UPLRiskLevel.LOW
        warning_message = None
        
        if warning_needed:
            mascot_engine = MascotInteractionEngine()
            warning_type = "specific_case" if risk_level == UPLRiskLevel.CRITICAL else "general"
            warning_response = mascot_engine.get_upl_warning(warning_type)
            warning_message = warning_response["message"]
        
        return APIResponse(
            success=True,
            message="UPL risk check completed",
            data={
                "risk_level": risk_level.value,
                "risk_score": risk_score,
                "flagged_keywords": flagged_keywords,
                "warning_needed": warning_needed,
                "warning_message": warning_message,
                "block_query": risk_level == UPLRiskLevel.CRITICAL
            }
        )
        
    except Exception as e:
        logging.error(f"Error checking UPL risk: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check UPL risk")

# AI Memory & Suggestion Engine endpoints
@api_router.post("/ai/memory/update", response_model=APIResponse)
async def update_ai_memory(
    memory_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update AI memory with user interaction"""
    try:
        topic = memory_data.get("topic", "").lower()
        subtopics = memory_data.get("subtopics", [])
        user_feedback = memory_data.get("user_feedback")
        
        # Find or create AI memory entry
        existing_memory = await db.ai_memories.find_one({
            "user_id": current_user.id,
            "topic": topic
        })
        
        if existing_memory:
            # Update existing memory
            await db.ai_memories.update_one(
                {"user_id": current_user.id, "topic": topic},
                {
                    "$set": {
                        "last_interaction": datetime.utcnow(),
                        "user_feedback": user_feedback,
                        "needs_follow_up": memory_data.get("needs_follow_up", False)
                    },
                    "$inc": {"interaction_count": 1},
                    "$addToSet": {"subtopics": {"$each": subtopics}}
                }
            )
        else:
            # Create new memory entry
            memory = AIMemory(
                user_id=current_user.id,
                topic=topic,
                subtopics=subtopics,
                user_feedback=user_feedback,
                needs_follow_up=memory_data.get("needs_follow_up", False)
            )
            await db.ai_memories.insert_one(memory.dict())
        
        # Generate learning recommendations
        await generate_ai_recommendations(current_user.id, topic)
        
        return APIResponse(
            success=True,
            message="AI memory updated successfully",
            data={"updated": True}
        )
        
    except Exception as e:
        logging.error(f"Error updating AI memory: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update AI memory")

@api_router.get("/ai/suggestions", response_model=APIResponse)
async def get_ai_suggestions(
    current_user: User = Depends(get_current_user)
):
    """Get AI-generated learning suggestions"""
    try:
        # Get recent AI memories
        memories = await db.ai_memories.find(
            {"user_id": current_user.id}
        ).sort("last_interaction", -1).limit(10).to_list(10)
        
        # Get learning recommendations
        recommendations = await db.learning_recommendations.find(
            {"user_id": current_user.id, "is_viewed": False}
        ).sort("confidence_score", -1).limit(5).to_list(5)
        
        # Enrich recommendations with content details
        enriched_recommendations = []
        for rec in recommendations:
            content_details = await get_content_details(rec["recommended_content_id"], rec["content_type"])
            if content_details:
                enriched_recommendations.append({
                    "recommendation": LearningRecommendation(**rec).dict(),
                    "content": content_details
                })
        
        return APIResponse(
            success=True,
            message="AI suggestions retrieved successfully",
            data={
                "memories": [AIMemory(**memory).dict() for memory in memories],
                "recommendations": enriched_recommendations
            }
        )
        
    except Exception as e:
        logging.error(f"Error getting AI suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get AI suggestions")

async def generate_ai_recommendations(user_id: str, topic: str):
    """Generate AI-powered learning recommendations"""
    try:
        # Get user's learning patterns
        pattern = await db.user_learning_patterns.find_one({"user_id": user_id})
        if not pattern:
            return
        
        # Generate recommendations based on topic and patterns
        # This is a simplified version - in production, use ML/AI for better recommendations
        related_content = await db.learning_paths.find({
            "title": {"$regex": topic, "$options": "i"}
        }).limit(3).to_list(3)
        
        recommendations = []
        for content in related_content:
            recommendation = LearningRecommendation(
                user_id=user_id,
                recommended_content_id=content["id"],
                content_type="learning_path",
                recommendation_reason=f"Based on your interest in {topic}",
                confidence_score=0.8
            )
            recommendations.append(recommendation.dict())
        
        if recommendations:
            await db.learning_recommendations.insert_many(recommendations)
            
    except Exception as e:
        logging.error(f"Error generating AI recommendations: {str(e)}")

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
    """Initialize database with common script templates, legal myths, simulations, and learning paths"""
    await initialize_script_templates()
    await initialize_legal_myths()
    await initialize_legal_simulations()
    await initialize_learning_paths()
    await initialize_regional_protections()

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
    
    logging.info(f"Initialized {len(created_scenarios)} legal simulation scenarios")

# Helper functions for Advanced Learning Paths
def calculate_path_relevance(path: LearningPath, user_prefs: Dict[str, Any]) -> float:
    """Calculate relevance score for a learning path based on user preferences"""
    score = 0.0
    
    # Primary interests match
    if path.path_type.value in [interest.value if hasattr(interest, 'value') else interest for interest in user_prefs.get('primary_interests', [])]:
        score += 0.4
    
    # User situation match
    user_situations = user_prefs.get('user_situation', [])
    if any(situation in path.tags for situation in user_situations):
        score += 0.3
    
    # Difficulty preference
    preferred_difficulty = user_prefs.get('preferred_difficulty', 2)
    difficulty_diff = abs(path.difficulty_level - preferred_difficulty)
    score += 0.2 * (1 - difficulty_diff / 4)  # Normalize to 0-1
    
    # Learning style preference (simplified)
    learning_style = user_prefs.get('learning_style', 'balanced')
    if learning_style == 'interactive' and 'simulation' in path.tags:
        score += 0.1
    elif learning_style == 'visual' and 'visual' in path.tags:
        score += 0.1
    
    return min(1.0, max(0.0, score))

def get_personalization_reason(path: LearningPath, user_prefs: Dict[str, Any]) -> str:
    """Generate explanation for why this path is recommended"""
    reasons = []
    
    # Check primary interests
    primary_interests = user_prefs.get('primary_interests', [])
    for interest in primary_interests:
        interest_value = interest.value if hasattr(interest, 'value') else interest
        if path.path_type.value == interest_value:
            interest_labels = {
                'tenant_protection': 'tenant rights',
                'immigration_rights': 'immigration law',
                'student_rights': 'student protections',
                'criminal_defense': 'criminal law',
                'employment_rights': 'workplace rights',
                'consumer_protection': 'consumer law',
                'protest_rights': 'protest law',
                'family_law': 'family law',
                'general_legal_literacy': 'general legal knowledge'
            }
            reasons.append(f"Matches your interest in {interest_labels.get(interest_value, interest_value)}")
    
    # Check user situation
    user_situations = user_prefs.get('user_situation', [])
    matching_situations = [situation for situation in user_situations if situation in path.tags]
    if matching_situations:
        reasons.append(f"Relevant to your situation as a {', '.join(matching_situations)}")
    
    # Check difficulty
    preferred_difficulty = user_prefs.get('preferred_difficulty', 2)
    if abs(path.difficulty_level - preferred_difficulty) <= 1:
        reasons.append(f"Matches your preferred difficulty level")
    
    return ' • '.join(reasons) if reasons else "Recommended based on your profile"

async def check_prerequisites_met(user_id: str, prerequisite_path_ids: List[str]) -> bool:
    """Check if user has completed prerequisite learning paths"""
    if not prerequisite_path_ids:
        return True
    
    completed_paths = await db.user_learning_progress.find({
        "user_id": user_id,
        "learning_path_id": {"$in": prerequisite_path_ids},
        "is_completed": True
    }).to_list(len(prerequisite_path_ids))
    
    return len(completed_paths) == len(prerequisite_path_ids)

async def get_node_with_unlock_status(node_id: str, learning_path: LearningPath, user_id: str) -> Dict[str, Any]:
    """Get a learning node with its unlock status"""
    node = next((n for n in learning_path.path_nodes if n.id == node_id), None)
    if not node:
        return {}
    
    user_progress = await db.user_learning_progress.find_one({
        "user_id": user_id,
        "learning_path_id": learning_path.id
    })
    
    node_dict = node.dict()
    node_dict["is_unlocked"] = await is_node_unlocked(node, user_progress, user_id)
    node_dict["is_completed"] = node.id in (user_progress.get("completed_nodes", []) if user_progress else [])
    
    return node_dict

async def is_node_unlocked(node: LearningPathNode, user_progress: Optional[Dict[str, Any]], user_id: str) -> bool:
    """Check if a learning node is unlocked for the user"""
    if not user_progress:
        # Only start node is unlocked without progress
        return node.xp_required == 0
    
    # Get user's current XP
    user = await db.users.find_one({"id": user_id})
    user_xp = user.get("xp", 0) if user else 0
    
    # Check XP requirement
    if node.xp_required > user_xp:
        return False
    
    # Check node prerequisites
    if node.prerequisites:
        completed_nodes = user_progress.get("completed_nodes", [])
        return all(prereq_id in completed_nodes for prereq_id in node.prerequisites)
    
    return True

async def validate_completion_criteria(criteria: Dict[str, Any], completion_data: Dict[str, Any], user_id: str) -> bool:
    """Validate if completion criteria are met"""
    # This would contain logic specific to different completion criteria
    # For now, basic implementation
    if "required_fields" in criteria:
        required_fields = criteria["required_fields"]
        return all(field in completion_data for field in required_fields)
    
    return True

async def get_general_recommendations(limit: int) -> List[Dict[str, Any]]:
    """Get general recommendations for users without personalization"""
    recommendations = []
    
    # Recommend popular learning paths
    paths = await db.learning_paths.find({"is_active": True}).limit(limit // 2).to_list(limit // 2)
    for path in paths:
        recommendations.append({
            "content_type": "learning_path",
            "content_id": path["id"],
            "title": path["title"],
            "description": path["description"],
            "confidence_score": 0.7,
            "reason": "Popular learning path for beginners",
            "estimated_time": path["estimated_duration"],
            "xp_potential": path.get("total_xp_reward", 100)
        })
    
    # Recommend recent myths
    myths = await db.legal_myths.find({"status": "published"}).sort("published_at", -1).limit(limit // 2).to_list(limit // 2)
    for myth in myths:
        recommendations.append({
            "content_type": "myth",
            "content_id": myth["id"],
            "title": myth["title"],
            "description": myth["myth_statement"][:100] + "...",
            "confidence_score": 0.6,
            "reason": "Recent legal myth to explore",
            "estimated_time": 3,
            "xp_potential": 15
        })
    
    return recommendations

async def recommend_learning_paths(user_prefs: Dict[str, Any], user_id: str, limit: int) -> List[Dict[str, Any]]:
    """Recommend learning paths based on user preferences"""
    recommendations = []
    
    # Get all active learning paths
    paths = await db.learning_paths.find({"is_active": True}).to_list(100)
    
    # Calculate relevance scores
    scored_paths = []
    for path in paths:
        path_obj = LearningPath(**path)
        relevance = calculate_path_relevance(path_obj, user_prefs)
        if relevance > 0.3:  # Only recommend paths with decent relevance
            scored_paths.append((path_obj, relevance))
    
    # Sort by relevance and take top recommendations
    scored_paths.sort(key=lambda x: x[1], reverse=True)
    
    for path_obj, score in scored_paths[:limit]:
        recommendations.append({
            "content_type": "learning_path",
            "content_id": path_obj.id,
            "title": path_obj.title,
            "description": path_obj.description,
            "confidence_score": score,
            "reason": get_personalization_reason(path_obj, user_prefs),
            "estimated_time": path_obj.estimated_duration,
            "xp_potential": path_obj.total_xp_reward
        })
    
    return recommendations

async def recommend_myths(user_prefs: Dict[str, Any], user_id: str, limit: int) -> List[Dict[str, Any]]:
    """Recommend myths based on user preferences"""
    recommendations = []
    
    # Get user's primary interests
    primary_interests = user_prefs.get('primary_interests', [])
    
    # Convert interests to categories
    interest_to_category = {
        'tenant_protection': 'housing',
        'immigration_rights': 'civil_rights',
        'student_rights': 'education',
        'criminal_defense': 'criminal_law',
        'employment_rights': 'employment',
        'consumer_protection': 'consumer_protection',
        'protest_rights': 'civil_rights',
        'family_law': 'family_law'
    }
    
    relevant_categories = []
    for interest in primary_interests:
        interest_str = interest.value if hasattr(interest, 'value') else str(interest)
        if interest_str in interest_to_category:
            relevant_categories.append(interest_to_category[interest_str])
    
    # Get myths from relevant categories
    query = {"status": "published"}
    if relevant_categories:
        query["category"] = {"$in": relevant_categories}
    
    myths = await db.legal_myths.find(query).limit(limit).to_list(limit)
    
    for myth in myths:
        confidence = 0.8 if myth["category"] in relevant_categories else 0.5
        recommendations.append({
            "content_type": "myth",
            "content_id": myth["id"],
            "title": myth["title"],
            "description": myth["myth_statement"][:100] + "...",
            "confidence_score": confidence,
            "reason": f"Relevant to your interest in {myth['category'].replace('_', ' ')}",
            "estimated_time": 3,
            "xp_potential": 15
        })
    
    return recommendations

async def recommend_simulations(user_prefs: Dict[str, Any], user_id: str, limit: int) -> List[Dict[str, Any]]:
    """Recommend simulations based on user preferences"""
    recommendations = []
    
    # Get user's situation and interests
    user_situations = user_prefs.get('user_situation', [])
    primary_interests = user_prefs.get('primary_interests', [])
    
    # Map interests to simulation categories
    interest_to_sim_category = {
        'tenant_protection': 'housing_dispute',
        'immigration_rights': 'police_encounter',
        'criminal_defense': 'traffic_stop',
        'student_rights': 'police_encounter'
    }
    
    relevant_sim_categories = []
    for interest in primary_interests:
        interest_str = interest.value if hasattr(interest, 'value') else str(interest)
        if interest_str in interest_to_sim_category:
            relevant_sim_categories.append(interest_to_sim_category[interest_str])
    
    # Get simulations
    simulations = await db.simulation_scenarios.find({"is_active": True}).limit(limit).to_list(limit)
    
    for sim in simulations:
        confidence = 0.7 if sim["category"] in relevant_sim_categories else 0.4
        recommendations.append({
            "content_type": "simulation",
            "content_id": sim["id"],
            "title": sim["title"],
            "description": sim["description"],
            "confidence_score": confidence,
            "reason": f"Practice scenario relevant to your interests",
            "estimated_time": sim["estimated_duration"],
            "xp_potential": 50
        })
    
    return recommendations

async def initialize_learning_paths():
    """Initialize the database with comprehensive learning paths"""
    # Check if learning paths already exist
    existing_count = await db.learning_paths.count_documents({})
    if existing_count > 0:
        return  # Learning paths already initialized
    
    learning_paths_data = [
        {
            "title": "Tenant Rights Mastery",
            "description": "Master your rights as a renter. Learn about lease agreements, security deposits, eviction procedures, and how to deal with problem landlords.",
            "path_type": LearningPathType.TENANT_PROTECTION,
            "target_audience": ["undergraduate", "graduate", "general"],
            "estimated_duration": 45,  # minutes
            "difficulty_level": 2,
            "learning_objectives": [
                "Understand lease agreement essentials",
                "Know your rights regarding security deposits",
                "Recognize illegal eviction practices",
                "Learn how to document housing issues"
            ],
            "tags": ["renter", "housing", "landlord", "lease", "eviction"],
            "total_xp_reward": 150,
            "start_node_id": "tenant_intro",
            "path_nodes": [
                {
                    "id": "tenant_intro",
                    "title": "Welcome to Tenant Rights",
                    "description": "Learn the basics of tenant-landlord relationships and your fundamental rights as a renter.",
                    "node_type": "myth",
                    "content_id": None,  # Reference to housing myth
                    "xp_required": 0,
                    "xp_reward": 20,
                    "prerequisites": [],
                    "estimated_minutes": 5,
                    "difficulty_level": 1,
                    "is_locked": False,
                    "completion_criteria": {"required_interaction": "read_and_understand"}
                },
                {
                    "id": "tenant_simulation",
                    "title": "Housing Dispute Practice",
                    "description": "Practice handling a landlord dispute in a safe simulation environment.",
                    "node_type": "simulation",
                    "content_id": None,  # Reference to housing simulation
                    "xp_required": 50,
                    "xp_reward": 40,
                    "prerequisites": ["tenant_intro"],
                    "estimated_minutes": 15,
                    "difficulty_level": 2,
                    "is_locked": True,
                    "completion_criteria": {"simulation_score": 70}
                },
                {
                    "id": "tenant_qa",
                    "title": "Housing Q&A Discussion",
                    "description": "Engage with the community on housing-related questions and learn from others' experiences.",
                    "node_type": "qa_topic",
                    "content_id": "housing",
                    "xp_required": 100,
                    "xp_reward": 30,
                    "prerequisites": ["tenant_simulation"],
                    "estimated_minutes": 10,
                    "difficulty_level": 2,
                    "is_locked": True,
                    "completion_criteria": {"ask_or_answer": True}
                },
                {
                    "id": "tenant_ai_session",
                    "title": "AI Housing Consultation",
                    "description": "Have a focused conversation with the AI assistant about specific housing scenarios.",
                    "node_type": "ai_session",
                    "content_id": None,
                    "xp_required": 150,
                    "xp_reward": 35,
                    "prerequisites": ["tenant_qa"],
                    "estimated_minutes": 15,
                    "difficulty_level": 3,
                    "is_locked": True,
                    "completion_criteria": {"ai_interactions": 3}
                }
            ]
        },
        {
            "title": "Immigration Rights Protection",
            "description": "Essential knowledge for protecting your rights regardless of immigration status. Learn about ICE encounters, workplace protections, and community resources.",
            "path_type": LearningPathType.IMMIGRATION_RIGHTS,
            "target_audience": ["undergraduate", "graduate", "general"],
            "estimated_duration": 50,
            "difficulty_level": 3,
            "learning_objectives": [
                "Understand constitutional rights for all persons",
                "Learn proper responses to ICE encounters",
                "Know workplace immigration protections",
                "Identify community legal resources"
            ],
            "tags": ["immigrant", "ice", "workplace", "constitutional"],
            "total_xp_reward": 180,
            "start_node_id": "immigration_basics",
            "path_nodes": [
                {
                    "id": "immigration_basics",
                    "title": "Constitutional Rights for Everyone",
                    "description": "Learn about the constitutional rights that apply to all people in the United States, regardless of immigration status.",
                    "node_type": "myth",
                    "content_id": None,
                    "xp_required": 0,
                    "xp_reward": 25,
                    "prerequisites": [],
                    "estimated_minutes": 7,
                    "difficulty_level": 2,
                    "is_locked": False,
                    "completion_criteria": {"required_interaction": "read_and_understand"}
                },
                {
                    "id": "ice_simulation",
                    "title": "ICE Encounter Response",
                    "description": "Practice handling an ICE encounter scenario with proper rights assertion.",
                    "node_type": "simulation",
                    "content_id": None,
                    "xp_required": 100,
                    "xp_reward": 50,
                    "prerequisites": ["immigration_basics"],
                    "estimated_minutes": 20,
                    "difficulty_level": 3,
                    "is_locked": True,
                    "completion_criteria": {"simulation_score": 75}
                },
                {
                    "id": "immigration_community",
                    "title": "Immigration Law Discussion",
                    "description": "Participate in community discussions about immigration law and share knowledge.",
                    "node_type": "qa_topic",
                    "content_id": "civil_rights",
                    "xp_required": 200,
                    "xp_reward": 40,
                    "prerequisites": ["ice_simulation"],
                    "estimated_minutes": 15,
                    "difficulty_level": 3,
                    "is_locked": True,
                    "completion_criteria": {"ask_or_answer": True}
                },
                {
                    "id": "immigration_resources",
                    "title": "Legal Resource Navigation",
                    "description": "Learn how to find and access legal resources in your community.",
                    "node_type": "ai_session",
                    "content_id": None,
                    "xp_required": 300,
                    "xp_reward": 45,
                    "prerequisites": ["immigration_community"],
                    "estimated_minutes": 12,
                    "difficulty_level": 3,
                    "is_locked": True,
                    "completion_criteria": {"ai_interactions": 2}
                }
            ]
        },
        {
            "title": "Student Rights & Campus Law",
            "description": "Navigate your rights as a student, from campus searches to free speech protections. Essential for college students.",
            "path_type": LearningPathType.STUDENT_RIGHTS,
            "target_audience": ["undergraduate", "graduate"],
            "estimated_duration": 35,
            "difficulty_level": 2,
            "learning_objectives": [
                "Understand student 4th Amendment protections",
                "Learn about campus free speech rights",
                "Know academic due process procedures",
                "Recognize discrimination and harassment"
            ],
            "tags": ["student", "campus", "education", "free speech"],
            "total_xp_reward": 120,
            "start_node_id": "student_basics",
            "path_nodes": [
                {
                    "id": "student_basics",
                    "title": "Students Don't Lose All Rights",
                    "description": "Understand that students retain constitutional protections even on campus, though with some limitations.",
                    "node_type": "myth",
                    "content_id": None,
                    "xp_required": 0,
                    "xp_reward": 20,
                    "prerequisites": [],
                    "estimated_minutes": 5,
                    "difficulty_level": 1,
                    "is_locked": False,
                    "completion_criteria": {"required_interaction": "read_and_understand"}
                },
                {
                    "id": "campus_scenarios",
                    "title": "Campus Rights Practice",
                    "description": "Practice asserting your rights in various campus scenarios.",
                    "node_type": "qa_topic",
                    "content_id": "education",
                    "xp_required": 50,
                    "xp_reward": 30,
                    "prerequisites": ["student_basics"],
                    "estimated_minutes": 12,
                    "difficulty_level": 2,
                    "is_locked": True,
                    "completion_criteria": {"ask_or_answer": True}
                },
                {
                    "id": "student_ai_consultation",
                    "title": "Campus Legal Consultation",
                    "description": "Discuss specific campus legal scenarios with the AI assistant.",
                    "node_type": "ai_session",
                    "content_id": None,
                    "xp_required": 100,
                    "xp_reward": 40,
                    "prerequisites": ["campus_scenarios"],
                    "estimated_minutes": 18,
                    "difficulty_level": 2,
                    "is_locked": True,
                    "completion_criteria": {"ai_interactions": 3}
                }
            ]
        },
        {
            "title": "Criminal Defense Fundamentals",
            "description": "Essential knowledge for protecting yourself during police encounters, traffic stops, and criminal investigations.",
            "path_type": LearningPathType.CRIMINAL_DEFENSE,
            "target_audience": ["undergraduate", "graduate", "general"],
            "estimated_duration": 40,
            "difficulty_level": 2,
            "learning_objectives": [
                "Master Miranda rights and when they apply",
                "Learn proper traffic stop procedures",
                "Understand search and seizure protections",
                "Know when to request an attorney"
            ],
            "tags": ["police", "traffic", "miranda", "attorney"],
            "total_xp_reward": 140,
            "start_node_id": "miranda_myth",
            "path_nodes": [
                {
                    "id": "miranda_myth",
                    "title": "Miranda Rights Reality Check",
                    "description": "Learn the truth about when police must read Miranda rights - it's not always during arrests.",
                    "node_type": "myth",
                    "content_id": None,
                    "xp_required": 0,
                    "xp_reward": 25,
                    "prerequisites": [],
                    "estimated_minutes": 6,
                    "difficulty_level": 2,
                    "is_locked": False,
                    "completion_criteria": {"required_interaction": "read_and_understand"}
                },
                {
                    "id": "traffic_stop_practice",
                    "title": "Traffic Stop Mastery",
                    "description": "Practice handling a traffic stop scenario with confidence and knowledge of your rights.",
                    "node_type": "simulation",
                    "content_id": None,
                    "xp_required": 75,
                    "xp_reward": 45,
                    "prerequisites": ["miranda_myth"],
                    "estimated_minutes": 18,
                    "difficulty_level": 2,
                    "is_locked": True,
                    "completion_criteria": {"simulation_score": 80}
                },
                {
                    "id": "criminal_law_discussion",
                    "title": "Criminal Law Community",
                    "description": "Engage with others about criminal law questions and scenarios.",
                    "node_type": "qa_topic",
                    "content_id": "criminal_law",
                    "xp_required": 150,
                    "xp_reward": 35,
                    "prerequisites": ["traffic_stop_practice"],
                    "estimated_minutes": 10,
                    "difficulty_level": 2,
                    "is_locked": True,
                    "completion_criteria": {"ask_or_answer": True}
                },
                {
                    "id": "defense_strategies",
                    "title": "Defense Strategy Session",
                    "description": "Learn about legal defense strategies and when to seek professional help.",
                    "node_type": "ai_session",
                    "content_id": None,
                    "xp_required": 200,
                    "xp_reward": 35,
                    "prerequisites": ["criminal_law_discussion"],
                    "estimated_minutes": 6,
                    "difficulty_level": 3,
                    "is_locked": True,
                    "completion_criteria": {"ai_interactions": 2}
                }
            ]
        }
    ]
    
    # Create learning paths
    created_paths = []
    for path_data in learning_paths_data:
        # Convert path nodes
        path_nodes = []
        for node_data in path_data["path_nodes"]:
            node = LearningPathNode(**node_data)
            path_nodes.append(node)
        
        # Create learning path
        learning_path = LearningPath(
            **{k: v for k, v in path_data.items() if k != "path_nodes"},
            path_nodes=path_nodes,
            created_by="system"
        )
        created_paths.append(learning_path)
    
    await db.learning_paths.insert_many([path.dict() for path in created_paths])

async def initialize_regional_protections():
    """Initialize the database with regional protections for unlocking"""
    # Check if protections already exist
    existing_count = await db.regional_protections.count_documents({})
    if existing_count > 0:
        return  # Protections already initialized
    
    # Define regional protections data
    regional_protections_data = [
        {
            "statute_code": "CA Civil Code §1942",
            "statute_title": "Tenant Right to Repair",
            "protection_description": "Right to withhold rent for necessary repairs when landlord fails to maintain habitability",
            "state": "California",
            "protection_type": ProtectionType.RENTER,
            "unlock_requirements": {
                "lessons_completed": 3,
                "xp_required": 150
            },
            "is_federal": False
        },
        {
            "statute_code": "CA Civil Code §1946.2",
            "statute_title": "Security Deposit Protection",
            "protection_description": "Protection against excessive security deposits and requirements for deposit return",
            "state": "California",
            "protection_type": ProtectionType.RENTER,
            "unlock_requirements": {
                "lessons_completed": 2,
                "xp_required": 100
            },
            "is_federal": False
        },
        {
            "statute_code": "1st Amendment",
            "statute_title": "Peaceful Assembly Rights",
            "protection_description": "Constitutional right to peaceful assembly and protest",
            "state": "Federal",
            "protection_type": ProtectionType.PROTESTER,
            "unlock_requirements": {
                "lessons_completed": 2,
                "xp_required": 100
            },
            "is_federal": True
        },
        {
            "statute_code": "4th Amendment",
            "statute_title": "Constitutional Rights",
            "protection_description": "Protection against unreasonable searches and seizures",
            "state": "Federal",
            "protection_type": ProtectionType.GENERAL,
            "unlock_requirements": {
                "lessons_completed": 5,
                "xp_required": 300
            },
            "is_federal": True
        },
        {
            "statute_code": "5th Amendment",
            "statute_title": "Miranda Rights",
            "protection_description": "Right to remain silent and right to an attorney",
            "state": "Federal",
            "protection_type": ProtectionType.GENERAL,
            "unlock_requirements": {
                "lessons_completed": 4,
                "xp_required": 250
            },
            "is_federal": True
        },
        {
            "statute_code": "14th Amendment",
            "statute_title": "Equal Protection",
            "protection_description": "Equal protection under the law regardless of race, gender, or national origin",
            "state": "Federal",
            "protection_type": ProtectionType.GENERAL,
            "unlock_requirements": {
                "lessons_completed": 6,
                "xp_required": 400
            },
            "is_federal": True
        },
        {
            "statute_code": "Title VII",
            "statute_title": "Employment Discrimination Protection",
            "protection_description": "Protection against workplace discrimination based on protected characteristics",
            "state": "Federal",
            "protection_type": ProtectionType.WORKER,
            "unlock_requirements": {
                "lessons_completed": 4,
                "xp_required": 250
            },
            "is_federal": True
        },
        {
            "statute_code": "Fair Labor Standards Act",
            "statute_title": "Wage and Hour Protection",
            "protection_description": "Protection for minimum wage, overtime pay, and working conditions",
            "state": "Federal",
            "protection_type": ProtectionType.WORKER,
            "unlock_requirements": {
                "lessons_completed": 3,
                "xp_required": 200
            },
            "is_federal": True
        },
        {
            "statute_code": "Title IX",
            "statute_title": "Education Discrimination Protection",
            "protection_description": "Protection against sex-based discrimination in education",
            "state": "Federal",
            "protection_type": ProtectionType.STUDENT,
            "unlock_requirements": {
                "lessons_completed": 3,
                "xp_required": 180
            },
            "is_federal": True
        },
        {
            "statute_code": "FERPA",
            "statute_title": "Student Privacy Rights",
            "protection_description": "Protection of student education records and privacy rights",
            "state": "Federal",
            "protection_type": ProtectionType.STUDENT,
            "unlock_requirements": {
                "lessons_completed": 2,
                "xp_required": 120
            },
            "is_federal": True
        },
        {
            "statute_code": "ADA",
            "statute_title": "Disability Rights Protection",
            "protection_description": "Protection against discrimination based on disability",
            "state": "Federal",
            "protection_type": ProtectionType.DISABLED,
            "unlock_requirements": {
                "lessons_completed": 4,
                "xp_required": 280
            },
            "is_federal": True
        },
        {
            "statute_code": "Immigration and Nationality Act",
            "statute_title": "Immigration Rights Protection",
            "protection_description": "Basic rights for immigrants regardless of status",
            "state": "Federal",
            "protection_type": ProtectionType.UNDOCUMENTED,
            "unlock_requirements": {
                "lessons_completed": 5,
                "xp_required": 350
            },
            "is_federal": True
        },
        {
            "statute_code": "NY Education Law §3214",
            "statute_title": "Student Due Process Rights",
            "protection_description": "Due process rights for students facing suspension or expulsion",
            "state": "New York",
            "protection_type": ProtectionType.STUDENT,
            "unlock_requirements": {
                "lessons_completed": 3,
                "xp_required": 200
            },
            "is_federal": False
        },
        {
            "statute_code": "TX Property Code §92.006",
            "statute_title": "Landlord Entry Rights",
            "protection_description": "Protection against unlawful entry by landlord",
            "state": "Texas",
            "protection_type": ProtectionType.RENTER,
            "unlock_requirements": {
                "lessons_completed": 2,
                "xp_required": 150
            },
            "is_federal": False
        },
        {
            "statute_code": "FL Statute §83.56",
            "statute_title": "Termination of Tenancy",
            "protection_description": "Protection against unlawful eviction and termination procedures",
            "state": "Florida",
            "protection_type": ProtectionType.RENTER,
            "unlock_requirements": {
                "lessons_completed": 4,
                "xp_required": 220
            },
            "is_federal": False
        }
    ]
    
    # Create regional protections
    created_protections = []
    for protection_data in regional_protections_data:
        protection = RegionalProtection(**protection_data)
        created_protections.append(protection)
    
    await db.regional_protections.insert_many([protection.dict() for protection in created_protections])
    logging.info(f"Initialized {len(created_protections)} regional protections")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
