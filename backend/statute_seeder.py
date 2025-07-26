"""
Database seeder for legal statutes
Populates the database with sample statute data
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from statute_data import SAMPLE_STATUTES
from models import LegalStatute
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_statutes():
    """Seed the database with sample statute data"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding statute database...")
    
    # Clear existing statutes (optional - remove in production)
    await db.legal_statutes.delete_many({})
    print("🗑️ Cleared existing statutes")
    
    # Insert sample statutes
    statutes_added = 0
    for statute_data in SAMPLE_STATUTES:
        # Create LegalStatute object to validate data
        statute = LegalStatute(**statute_data)
        
        # Insert into database
        await db.legal_statutes.insert_one(statute.dict())
        statutes_added += 1
        print(f"✅ Added: {statute.title}")
    
    print(f"🎉 Successfully seeded {statutes_added} statutes!")
    
    # Create indexes for better search performance
    await db.legal_statutes.create_index("title")
    await db.legal_statutes.create_index("state")
    await db.legal_statutes.create_index("category")
    await db.legal_statutes.create_index("keywords")
    print("📝 Created search indexes")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_statutes())