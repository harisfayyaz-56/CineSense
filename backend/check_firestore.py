#!/usr/bin/env python3
"""Check what's actually in Firestore for the demo user"""
import firebase_admin
from firebase_admin import credentials, firestore
import json

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("=" * 60)
print("CHECKING FIRESTORE USERS COLLECTION")
print("=" * 60)

# Get all users
users_ref = db.collection('users')
users_docs = users_ref.stream()

for user_doc in users_docs:
    user_data = user_doc.to_dict()
    print(f"\n📦 User ID: {user_doc.id}")
    print(f"   Email: {user_data.get('email', 'N/A')}")
    print(f"   Display Name: {user_data.get('displayName', 'N/A')}")
    print(f"   Email Verified: {user_data.get('emailVerified', False)}")
    
    # Check if ratings field exists
    if 'ratings' in user_data:
        ratings = user_data['ratings']
        print(f"   Ratings Field Type: {type(ratings)}")
        print(f"   Number of Ratings: {len(ratings) if isinstance(ratings, dict) else 'N/A'}")
        
        if isinstance(ratings, dict):
            # Show first 5 ratings
            for i, (movie_id, rating) in enumerate(list(ratings.items())[:5]):
                print(f"      - Movie {movie_id}: {rating}")
            if len(ratings) > 5:
                print(f"      ... and {len(ratings) - 5} more")
    else:
        print("   ❌ No ratings field found")

print("\n" + "=" * 60)
print("END FIRESTORE CHECK")
print("=" * 60)
