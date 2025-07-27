# Mascot System for RightNow Legal Education Platform
# The mascot "Juris" is a friendly owl representing wisdom and legal knowledge

from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime
import random

class MascotMood(str, Enum):
    HAPPY = "happy"
    EXCITED = "excited"
    ENCOURAGING = "encouraging"
    PROUD = "proud"
    THOUGHTFUL = "thoughtful"
    CONCERNED = "concerned"
    CELEBRATORY = "celebratory"
    MOTIVATIONAL = "motivational"

class MascotAction(str, Enum):
    WELCOME = "welcome"
    CONGRATULATE = "congratulate"
    ENCOURAGE = "encourage"
    CELEBRATE_LEVEL_UP = "celebrate_level_up"
    CELEBRATE_BADGE = "celebrate_badge"
    REMIND_STREAK = "remind_streak"
    INTRODUCE_FEATURE = "introduce_feature"
    STUDY_TIP = "study_tip"
    DAILY_GREETING = "daily_greeting"
    ACHIEVEMENT_UNLOCK = "achievement_unlock"
    LEARNING_PATH_COMPLETE = "learning_path_complete"
    FIRST_QUESTION = "first_question"
    EMERGENCY_SOS_INTRO = "emergency_sos_intro"

class MascotPersonality:
    """Juris the Owl - The wise legal mentor"""
    
    NAME = "Juris"
    SPECIES = "Owl"
    PERSONALITY_TRAITS = [
        "Wise", "Encouraging", "Patient", "Knowledgeable", 
        "Supportive", "Friendly", "Professional", "Motivational"
    ]
    
    # Mascot appearance configurations
    APPEARANCES = {
        MascotMood.HAPPY: {
            "emoji": "🦉",
            "expression": "^v^",
            "color": "#8B4513",
            "animation": "bounce"
        },
        MascotMood.EXCITED: {
            "emoji": "🦉",
            "expression": "✨^v^✨",
            "color": "#FFD700",
            "animation": "pulse"
        },
        MascotMood.ENCOURAGING: {
            "emoji": "🦉",
            "expression": "◕v◕",
            "color": "#4A90E2",
            "animation": "sway"
        },
        MascotMood.PROUD: {
            "emoji": "🦉",
            "expression": "^◡^",
            "color": "#32CD32",
            "animation": "glow"
        },
        MascotMood.THOUGHTFUL: {
            "emoji": "🦉",
            "expression": "◔v◔",
            "color": "#9370DB",
            "animation": "tilt"
        },
        MascotMood.CONCERNED: {
            "emoji": "🦉",
            "expression": "◕﹏◕",
            "color": "#FF6B6B",
            "animation": "gentle-sway"
        },
        MascotMood.CELEBRATORY: {
            "emoji": "🦉",
            "expression": "★^v^★",
            "color": "#FF69B4",
            "animation": "celebration"
        },
        MascotMood.MOTIVATIONAL: {
            "emoji": "🦉",
            "expression": "◕︵◕",
            "color": "#FF8C00",
            "animation": "motivate"
        }
    }

class MascotMessageBank:
    """Comprehensive message bank for Juris the Owl"""
    
    MESSAGES = {
        MascotAction.WELCOME: {
            MascotMood.HAPPY: [
                "Welcome to RightNow Legal Education! I'm Juris, your wise legal companion. Let's embark on this journey of legal knowledge together! 🦉",
                "Hoot hoot! I'm Juris, and I'm here to guide you through the fascinating world of law. Ready to learn something amazing today?",
                "Hello there! I'm Juris the Owl, your legal mentor. I'm excited to help you discover the power of legal knowledge!"
            ],
            MascotMood.ENCOURAGING: [
                "Welcome! I'm Juris, and I believe in your potential to master legal concepts. Every expert was once a beginner!",
                "Greetings! I'm Juris, your legal guide. Remember, every great lawyer started with curiosity - just like you!"
            ]
        },
        
        MascotAction.CONGRATULATE: {
            MascotMood.PROUD: [
                "Excellent work! You're making fantastic progress. I'm so proud of your dedication to learning!",
                "Wonderful! Your commitment to understanding the law is truly inspiring. Keep up the great work!",
                "Outstanding! You're building a solid foundation in legal knowledge. I'm impressed by your progress!"
            ],
            MascotMood.EXCITED: [
                "Wow! That was amazing! You're really getting the hang of this legal stuff. I'm so excited for you!",
                "Incredible! You just mastered another legal concept. This is so exciting to watch!"
            ]
        },
        
        MascotAction.ENCOURAGE: {
            MascotMood.ENCOURAGING: [
                "Don't worry, learning law takes time and practice. I'm here to support you every step of the way!",
                "Remember, even the wisest owl had to learn to fly. You're doing great - keep going!",
                "Legal concepts can be challenging, but you have what it takes. I believe in you!",
                "Take your time and don't be hard on yourself. Every question you ask makes you wiser!"
            ],
            MascotMood.MOTIVATIONAL: [
                "You've got this! Legal knowledge is a powerful tool, and you're building that power every day.",
                "Remember why you started this journey. Your dedication to justice and understanding is admirable!"
            ]
        },
        
        MascotAction.CELEBRATE_LEVEL_UP: {
            MascotMood.CELEBRATORY: [
                "🎉 LEVEL UP! You've reached a new milestone in your legal education journey! I'm so proud of your achievement!",
                "🌟 Congratulations on leveling up! Your dedication to learning is paying off. Onward to greater heights!",
                "🎊 Level up achieved! You're becoming quite the legal scholar. I'm honored to be your guide!"
            ],
            MascotMood.EXCITED: [
                "WOW! Level up! This is incredible! You're really mastering legal concepts left and right!",
                "Amazing! Another level conquered! Your legal knowledge is growing by leaps and bounds!"
            ]
        },
        
        MascotAction.CELEBRATE_BADGE: {
            MascotMood.PROUD: [
                "🏆 Badge earned! You've demonstrated real expertise in this area. Well done!",
                "🎖️ Congratulations on your new badge! This represents your hard work and dedication.",
                "🏅 Badge unlocked! You're building an impressive collection of legal achievements!"
            ],
            MascotMood.CELEBRATORY: [
                "✨ New badge! Fantastic work! Each badge represents your growing expertise in law.",
                "🌟 Badge achieved! Your commitment to learning is truly paying off!"
            ]
        },
        
        MascotAction.REMIND_STREAK: {
            MascotMood.MOTIVATIONAL: [
                "🔥 You're on a {streak_count}-day learning streak! Consistency is key to mastering legal concepts.",
                "💪 {streak_count} days strong! Your dedication to daily learning is building real expertise.",
                "⚡ {streak_count} days of learning! You're developing an excellent habit of legal study."
            ],
            MascotMood.ENCOURAGING: [
                "Keep that streak alive! {streak_count} days of consistent learning is impressive.",
                "Your {streak_count}-day streak shows real commitment. I'm proud of your consistency!"
            ]
        },
        
        MascotAction.INTRODUCE_FEATURE: {
            MascotMood.EXCITED: [
                "Let me show you something cool! This feature will help you learn more effectively.",
                "I'm excited to introduce you to this powerful learning tool!",
                "Check this out! This feature is designed to enhance your legal education experience."
            ],
            MascotMood.THOUGHTFUL: [
                "Here's a feature that I think you'll find valuable for your legal studies.",
                "This tool was designed with learners like you in mind. Let me explain how it works."
            ]
        },
        
        MascotAction.STUDY_TIP: {
            MascotMood.THOUGHTFUL: [
                "💡 Study tip: Try to connect new legal concepts to real-world situations you're familiar with.",
                "🧠 Here's a tip: After reading about a legal principle, try to explain it in your own words.",
                "📚 Study wisdom: Regular, short study sessions are more effective than cramming.",
                "🔍 Tip: When learning about statutes, pay attention to the key terms and definitions.",
                "📖 Study hack: Create mental connections between related legal concepts."
            ],
            MascotMood.ENCOURAGING: [
                "Remember: The best way to learn law is through consistent practice and curiosity.",
                "Pro tip: Don't just memorize - understand the 'why' behind legal principles."
            ]
        },
        
        MascotAction.DAILY_GREETING: {
            MascotMood.HAPPY: [
                "Good morning! Ready to expand your legal knowledge today?",
                "Hello there! What legal adventure shall we embark on today?",
                "Welcome back! I'm excited to continue our legal learning journey together."
            ],
            MascotMood.ENCOURAGING: [
                "Great to see you again! Every day of learning makes you more knowledgeable.",
                "Welcome back! Your commitment to learning is truly admirable."
            ]
        },
        
        MascotAction.ACHIEVEMENT_UNLOCK: {
            MascotMood.CELEBRATORY: [
                "🎯 Achievement unlocked! You've reached a significant milestone in your legal education!",
                "🏆 New achievement! This represents your growing expertise and dedication.",
                "⭐ Achievement earned! You're building an impressive portfolio of legal knowledge."
            ],
            MascotMood.PROUD: [
                "I'm so proud of this achievement! You've demonstrated real mastery of legal concepts.",
                "This achievement is well-deserved! Your hard work is really paying off."
            ]
        },
        
        MascotAction.LEARNING_PATH_COMPLETE: {
            MascotMood.CELEBRATORY: [
                "🎓 Learning path completed! You've mastered another area of legal knowledge. Congratulations!",
                "📚 Path complete! You've shown dedication and thoroughness in your legal studies.",
                "🌟 Learning journey finished! You've gained valuable expertise in this legal area."
            ],
            MascotMood.PROUD: [
                "I'm incredibly proud of you for completing this learning path! Your dedication is inspiring.",
                "What an accomplishment! You've thoroughly explored this area of law."
            ]
        },
        
        MascotAction.FIRST_QUESTION: {
            MascotMood.ENCOURAGING: [
                "Great question! Asking questions is the foundation of legal learning. I'm here to help you explore the answers.",
                "Excellent! Your curiosity is the key to understanding complex legal concepts.",
                "Wonderful question! This is exactly how legal scholars think - by questioning and exploring."
            ],
            MascotMood.EXCITED: [
                "I love your question! This is what makes legal learning so exciting - the quest for understanding.",
                "Fantastic question! You're thinking like a true legal scholar already."
            ]
        },
        
        MascotAction.EMERGENCY_SOS_INTRO: {
            MascotMood.CONCERNED: [
                "I want to make sure you know about our Emergency SOS feature. Your safety and legal rights are important to me.",
                "As your legal guide, I want you to be prepared for any situation. The Emergency SOS feature is here to help.",
                "Knowledge is power, but in emergencies, having quick access to legal help is crucial. Let me show you the SOS feature."
            ],
            MascotMood.ENCOURAGING: [
                "Being prepared for legal emergencies is part of being legally informed. I'm here to help you stay safe.",
                "Your legal rights are always important, especially in emergency situations. I want to help you be prepared."
            ]
        }
    }

class MascotInteractionEngine:
    """Handles mascot interactions and responses"""
    
    def __init__(self):
        self.personality = MascotPersonality()
        self.message_bank = MascotMessageBank()
    
    def get_mascot_response(self, action: MascotAction, mood: MascotMood = None, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a mascot response based on action and mood"""
        
        # Auto-select mood if not provided
        if mood is None:
            mood = self._determine_mood_for_action(action)
        
        # Get appearance configuration
        appearance = self.personality.APPEARANCES.get(mood, self.personality.APPEARANCES[MascotMood.HAPPY])
        
        # Get message
        messages = self.message_bank.MESSAGES.get(action, {}).get(mood, [])
        if not messages:
            # Fallback to any available message for this action
            for available_mood, available_messages in self.message_bank.MESSAGES.get(action, {}).items():
                if available_messages:
                    messages = available_messages
                    break
        
        if not messages:
            # Ultimate fallback
            messages = ["Hello! I'm Juris, your legal companion. I'm here to help you learn!"]
        
        # Select random message
        message = random.choice(messages)
        
        # Apply context formatting
        if context:
            message = message.format(**context)
        
        return {
            "mascot_name": self.personality.NAME,
            "message": message,
            "mood": mood.value,
            "appearance": appearance,
            "action": action.value,
            "timestamp": datetime.utcnow().isoformat(),
            "personality_traits": self.personality.PERSONALITY_TRAITS
        }
    
    def _determine_mood_for_action(self, action: MascotAction) -> MascotMood:
        """Auto-determine appropriate mood for action"""
        mood_mapping = {
            MascotAction.WELCOME: MascotMood.HAPPY,
            MascotAction.CONGRATULATE: MascotMood.PROUD,
            MascotAction.ENCOURAGE: MascotMood.ENCOURAGING,
            MascotAction.CELEBRATE_LEVEL_UP: MascotMood.CELEBRATORY,
            MascotAction.CELEBRATE_BADGE: MascotMood.PROUD,
            MascotAction.REMIND_STREAK: MascotMood.MOTIVATIONAL,
            MascotAction.INTRODUCE_FEATURE: MascotMood.EXCITED,
            MascotAction.STUDY_TIP: MascotMood.THOUGHTFUL,
            MascotAction.DAILY_GREETING: MascotMood.HAPPY,
            MascotAction.ACHIEVEMENT_UNLOCK: MascotMood.CELEBRATORY,
            MascotAction.LEARNING_PATH_COMPLETE: MascotMood.PROUD,
            MascotAction.FIRST_QUESTION: MascotMood.ENCOURAGING,
            MascotAction.EMERGENCY_SOS_INTRO: MascotMood.CONCERNED
        }
        
        return mood_mapping.get(action, MascotMood.HAPPY)
    
    def get_context_aware_response(self, user_stats: Dict[str, Any], recent_activity: str) -> Dict[str, Any]:
        """Generate context-aware mascot responses based on user activity"""
        
        # Determine appropriate action based on recent activity
        if recent_activity == "level_up":
            action = MascotAction.CELEBRATE_LEVEL_UP
        elif recent_activity == "badge_earned":
            action = MascotAction.CELEBRATE_BADGE
        elif recent_activity == "streak_milestone":
            action = MascotAction.REMIND_STREAK
            context = {"streak_count": user_stats.get("daily_streak", 0)}
            return self.get_mascot_response(action, context=context)
        elif recent_activity == "first_login":
            action = MascotAction.WELCOME
        elif recent_activity == "daily_return":
            action = MascotAction.DAILY_GREETING
        elif recent_activity == "achievement_unlock":
            action = MascotAction.ACHIEVEMENT_UNLOCK
        elif recent_activity == "learning_path_complete":
            action = MascotAction.LEARNING_PATH_COMPLETE
        elif recent_activity == "first_question":
            action = MascotAction.FIRST_QUESTION
        elif recent_activity == "need_encouragement":
            action = MascotAction.ENCOURAGE
        else:
            action = MascotAction.DAILY_GREETING
        
        return self.get_mascot_response(action)
    
    def get_random_study_tip(self) -> Dict[str, Any]:
        """Get a random study tip from Juris"""
        return self.get_mascot_response(MascotAction.STUDY_TIP)
    
    def get_emergency_sos_introduction(self) -> Dict[str, Any]:
        """Get emergency SOS feature introduction"""
        return self.get_mascot_response(MascotAction.EMERGENCY_SOS_INTRO)

# Example usage and testing
if __name__ == "__main__":
    engine = MascotInteractionEngine()
    
    # Test different mascot responses
    print("Welcome message:", engine.get_mascot_response(MascotAction.WELCOME))
    print("Level up:", engine.get_mascot_response(MascotAction.CELEBRATE_LEVEL_UP))
    print("Study tip:", engine.get_random_study_tip())
    print("Emergency SOS:", engine.get_emergency_sos_introduction())