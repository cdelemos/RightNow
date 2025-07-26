#!/usr/bin/env python3
"""
Fix myth initialization by clearing and re-creating with proper status
"""

import asyncio
import os
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

# Load environment
ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

async def fix_myth_initialization():
    # Connect to database
    mongo_url = os.environ['MONGO_URL'] 
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🧹 Clearing existing myths...")
    
    # Clear existing myths
    result = await db.legal_myths.delete_many({})
    print(f"Deleted {result.deleted_count} existing myths")
    
    print("🚀 Creating new myths with proper status...")
    
    # Import models
    from models import LegalMyth, LegalMythStatus
    
    legal_myths_data = [
        {
            "title": "Police Must Read Miranda Rights During Any Arrest",
            "myth_statement": "Police are required to read you your Miranda rights as soon as they arrest you.",
            "fact_explanation": "Miranda rights only need to be read if police plan to conduct a custodial interrogation. If they don't question you, they don't need to read your rights. However, you still have the right to remain silent regardless.",
            "category": "criminal_law",
            "difficulty_level": 2,
            "sources": ["Miranda v. Arizona (1966)", "Supreme Court Decisions"],
            "tags": ["miranda", "arrest", "police", "rights"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "You Can't Be Arrested for Not Carrying ID",
            "myth_statement": "It's illegal to not carry identification, and you can be arrested for it.",
            "fact_explanation": "In most states, you're not required to carry ID unless you're driving. However, some 'stop and identify' states require you to provide your name if lawfully detained. You generally cannot be arrested solely for not having ID.",
            "category": "civil_rights",
            "difficulty_level": 3,
            "sources": ["Stop and Identify Laws", "4th Amendment"],
            "tags": ["id", "identification", "arrest", "stop and identify"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "Landlords Can Enter Your Apartment Anytime",
            "myth_statement": "Since landlords own the property, they can enter your rental unit whenever they want.",
            "fact_explanation": "Landlords must provide proper notice (usually 24-48 hours) and have a valid reason to enter your rental unit. Emergency situations are an exception. Tenant privacy rights are protected by law.",
            "category": "housing",
            "difficulty_level": 1,
            "sources": ["State Landlord-Tenant Laws", "Fair Housing Act"],
            "tags": ["landlord", "tenant", "privacy", "rental"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "You Must Answer Police Questions",
            "myth_statement": "If police ask you questions, you are legally required to answer them.",
            "fact_explanation": "You have the 5th Amendment right to remain silent. You're only required to identify yourself in 'stop and identify' states if lawfully detained. Beyond that, you can politely decline to answer questions.",
            "category": "civil_rights",
            "difficulty_level": 2,
            "sources": ["5th Amendment", "Terry v. Ohio"],
            "tags": ["police", "questioning", "5th amendment", "silence"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "Verbal Contracts Aren't Legally Binding",
            "myth_statement": "Only written contracts are legally enforceable - verbal agreements don't count.",
            "fact_explanation": "Verbal contracts can be legally binding, but they're harder to prove in court. Some contracts (like real estate transactions) must be in writing under the Statute of Frauds, but many verbal agreements are enforceable.",
            "category": "contracts",
            "difficulty_level": 3,
            "sources": ["Contract Law", "Statute of Frauds"],
            "tags": ["contracts", "verbal", "written", "binding"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "If You're Injured, You Can Always Sue",
            "myth_statement": "Anyone who gets injured can file a lawsuit and win compensation.",
            "fact_explanation": "To win a personal injury case, you must prove negligence, causation, and damages. Not all injuries result from someone else's fault. There are also statutes of limitations that limit when you can file a lawsuit.",
            "category": "torts",
            "difficulty_level": 2,
            "sources": ["Tort Law", "Negligence Standards"],
            "tags": ["personal injury", "lawsuit", "negligence", "damages"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "You Can't Be Fired Without Cause",
            "myth_statement": "Employers need a good reason to fire employees, and wrongful termination is always illegal.",
            "fact_explanation": "Most employment is 'at-will,' meaning you can be fired for any reason or no reason (except illegal discrimination). Only employees with contracts or in certain protected situations have additional job security.",
            "category": "employment",
            "difficulty_level": 2,
            "sources": ["At-Will Employment Laws", "Title VII"],
            "tags": ["employment", "firing", "at-will", "wrongful termination"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "Public School Students Have No Rights",
            "myth_statement": "Students lose all their constitutional rights when they enter school property.",
            "fact_explanation": "Students don't 'shed their constitutional rights at the schoolhouse gate.' However, schools can impose reasonable restrictions for educational purposes and safety. Students have reduced, but not eliminated, rights.",
            "category": "education",
            "difficulty_level": 3,
            "sources": ["Tinker v. Des Moines", "Student Rights Cases"],
            "tags": ["student rights", "education", "schools", "constitution"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "Speed Limits Are Just Suggestions",
            "myth_statement": "As long as you're driving safely, speed limits don't really matter.",
            "fact_explanation": "Speed limits are legally enforceable. While some states have 'absolute' vs 'prima facie' speed limit laws, exceeding posted limits can result in tickets and liability in accidents. Safe driving includes following speed limits.",
            "category": "traffic",
            "difficulty_level": 1,
            "sources": ["State Traffic Laws", "Vehicle Codes"],
            "tags": ["speed limits", "traffic", "driving", "tickets"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "title": "Credit Reports Can't Affect Employment",
            "myth_statement": "Employers can't check your credit report or use it in hiring decisions.",
            "fact_explanation": "Employers can check credit reports for many positions with your written consent. This is especially common for financial roles or positions requiring security clearances. However, some states have restrictions on credit check usage.",
            "category": "employment",
            "difficulty_level": 2,
            "sources": ["Fair Credit Reporting Act", "State Employment Laws"],
            "tags": ["credit report", "employment", "hiring", "background check"],
            "status": LegalMythStatus.PUBLISHED,
            "published_at": datetime.utcnow(),
            "created_by": "system"
        }
    ]
    
    # Create legal myths with proper status
    legal_myths = []
    for myth_data in legal_myths_data:
        myth = LegalMyth(**myth_data)
        legal_myths.append(myth)
    
    await db.legal_myths.insert_many([myth.dict() for myth in legal_myths])
    
    print(f"✅ Created {len(legal_myths)} legal myths")
    
    # Verify the myths are properly created
    published_count = await db.legal_myths.count_documents({"status": "published"})
    print(f"✅ Verified: {published_count} published myths in database")
    
    # Show sample titles
    sample_myths = await db.legal_myths.find({"status": "published"}).limit(5).to_list(5)
    print("\n📚 Sample myth titles:")
    for i, myth in enumerate(sample_myths, 1):
        print(f"{i}. {myth['title']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_myth_initialization())