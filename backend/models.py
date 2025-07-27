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
class EmergencyContactType(str, Enum):
    FAMILY = "family"
    FRIEND = "friend"
    LAWYER = "lawyer"
    LEGAL_AID = "legal_aid"
    ORGANIZATION = "organization"

class EmergencyContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    phone_number: str
    email: Optional[str] = None
    contact_type: EmergencyContactType
    relationship: Optional[str] = None
    organization: Optional[str] = None  # Legal aid organization, etc.
    notes: Optional[str] = None
    is_priority: bool = False  # Priority contacts get notified first
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmergencyAlertType(str, Enum):
    POLICE_ENCOUNTER = "police_encounter"
    ICE_ENCOUNTER = "ice_encounter"
    ARREST = "arrest"
    DETENTION = "detention"
    TRAFFIC_STOP = "traffic_stop"
    SEARCH = "search"
    HOUSING_EMERGENCY = "housing_emergency"
    WORKPLACE_EMERGENCY = "workplace_emergency"
    GENERAL_EMERGENCY = "general_emergency"

class EmergencyAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    alert_type: EmergencyAlertType
    location: Optional[Dict[str, Any]] = None  # lat, lng, address
    description: Optional[str] = None
    priority_level: int = 1  # 1=low, 2=medium, 3=high, 4=critical
    is_active: bool = True
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Notification tracking
    contacts_notified: List[str] = []  # Contact IDs that have been notified
    notification_sent_at: Optional[datetime] = None
    
    # Additional context
    legal_context: Optional[str] = None  # Relevant legal info
    recommended_actions: List[str] = []
    relevant_statutes: List[str] = []  # Statute IDs

class EmergencyResponse(BaseModel):
    alert_id: str
    response_type: str  # "know_rights", "contact_lawyer", "document_incident"
    content: str
    legal_guidance: Optional[str] = None
    emergency_scripts: List[str] = []
    relevant_statutes: List[str] = []
    next_steps: List[str] = []

class LocationData(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class EmergencyContactCreate(BaseModel):
    name: str
    phone_number: str
    email: Optional[str] = None
    contact_type: EmergencyContactType
    relationship: Optional[str] = None
    organization: Optional[str] = None
    notes: Optional[str] = None
    is_priority: bool = False

class EmergencyAlertCreate(BaseModel):
    alert_type: EmergencyAlertType
    location: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    priority_level: int = 2

class QuickAccessTool(BaseModel):
    tool_type: str  # "statute_search", "rights_script", "contact_alert", "ai_chat"
    title: str
    description: str
    icon: str
    action_data: Dict[str, Any] = {}

# Enhanced Gamification Models
class BadgeCategory(str, Enum):
    KNOWLEDGE = "knowledge"
    ENGAGEMENT = "engagement"
    ACHIEVEMENT = "achievement"
    MILESTONE = "milestone"
    SPECIAL = "special"

class BadgeRarity(str, Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"

class Badge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    category: BadgeCategory
    requirements: Dict[str, Any] = {}
    xp_reward: int = 0
    rarity: BadgeRarity = BadgeRarity.COMMON
    is_hidden: bool = False  # Hidden badges are surprises
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserBadge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    progress: Optional[Dict[str, Any]] = {}

class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    category: str
    target_value: int  # e.g., 100 for "Read 100 statutes"
    current_value: int = 0
    xp_reward: int = 0
    badge_reward: Optional[str] = None  # Badge ID to award
    is_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserAchievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    achievement_id: str
    current_progress: int = 0
    completed_at: Optional[datetime] = None
    is_completed: bool = False

class Streak(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    streak_type: str  # "daily_login", "daily_myth", "weekly_learning", etc.
    current_count: int = 0
    best_count: int = 0
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    total_xp: int = 0
    level: int = 1
    badges_earned: int = 0
    achievements_completed: int = 0
    
    # Activity stats
    statutes_read: int = 0
    myths_read: int = 0
    questions_asked: int = 0
    answers_provided: int = 0
    simulations_completed: int = 0
    learning_paths_completed: int = 0
    ai_chats_initiated: int = 0
    
    # Engagement stats
    daily_streak: int = 0
    weekly_streak: int = 0
    total_study_time: int = 0  # in minutes
    
    # Social stats
    upvotes_received: int = 0
    downvotes_received: int = 0
    content_shared: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Leaderboard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    leaderboard_type: str  # "weekly_xp", "monthly_xp", "statute_master", etc.
    user_rankings: List[Dict[str, Any]] = []  # [{"user_id": str, "score": int, "rank": int}]
    period_start: datetime
    period_end: datetime
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class XPTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str  # "read_statute", "answer_question", etc.
    xp_amount: int
    description: str
    context: Dict[str, Any] = {}  # Additional context about the action
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Mascot System Models
class MascotMood(str, Enum):
    PROTECTIVE = "protective"
    CLEAR = "clear"
    EMPOWERING = "empowering"
    SERIOUS = "serious"
    FOCUSED = "focused"
    ALERT = "alert"
    SUPPORTIVE = "supportive"
    VIGILANT = "vigilant"

class MascotAction(str, Enum):
    WELCOME = "welcome"
    LESSON_COMPLETE = "lesson_complete"
    INCORRECT_ANSWER = "incorrect_answer"
    EMERGENCY_SITUATION = "emergency_situation"
    RIGHTS_UNLOCKED = "rights_unlocked"
    TUTORIAL_INTRO = "tutorial_intro"
    CONTEXTUAL_TOOLTIP = "contextual_tooltip"
    PROTECTION_REMINDER = "protection_reminder"
    CLARITY_EXPLANATION = "clarity_explanation"
    UPL_WARNING = "upl_warning"

class MascotInteraction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mascot_name: str = "Juris"
    message: str
    mood: MascotMood
    action: MascotAction
    appearance: Dict[str, Any] = {}  # emoji, expression, color, animation
    context: Dict[str, Any] = {}
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MascotSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mascot_enabled: bool = True
    show_daily_tips: bool = True
    show_achievements: bool = True
    show_streaks: bool = True
    show_encouragement: bool = True
    notification_frequency: str = "normal"  # "minimal", "normal", "frequent"
    preferred_mood: Optional[MascotMood] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Personalized Learning by Protection Type Models
class ProtectionType(str, Enum):
    UNDOCUMENTED = "undocumented"
    RENTER = "renter"
    PROTESTER = "protester"
    STUDENT = "student"
    WORKER = "worker"
    LGBTQ = "lgbtq"
    DISABLED = "disabled"
    PARENT = "parent"
    SENIOR = "senior"
    GENERAL = "general"

class UserProtectionProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    primary_protection_type: ProtectionType
    secondary_protection_types: List[ProtectionType] = []
    location_state: Optional[str] = None
    location_city: Optional[str] = None
    specific_concerns: List[str] = []
    notification_preferences: Dict[str, bool] = {
        "push_notifications": True,
        "email_updates": True,
        "sms_alerts": False
    }
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ContentTag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_id: str
    content_type: str  # "statute", "myth", "simulation", "learning_path"
    protection_types: List[ProtectionType]
    relevance_score: float = 1.0  # 0.0 to 1.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PersonalizedRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str
    content_type: str
    protection_type: ProtectionType
    relevance_score: float
    reason: str
    is_viewed: bool = False
    is_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Purpose-Driven XP Unlocks Models
class RegionalProtection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    statute_code: str
    statute_title: str
    protection_description: str
    state: str
    protection_type: ProtectionType
    unlock_requirements: Dict[str, int]  # {"lessons_completed": 3, "xp_required": 100}
    is_federal: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UnlockedProtection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    protection_id: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    viewed_at: Optional[datetime] = None
    is_bookmarked: bool = False

class TrophyWall(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    unlocked_protections: List[str] = []  # List of UnlockedProtection IDs
    total_protections_available: int = 0
    completion_percentage: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# UPL Risk Flagging Models
class UPLRiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UPLFlag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    query_text: str
    risk_level: UPLRiskLevel
    flag_reason: str
    flagged_keywords: List[str] = []
    action_taken: str  # "warning_shown", "query_blocked", "escalated"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UPLSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    risk_keywords: Dict[str, List[str]] = {
        "personal_legal_advice": ["my case", "I was arrested", "I got a ticket", "should I", "what should I do"],
        "specific_case_details": ["yesterday", "last week", "court date", "my lawyer", "my situation"],
        "urgent_legal_matters": ["emergency", "urgent", "immediately", "right now", "ASAP"]
    }
    risk_thresholds: Dict[str, int] = {
        "medium": 2,
        "high": 3,
        "critical": 5
    }
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# AI Memory & Suggestion Engine Models
class AIMemory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    topic: str
    subtopics: List[str] = []
    user_understanding_level: int = 1  # 1-5 scale
    last_interaction: datetime = Field(default_factory=datetime.utcnow)
    interaction_count: int = 1
    user_feedback: Optional[str] = None
    needs_follow_up: bool = False

class LearningRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    recommended_content_id: str
    content_type: str
    recommendation_reason: str
    confidence_score: float
    is_viewed: bool = False
    is_accepted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLearningPattern(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    preferred_content_types: List[str] = []
    learning_time_preferences: List[str] = []
    difficulty_preference: str = "medium"  # "easy", "medium", "hard"
    topics_of_interest: List[str] = []
    completion_rates: Dict[str, float] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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