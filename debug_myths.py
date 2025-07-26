#!/usr/bin/env python3
"""
Debug script to check myth status and retrieval
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

async def debug_myths():
    # Connect to database
    mongo_url = os.environ['MONGO_URL'] 
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔍 Debugging myth retrieval...")
    
    # Check all myths
    all_myths = await db.legal_myths.find({}).to_list(100)
    print(f"Total myths in database: {len(all_myths)}")
    
    # Check published myths
    published_myths = await db.legal_myths.find({"status": "published"}).to_list(100)
    print(f"Published myths: {len(published_myths)}")
    
    # Check myth statuses
    statuses = {}
    for myth in all_myths:
        status = myth.get("status", "unknown")
        statuses[status] = statuses.get(status, 0) + 1
    
    print(f"Myth statuses: {statuses}")
    
    # Show all myth titles and statuses
    print("\n📚 All myths in database:")
    for i, myth in enumerate(all_myths, 1):
        title = myth.get('title', 'No title')
        status = myth.get('status', 'No status')
        print(f"{i}. {title[:60]}... (status: {status})")
    
    # Test the API query that's failing
    from models import LegalMythStatus
    query = {"status": LegalMythStatus.PUBLISHED.value}
    print(f"\nQuery being used: {query}")
    
    api_myths = await db.legal_myths.find(query).to_list(100)
    print(f"Myths matching API query: {len(api_myths)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_myths())