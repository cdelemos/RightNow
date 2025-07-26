#!/usr/bin/env python3
"""
Test script to check myth database initialization
"""

import asyncio
import os
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

async def test_myth_initialization():
    # Connect to database
    mongo_url = os.environ['MONGO_URL'] 
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Checking current myth count in database...")
    
    # Check current myth count
    myth_count = await db.legal_myths.count_documents({})
    print(f"Current myths in database: {myth_count}")
    
    # Check script templates count
    script_count = await db.script_templates.count_documents({})
    print(f"Current script templates in database: {script_count}")
    
    # If no myths, try to initialize
    if myth_count == 0:
        print("🚀 No myths found, attempting to initialize...")
        
        try:
            # Import the initialization function
            from server import initialize_legal_myths
            await initialize_legal_myths()
            
            # Check count again
            new_myth_count = await db.legal_myths.count_documents({})
            print(f"✅ Myths after initialization: {new_myth_count}")
            
        except Exception as e:
            print(f"❌ Error during initialization: {e}")
            import traceback
            traceback.print_exc()
    
    # If no scripts, try to initialize
    if script_count == 0:
        print("🚀 No script templates found, attempting to initialize...")
        
        try:
            # Import the initialization function
            from server import initialize_script_templates
            await initialize_script_templates()
            
            # Check count again
            new_script_count = await db.script_templates.count_documents({})
            print(f"✅ Script templates after initialization: {new_script_count}")
            
        except Exception as e:
            print(f"❌ Error during script initialization: {e}")
            import traceback
            traceback.print_exc()
    
    # Show some sample myths
    if myth_count > 0 or await db.legal_myths.count_documents({}) > 0:
        print("\n📚 Sample myths in database:")
        myths = await db.legal_myths.find({}).limit(3).to_list(3)
        for i, myth in enumerate(myths, 1):
            print(f"{i}. {myth.get('title', 'No title')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_myth_initialization())