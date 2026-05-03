"""
Firestore Rating Sync
=====================

Syncs user ratings from Firebase Firestore to the recommendation engine.

This enables new Firebase users to get personalized recommendations immediately
after they rate movies, without needing to manually add them to the engine.

Functions:
----------
sync_firestore_ratings()
    Load all user ratings from Firestore and update engine

Classes:
--------
FirestoreRatingSync
    Manages periodic sync of Firestore ratings to recommendation engine
"""

import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import logging
from typing import Dict, List
import threading
import time
from datetime import datetime

logger = logging.getLogger(__name__)

# Reference to global engine (will be set by main.py)
recommendation_engine = None


def get_firestore_client():
    """Initialize and return Firestore client"""
    try:
        # Check if Firebase is already initialized
        firebase_admin.get_app()
    except ValueError:
        # Initialize Firebase if not already done
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    
    return firestore.client()


def load_firestore_ratings() -> pd.DataFrame:
    """
    LOAD USER RATINGS FROM FIRESTORE
    ================================
    
    What: Fetch all user ratings stored in Firestore and convert to DataFrame
    
    Firestore Structure:
    --------------------
    users/{userId}
      ├── displayName: "John Doe"
      ├── ratings: {
      │     "858": 5,
      │     "1200": 4,
      │     "122": 3.5
      │   }
      └── email: "john@example.com"
    
    Example:
    --------
    users/user_abc123
      └── ratings: {"858": 5, "1200": 4}
    
    Returns:
    --------
    pd.DataFrame with columns: userId, movieId, rating
    
    Example:
    --------
         userId  movieId  rating
    0    user_abc123    858      5
    1    user_abc123   1200      4
    2    user_def456    858      3
    """
    logger.info("📥 Loading ratings from Firestore...")
    
    try:
        db = get_firestore_client()
        
        # Fetch all users
        users_ref = db.collection('users')
        users_docs = users_ref.stream()
        
        ratings_list = []
        user_count = 0
        
        for user_doc in users_docs:
            user_id = user_doc.id
            user_data = user_doc.to_dict()
            user_count += 1
            
            # Get ratings from user profile (stored as a field, not subcollection)
            if user_data and 'ratings' in user_data:
                ratings_dict = user_data['ratings']
                
                # ratings_dict is a map like {"858": 5, "1200": 4}
                if isinstance(ratings_dict, dict):
                    for movie_id_str, rating_value in ratings_dict.items():
                        try:
                            movie_id = int(movie_id_str)
                            if isinstance(rating_value, (int, float)) and 0 < rating_value <= 5:
                                ratings_list.append({
                                    'userId': user_id,
                                    'movieId': movie_id,
                                    'rating': float(rating_value)
                                })
                        except (ValueError, TypeError):
                            # Skip invalid entries
                            continue
        
        logger.info(f"   ✓ Loaded {len(ratings_list)} ratings from {user_count} Firebase users")
        
        # Convert to DataFrame
        if ratings_list:
            df = pd.DataFrame(ratings_list)
            return df
        else:
            logger.warning("   ⚠️  No ratings found in Firestore")
            return pd.DataFrame(columns=['userId', 'movieId', 'rating'])
        
    except Exception as e:
        logger.error(f"   ❌ Error loading Firestore ratings: {str(e)}")
        return pd.DataFrame(columns=['userId', 'movieId', 'rating'])


def sync_firestore_ratings(engine) -> Dict:
    """
    SYNC FIRESTORE RATINGS TO ENGINE
    ================================
    
    What: Update recommendation engine with new Firebase user ratings
    
    Process:
    --------
    1. Load all ratings from Firestore
    2. Combine with existing MovieLens ratings
    3. Add new users to recommendation engine
    4. Retrain affected similarity matrices
    
    Parameters:
    -----------
    engine : RecommendationEngine
        The recommendation engine to update
    
    Returns:
    --------
    Dict with sync statistics:
    {
        'success': bool,
        'new_users': int,
        'total_ratings': int,
        'timestamp': str
    }
    
    Example:
    --------
    result = sync_firestore_ratings(recommendation_engine)
    >>> {
    >>>     'success': True,
    >>>     'new_users': 3,
    >>>     'total_ratings': 100856,
    >>>     'timestamp': '2026-05-03T14:30:00'
    >>> }
    """
    logger.info("🔄 Starting Firestore ratings sync...")
    
    try:
        # Step 1: Load Firebase ratings
        firebase_ratings = load_firestore_ratings()
        
        if firebase_ratings.empty:
            logger.info("   ℹ️  No new Firebase ratings to sync")
            return {
                'success': True,
                'new_users': 0,
                'total_ratings': len(engine.ratings_df),
                'timestamp': datetime.now().isoformat()
            }
        
        # Step 2: Combine with existing ratings
        combined_ratings = pd.concat([
            engine.ratings_df,
            firebase_ratings
        ], ignore_index=True)
        
        # Remove duplicates (keep Firebase versions if duplicate movieId)
        combined_ratings = combined_ratings.drop_duplicates(
            subset=['userId', 'movieId'],
            keep='last'
        )
        
        # Step 3: Identify new users
        old_users = set(engine.ratings_df['userId'].unique())
        new_users = set(firebase_ratings['userId'].unique())
        newly_added_users = new_users - old_users
        
        logger.info(f"   ✓ Combined ratings: {len(combined_ratings)} total")
        logger.info(f"   ✓ New Firebase users: {len(newly_added_users)}")
        
        # Step 4: Update engine
        if len(newly_added_users) > 0:
            logger.info("🔄 Updating recommendation engine...")
            engine.add_firestore_users(combined_ratings, firebase_ratings)
            logger.info("   ✓ Engine updated with new users")
        
        return {
            'success': True,
            'new_users': len(newly_added_users),
            'total_ratings': len(combined_ratings),
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"   ❌ Sync error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


class FirestoreRatingSync:
    """
    Background thread that periodically syncs Firestore ratings to engine.
    
    This allows the recommendation engine to stay up-to-date with new
    Firebase user ratings without manual intervention.
    
    Usage:
    ------
    sync_thread = FirestoreRatingSync(
        recommendation_engine,
        sync_interval=300  # Sync every 5 minutes
    )
    sync_thread.start()
    
    # Later...
    sync_thread.stop()
    """
    
    def __init__(self, engine, sync_interval: int = 300):
        """
        Initialize sync thread
        
        Parameters:
        -----------
        engine : RecommendationEngine
            Engine to keep updated
        sync_interval : int
            Seconds between syncs (default: 300 = 5 minutes)
        """
        self.engine = engine
        self.sync_interval = sync_interval
        self.running = False
        self.thread = None
        
        logger.info(f"📍 FirestoreRatingSync configured (interval: {sync_interval}s)")
    
    
    def start(self):
        """Start the sync thread"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._sync_loop, daemon=True)
            self.thread.start()
            logger.info("✅ Firestore sync thread started")
    
    
    def stop(self):
        """Stop the sync thread"""
        self.running = False
        if self.thread:
            self.thread.join()
        logger.info("⏹️  Firestore sync thread stopped")
    
    
    def _sync_loop(self):
        """Background loop that syncs periodically"""
        while self.running:
            try:
                result = sync_firestore_ratings(self.engine)
                
                if result.get('success'):
                    if result.get('new_users', 0) > 0:
                        logger.info(f"✅ Sync complete: {result['new_users']} new Firebase users added")
                    # Only log every Nth sync to avoid spam
                    if int(time.time()) % (self.sync_interval * 5) == 0:
                        logger.debug(f"   ℹ️  Next sync in {self.sync_interval}s...")
                
                # Wait for next sync interval
                time.sleep(self.sync_interval)
                
            except Exception as e:
                logger.error(f"   ❌ Sync loop error: {str(e)}")
                time.sleep(self.sync_interval)
