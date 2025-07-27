# Mascot System for RightNow Legal Education Platform
# The mascot "Gavvy the Gavel" represents protection, clarity, and legal empowerment

from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime
import random

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

class MascotPersonality:
    """Gavvy the Gavel - The protective legal guardian"""
    
    NAME = "Gavvy"
    SPECIES = "Gavel"
    PERSONALITY_TRAITS = [
        "Protective", "Clear", "Empowering", "Serious", 
        "Focused", "Vigilant", "Supportive", "Professional"
    ]
    
    # Mascot appearance configurations
    APPEARANCES = {
        MascotMood.PROTECTIVE: {
            "emoji": "⚖️",
            "expression": "🛡️",
            "color": "#2B4C7E",
            "animation": "steady"
        },
        MascotMood.CLEAR: {
            "emoji": "⚖️",
            "expression": "💡",
            "color": "#4A90E2",
            "animation": "focus"
        },
        MascotMood.EMPOWERING: {
            "emoji": "⚖️",
            "expression": "💪",
            "color": "#2E7D32",
            "animation": "strength"
        },
        MascotMood.SERIOUS: {
            "emoji": "⚖️",
            "expression": "⚠️",
            "color": "#D32F2F",
            "animation": "alert"
        },
        MascotMood.FOCUSED: {
            "emoji": "⚖️",
            "expression": "🎯",
            "color": "#7B1FA2",
            "animation": "precision"
        },
        MascotMood.ALERT: {
            "emoji": "⚖️",
            "expression": "🚨",
            "color": "#FF5722",
            "animation": "urgent"
        },
        MascotMood.SUPPORTIVE: {
            "emoji": "⚖️",
            "expression": "🤝",
            "color": "#00796B",
            "animation": "gentle"
        },
        MascotMood.VIGILANT: {
            "emoji": "⚖️",
            "expression": "👁️",
            "color": "#5D4037",
            "animation": "watchful"
        }
    }

class MascotMessageBank:
    """Comprehensive message bank for Gavvy the Gavel"""
    
    MESSAGES = {
        MascotAction.WELCOME: {
            MascotMood.PROTECTIVE: [
                "Welcome to RightNow Legal Education. I'm Gavvy, your legal protection guide. Knowledge is your strongest defense.",
                "I'm here to help you understand your rights and protections. Legal knowledge empowers you to navigate challenging situations.",
                "Your legal education starts here. I'll guide you through the essential protections you need to know."
            ],
            MascotMood.EMPOWERING: [
                "Every right you learn makes you stronger. I'm here to ensure you're prepared for what matters most.",
                "Legal knowledge is power. Together, we'll build your understanding of the protections available to you."
            ]
        },
        
        MascotAction.LESSON_COMPLETE: {
            MascotMood.EMPOWERING: [
                "Well done. You've gained important knowledge that could protect you in real situations.",
                "Another layer of protection learned. This knowledge strengthens your legal position.",
                "You're building the legal awareness that matters. Keep developing these critical skills."
            ],
            MascotMood.FOCUSED: [
                "Lesson completed. You now understand a key aspect of your legal protections.",
                "This knowledge equips you for real-world situations. Stay focused on learning what protects you."
            ]
        },
        
        MascotAction.INCORRECT_ANSWER: {
            MascotMood.CLEAR: [
                "Let's clarify this. Understanding the correct information is crucial for your protection.",
                "This is important to get right. Misunderstanding legal concepts can put you at risk.",
                "Take a moment to review. Accurate legal knowledge is essential for your safety."
            ],
            MascotMood.SERIOUS: [
                "This requires careful attention. Legal mistakes can have serious consequences.",
                "Let's ensure you understand this correctly. Your protection depends on accurate knowledge."
            ]
        },
        
        MascotAction.EMERGENCY_SITUATION: {
            MascotMood.ALERT: [
                "Emergency mode activated. Access your critical rights immediately.",
                "This is urgent. I'm here to help you understand your immediate protections.",
                "Emergency legal guidance is now available. Know your rights in this critical moment."
            ],
            MascotMood.PROTECTIVE: [
                "Stay calm. You have rights that protect you. I'll guide you through what you need to know.",
                "In emergencies, knowing your rights is crucial. Let me help you understand your protections."
            ]
        },
        
        MascotAction.RIGHTS_UNLOCKED: {
            MascotMood.EMPOWERING: [
                "New protection unlocked. You now understand a critical right that could protect you.",
                "This knowledge milestone reveals important legal protections in your area.",
                "You've earned access to essential legal information. This empowers you in real situations."
            ],
            MascotMood.FOCUSED: [
                "Protection knowledge gained. You're building the legal awareness needed for real-world challenges.",
                "This unlocked right provides you with specific protections. Understanding this strengthens your position."
            ]
        },
        
        MascotAction.TUTORIAL_INTRO: {
            MascotMood.CLEAR: [
                "I'll guide you through this feature. Clear understanding leads to better protection.",
                "Let me explain how this works. Each tool here serves to protect your rights.",
                "This tutorial ensures you can effectively use these legal protections."
            ],
            MascotMood.FOCUSED: [
                "Pay attention to these details. Knowing how to use these tools could be critical.",
                "I'm here to ensure you understand exactly how this feature protects you."
            ]
        },
        
        MascotAction.CONTEXTUAL_TOOLTIP: {
            MascotMood.CLEAR: [
                "Key point: {context}. This information is important for your protection.",
                "Remember: {context}. This could be crucial in a real situation.",
                "Legal insight: {context}. Understanding this strengthens your legal position."
            ],
            MascotMood.VIGILANT: [
                "Stay aware: {context}. This knowledge helps you recognize important legal moments.",
                "Critical detail: {context}. This understanding could make the difference."
            ]
        },
        
        MascotAction.PROTECTION_REMINDER: {
            MascotMood.PROTECTIVE: [
                "Remember: You have rights that protect you. I'm here to help you understand them.",
                "Your legal protections are real and enforceable. Stay informed about what shields you.",
                "Legal knowledge is your shield. Continue learning about your protections."
            ],
            MascotMood.VIGILANT: [
                "Stay vigilant about your rights. Knowing them is the first step to protection.",
                "Your legal protections require awareness to be effective. Keep learning."
            ]
        },
        
        MascotAction.CLARITY_EXPLANATION: {
            MascotMood.CLEAR: [
                "Let me clarify this legal concept. Understanding is essential for your protection.",
                "Here's what this means in practical terms. Clear comprehension keeps you safe.",
                "This legal principle works like this: {explanation}. Clarity empowers you."
            ],
            MascotMood.FOCUSED: [
                "Focus on this key point: {explanation}. This understanding is crucial.",
                "Pay attention to this detail: {explanation}. It could be vital in real situations."
            ]
        },
        
        MascotAction.UPL_WARNING: {
            MascotMood.SERIOUS: [
                "⚠️ Important: This app provides general legal information only. For personal legal advice, consult a licensed attorney.",
                "⚠️ Legal Notice: I cannot provide advice for your specific situation. Please seek professional legal counsel.",
                "⚠️ Reminder: This is educational content, not legal advice. Consult an attorney for personal legal matters."
            ],
            MascotMood.ALERT: [
                "⚠️ Stop: This question requires professional legal advice. Please consult with a licensed attorney.",
                "⚠️ Warning: I cannot advise on specific legal cases. Seek immediate legal counsel if needed."
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
        appearance = self.personality.APPEARANCES.get(mood, self.personality.APPEARANCES[MascotMood.PROTECTIVE])
        
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
            messages = ["I'm Gavvy, your legal protection guide. Knowledge is your strongest defense."]
        
        # Select message (not random for consistency)
        message = messages[0]  # Use first message for consistency
        
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
            MascotAction.WELCOME: MascotMood.PROTECTIVE,
            MascotAction.LESSON_COMPLETE: MascotMood.EMPOWERING,
            MascotAction.INCORRECT_ANSWER: MascotMood.CLEAR,
            MascotAction.EMERGENCY_SITUATION: MascotMood.ALERT,
            MascotAction.RIGHTS_UNLOCKED: MascotMood.EMPOWERING,
            MascotAction.TUTORIAL_INTRO: MascotMood.CLEAR,
            MascotAction.CONTEXTUAL_TOOLTIP: MascotMood.CLEAR,
            MascotAction.PROTECTION_REMINDER: MascotMood.PROTECTIVE,
            MascotAction.CLARITY_EXPLANATION: MascotMood.CLEAR,
            MascotAction.UPL_WARNING: MascotMood.SERIOUS
        }
        
        return mood_mapping.get(action, MascotMood.PROTECTIVE)
    
    def get_tutorial_introduction(self, feature_name: str) -> Dict[str, Any]:
        """Get tutorial introduction for a specific feature"""
        return self.get_mascot_response(
            MascotAction.TUTORIAL_INTRO,
            context={"feature": feature_name}
        )
    
    def get_contextual_tooltip(self, tooltip_context: str) -> Dict[str, Any]:
        """Get contextual tooltip with legal insight"""
        return self.get_mascot_response(
            MascotAction.CONTEXTUAL_TOOLTIP,
            context={"context": tooltip_context}
        )
    
    def get_upl_warning(self, query_type: str = "general") -> Dict[str, Any]:
        """Get UPL (Unauthorized Practice of Law) warning"""
        mood = MascotMood.ALERT if query_type == "specific_case" else MascotMood.SERIOUS
        return self.get_mascot_response(MascotAction.UPL_WARNING, mood=mood)
    
    def get_emergency_guidance(self) -> Dict[str, Any]:
        """Get emergency situation guidance"""
        return self.get_mascot_response(MascotAction.EMERGENCY_SITUATION)
    
    def get_rights_unlock_celebration(self, right_name: str, region: str = None) -> Dict[str, Any]:
        """Get celebration for unlocked rights"""
        context = {"right": right_name}
        if region:
            context["region"] = region
        return self.get_mascot_response(MascotAction.RIGHTS_UNLOCKED, context=context)

# Example usage and testing
if __name__ == "__main__":
    engine = MascotInteractionEngine()
    
    # Test different mascot responses
    print("Welcome message:", engine.get_mascot_response(MascotAction.WELCOME))
    print("Lesson complete:", engine.get_mascot_response(MascotAction.LESSON_COMPLETE))
    print("UPL warning:", engine.get_upl_warning())
    print("Emergency guidance:", engine.get_emergency_guidance())