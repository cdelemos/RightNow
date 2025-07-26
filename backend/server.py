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

# Legal Statutes endpoints
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
    per_page: int = 20
):
    query = {}
    if state:
        query["state"] = state
    if category:
        query["category"] = category.value
    if search:
        # Simple text search in title, summary, and keywords
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}},
            {"keywords": {"$in": [search.lower()]}}
        ]
    
    total = await db.legal_statutes.count_documents(query)
    skip = (page - 1) * per_page
    statutes = await db.legal_statutes.find(query).skip(skip).limit(per_page).to_list(per_page)
    
    return APIResponse(
        success=True,
        message="Statutes retrieved successfully",
        data=PaginatedResponse(
            items=[LegalStatute(**statute) for statute in statutes],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page)
        ).dict()
    )

@api_router.get("/statutes/{statute_id}", response_model=APIResponse)
async def get_statute(statute_id: str):
    statute = await db.legal_statutes.find_one({"id": statute_id})
    if not statute:
        raise HTTPException(status_code=404, detail="Statute not found")
    
    return APIResponse(success=True, message="Statute retrieved successfully", data=LegalStatute(**statute).dict())

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
