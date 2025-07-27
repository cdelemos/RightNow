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
    # New fields for enhanced statute information
    practical_impact: Optional[str] = ""
    student_relevance: Optional[str] = ""

class StatuteCreate(BaseModel):
    title: str
    statute_number: str
    state: str
    category: StatuteCategory
    summary: str
    full_text: str
    keywords: List[str] = []
    effective_date: Optional[datetime] = None
    practical_impact: Optional[str] = ""
    student_relevance: Optional[str] = ""

# User interactions with statutes
class UserStatuteBookmark(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    statute_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = ""

class UserStatuteProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    statute_id: str
    read_at: datetime = Field(default_factory=datetime.utcnow)
    time_spent: int = 0  # seconds
    comprehension_score: Optional[int] = None  # 1-5 rating

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

# Enhanced Simulation Models
class SimulationNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    choices: List[Dict[str, Any]] = []  # Choice text, next_node_id, is_correct, feedback
    is_end_node: bool = False
    legal_explanation: Optional[str] = None
    outcome_type: str = "neutral"  # positive, negative, neutral
    xp_reward: int = 0

class SimulationScenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: SimulationCategory
    difficulty_level: int = 1  # 1-5 scale
    estimated_duration: int  # in minutes
    learning_objectives: List[str] = []
    scenario_nodes: List[SimulationNode] = []  # Complete scenario tree
    start_node_id: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    # New fields for enhanced scenarios
    legal_context: str = ""
    applicable_laws: List[str] = []
    state_specific: bool = False
    applicable_states: List[str] = []

class SimulationProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    scenario_id: str
    current_node_id: str
    path_taken: List[Dict[str, Any]] = []  # Track choices made
    score: int = 0
    max_possible_score: int = 100
    completed: bool = False
    completion_time: Optional[int] = None  # in seconds
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    total_xp_earned: int = 0

class SimulationChoice(BaseModel):
    choice_text: str
    next_node_id: Optional[str] = None
    is_optimal: bool = False
    is_legal: bool = True
    feedback: str = ""
    immediate_consequence: str = ""
    xp_value: int = 0

# Voting Models
class QuestionVote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    question_id: str
    vote_type: str  # "upvote" or "downvote"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnswerVote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    answer_id: str
    vote_type: str  # "upvote" or "downvote"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced Learning Path Models
class LearningPathType(str, Enum):
    TENANT_PROTECTION = "tenant_protection"
    IMMIGRATION_RIGHTS = "immigration_rights"
    STUDENT_RIGHTS = "student_rights"
    CRIMINAL_DEFENSE = "criminal_defense" 
    EMPLOYMENT_RIGHTS = "employment_rights"
    CONSUMER_PROTECTION = "consumer_protection"
    PROTEST_RIGHTS = "protest_rights"
    FAMILY_LAW = "family_law"
    GENERAL_LEGAL_LITERACY = "general_legal_literacy"

class LearningPathNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    node_type: str  # "myth", "simulation", "qa_topic", "ai_session", "assessment"
    content_id: Optional[str] = None  # Reference to specific content
    xp_required: int = 0  # XP needed to unlock this node
    xp_reward: int = 20  # XP awarded for completing this node
    prerequisites: List[str] = []  # Node IDs that must be completed first
    estimated_minutes: int = 5
    difficulty_level: int = 1  # 1-5 scale
    is_locked: bool = True
    completion_criteria: Dict[str, Any] = {}  # Specific requirements to complete

class LearningPath(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    path_type: LearningPathType
    target_audience: List[str] = []  # ["undergraduate", "graduate", "general", etc.]
    estimated_duration: int  # Total estimated minutes
    difficulty_level: int = 1  # 1-5 scale overall difficulty
    learning_objectives: List[str] = []
    path_nodes: List[LearningPathNode] = []
    start_node_id: str
    total_xp_reward: int = 0
    prerequisites: List[str] = []  # Other learning path IDs
    tags: List[str] = []
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLearningProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    learning_path_id: str
    current_node_id: Optional[str] = None
    completed_nodes: List[str] = []  # Node IDs completed
    total_xp_earned: int = 0
    progress_percentage: float = 0.0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    is_completed: bool = False
    
class UserPersonalization(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    primary_interests: List[LearningPathType] = []  # User's main legal interests
    user_situation: List[str] = []  # ["renter", "student", "immigrant", "protester", etc.]
    learning_style: str = "balanced"  # "visual", "interactive", "reading", "balanced"
    weekly_time_commitment: int = 60  # minutes per week
    preferred_difficulty: int = 2  # 1-5 scale
    content_preferences: Dict[str, bool] = {}  # {"myths": True, "simulations": True, etc.}
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LearningPathCreate(BaseModel):
    title: str
    description: str
    path_type: LearningPathType
    target_audience: List[str] = []
    estimated_duration: int
    difficulty_level: int = 1
    learning_objectives: List[str] = []
    tags: List[str] = []

class LearningRecommendation(BaseModel):
    content_type: str  # "learning_path", "myth", "simulation", "qa_topic"
    content_id: str
    title: str
    description: str
    confidence_score: float  # 0.0-1.0
    reason: str  # Why this is recommended
    estimated_time: int  # minutes
    xp_potential: int

# AI Query Models (Legacy)
class AIQueryCreate(BaseModel):
    query_text: str
    query_type: str = "legal_question"
    context: Dict[str, Any] = {}

# AI Chat Models
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    message: str
    response: Optional[str] = None
    user_state: Optional[str] = None
    message_type: str = "user"  # user, assistant, system
    confidence_score: Optional[float] = None
    suggested_scripts: List[Dict[str, Any]] = []
    upl_risk_flagged: bool = False
    upl_warning: Optional[str] = None
    xp_awarded: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_state: Optional[str] = None
    message_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_state: Optional[str] = None

class ScriptTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str  # traffic_stop, ice_encounter, police_search, etc.
    scenario: str
    script_text: str
    legal_basis: str
    keywords: List[str] = []
    state_specific: bool = False
    applicable_states: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatResponseData(BaseModel):
    response: str
    session_id: str
    confidence_score: Optional[float] = None
    upl_risk_flagged: bool = False
    upl_warning: Optional[str] = None
    suggested_scripts: List[Dict[str, Any]] = []
    suggested_statutes: List[str] = []
    xp_awarded: int = 0
    requires_state: bool = False

# User interaction with myths
class UserMythProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    myth_id: str
    read_at: datetime = Field(default_factory=datetime.utcnow)
    liked: bool = False
    time_spent: int = 0  # seconds
    comprehension_score: Optional[int] = None  # 1-5 rating

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