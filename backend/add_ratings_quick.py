#!/usr/bin/env python3
"""Add test ratings directly without reading first"""
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

DEMO_USER_ID = "k3jp1zMX9LfTeD87rM8f4LR1IMu2"

# Test ratings
test_ratings = {
    "1": 5.0, "2": 4.0, "3": 4.5, "6": 3.0, "10": 5.0,
    "15": 4.0, "20": 3.5, "25": 4.5, "150": 4.0, "200": 5.0,
}

print("Adding ratings (minimal quota usage)...")

try:
    # Direct update without reading first
    user_ref = db.collection('users').document(DEMO_USER_ID)
    user_ref.update({'ratings': test_ratings})
    print("✅ Ratings added!")
    
except Exception as e:
    print(f"❌ Error: {e}")
