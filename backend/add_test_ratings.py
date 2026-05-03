#!/usr/bin/env python3
"""Add test ratings to Firestore for demo@cinesense.com"""
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# The demo user ID from Firebase - adjust this if different
DEMO_USER_ID = "k3jp1zMX9LfTeD87rM8f4LR1IMu2"

# Test ratings: movieId -> rating (1-5)
test_ratings = {
    "1": 5.0,      # Toy Story (1995)
    "2": 4.0,      # A Bug's Life
    "3": 4.5,      # Toy Story 2
    "6": 3.0,      # Heat
    "10": 5.0,     # GoldenEye
    "15": 4.0,     # Cutthroat Island
    "20": 3.5,     # Four Rooms
    "25": 4.5,     # Leaving Las Vegas
    "150": 4.0,    # Apollo 13
    "200": 5.0,    # Ghostbusters
}

print("=" * 60)
print("ADDING TEST RATINGS TO FIRESTORE")
print("=" * 60)
print(f"\n👤 User ID: {DEMO_USER_ID}")
print(f"📊 Adding {len(test_ratings)} test ratings\n")

try:
    user_ref = db.collection('users').document(DEMO_USER_ID)
    
    # Get current data
    user_doc = user_ref.get()
    current_data = user_doc.to_dict() or {}
    
    print(f"Current user data: {current_data}")
    
    # Update with test ratings
    current_data['ratings'] = test_ratings
    current_data['lastUpdated'] = datetime.now().isoformat()
    
    user_ref.set(current_data, merge=True)
    
    print("\n✅ Test ratings added successfully!")
    print("\n📋 Ratings added:")
    for movie_id, rating in sorted(test_ratings.items()):
        print(f"   Movie {movie_id}: ⭐ {rating}")
    
    print("\n🔄 Next steps:")
    print("   1. Trigger sync manually:")
    print("      curl -X POST http://localhost:8000/api/recommendations/sync-firestore")
    print("   2. Check backend logs for sync result")
    print("   3. Check dashboard for personalized recommendations")
    
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
