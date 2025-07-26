from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# User-related models
class UserType(str, Enum):
    UNDERGRADUATE = "undergraduate"
    GRADUATE = "graduate"
    LAW_STUDENT = "law_student"
    PROFESSOR = "professor"
    GENERAL = "general"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    username: str
    password_hash: str
    user_type: UserType
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile: Optional[Dict[str, Any]] = {}
    # Gamification fields
    xp: int = 0
    level: int = 1
    badges: List[str] = []
    streak_days: int = 0
    last_activity: Optional[datetime] = None

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    user_type: UserType
    profile: Optional[Dict[str, Any]] = {}

class UserLogin(BaseModel):
    email: str
    password: str

# Legal Content Models
class StatuteCategory(str, Enum):
    CRIMINAL_LAW = "criminal_law"
    CIVIL_RIGHTS = "civil_rights"
    HOUSING = "housing"
    EMPLOYMENT = "employment"
    CONSUMER_PROTECTION = "consumer_protection"
    EDUCATION = "education"
    TRAFFIC = "traffic"
    FAMILY_LAW = "family_law"
    CONTRACTS = "contracts"
    TORTS = "torts"

class LegalStatute(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    statute_number: str
    state: str
    category: StatuteCategory
    summary: str
    full_text: str
    keywords: List[str] = []
    effective_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StatuteCreate(BaseModel):
    title: str
    statute_number: str
    state: str
    category: StatuteCategory
    summary: str
    full_text: str
    keywords: List[str] = []
    effective_date: Optional[datetime] = None

# Community Q&A Models
class QuestionStatus(str, Enum):
    OPEN = "open"
    ANSWERED = "answered"
    CLOSED = "closed"
    MODERATED = "moderated"

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    author_id: str
    category: StatuteCategory
    tags: List[str] = []
    status: QuestionStatus = QuestionStatus.OPEN
    upvotes: int = 0
    downvotes: int = 0
    view_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class QuestionCreate(BaseModel):
    title: str
    content: str
    category: StatuteCategory
    tags: List[str] = []

class Answer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_id: str
    content: str
    author_id: str
    upvotes: int = 0
    downvotes: int = 0
    is_accepted: bool = False
    is_expert_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnswerCreate(BaseModel):
    question_id: str
    content: str

# Legal Myths and Facts Models
class LegalMythStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class LegalMyth(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    myth_statement: str
    fact_explanation: str
    category: StatuteCategory
    difficulty_level: int = 1  # 1-5 scale
    sources: List[str] = []
    tags: List[str] = []
    likes: int = 0
    shares: int = 0
    views: int = 0
    status: LegalMythStatus = LegalMythStatus.DRAFT
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None

class LegalMythCreate(BaseModel):
    title: str
    myth_statement: str
    fact_explanation: str
    category: StatuteCategory
    difficulty_level: int = 1
    sources: List[str] = []
    tags: List[str] = []

# Scenario Simulation Models
class SimulationCategory(str, Enum):
    POLICE_ENCOUNTER = "police_encounter"
    HOUSING_DISPUTE = "housing_dispute"
    EMPLOYMENT_ISSUE = "employment_issue"
    CONSUMER_RIGHTS = "consumer_rights"
    TRAFFIC_STOP = "traffic_stop"
    COURT_APPEARANCE = "court_appearance"

class SimulationScenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: SimulationCategory
    difficulty_level: int = 1  # 1-5 scale
    estimated_duration: int  # in minutes
    learning_objectives: List[str] = []
    scenario_data: Dict[str, Any] = {}  # Contains the branching scenario logic
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class SimulationCreate(BaseModel):
    title: str
    description: str
    category: SimulationCategory
    difficulty_level: int = 1
    estimated_duration: int
    learning_objectives: List[str] = []
    scenario_data: Dict[str, Any] = {}

class SimulationProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    scenario_id: str
    current_step: int = 0
    choices_made: List[Dict[str, Any]] = []
    score: Optional[int] = None
    completed: bool = False
    completion_time: Optional[int] = None  # in seconds
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# Learning Path Models
class LearningPath(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    target_user_types: List[UserType] = []
    difficulty_level: int = 1  # 1-5 scale
    estimated_duration: int  # in hours
    modules: List[Dict[str, Any]] = []  # Module structure with content references
    prerequisites: List[str] = []  # Other learning path IDs
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class LearningPathCreate(BaseModel):
    title: str
    description: str
    target_user_types: List[UserType] = []
    difficulty_level: int = 1
    estimated_duration: int
    modules: List[Dict[str, Any]] = []
    prerequisites: List[str] = []

class UserLearningProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    learning_path_id: str
    current_module: int = 0
    completed_modules: List[int] = []
    progress_percentage: float = 0.0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# AI Query Models
class AIQueryType(str, Enum):
    LEGAL_QUESTION = "legal_question"
    STATUTE_LOOKUP = "statute_lookup"
    CASE_ANALYSIS = "case_analysis"
    GENERAL_LEGAL = "general_legal"

class AIQuery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    query_text: str
    query_type: AIQueryType
    context: Optional[Dict[str, Any]] = {}
    response: Optional[str] = None
    suggested_statutes: List[str] = []  # Statute IDs
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None

class AIQueryCreate(BaseModel):
    query_text: str
    query_type: AIQueryType
    context: Optional[Dict[str, Any]] = {}

# Emergency SOS Models
class EmergencyContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    phone: str
    email: Optional[str] = None
    relationship: str
    is_primary: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    relationship: str
    is_primary: bool = False

class EmergencyAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    alert_type: str
    location: Optional[Dict[str, Any]] = {}  # GPS coordinates, address
    message: Optional[str] = None
    contacts_notified: List[str] = []  # Contact IDs
    status: str = "active"  # active, resolved, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

# Gamification Models
class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    category: str
    requirements: Dict[str, Any] = {}
    xp_reward: int = 0
    rarity: str = "common"  # common, rare, epic, legendary
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserBadge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    progress: Optional[Dict[str, Any]] = {}

# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int