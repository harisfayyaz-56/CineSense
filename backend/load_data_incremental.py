"""
Incremental Data Loader - More Robust
=====================================
Loads movies in smaller batches with better error handling.
Run multiple times if needed - it's idempotent.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
import json
from tqdm import tqdm
import ast

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
BACKEND_DIR = Path(__file__).parent
PROCESSED_DIR = BACKEND_DIR / "data" / "processed"
SERVICE_ACCOUNT_PATH = BACKEND_DIR / "serviceAccountKey.json"

def initialize_firebase():
    """Initialize Firebase connection"""
    logger.info("🔐 Initializing Firebase connection...")
    
    try:
        if not Path(SERVICE_ACCOUNT_PATH).exists():
            logger.error(f"❌ Service account key not found: {SERVICE_ACCOUNT_PATH}")
            raise FileNotFoundError(f"Service account key not found at {SERVICE_ACCOUNT_PATH}")
        
        cred = credentials.Certificate(str(SERVICE_ACCOUNT_PATH))
        
        # Check if app already initialized
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        logger.info("✅ Firebase connection established")
        return db
        
    except Exception as e:
        logger.error(f"❌ Firebase initialization failed: {str(e)}")
        raise

def load_movies_incremental(batch_size=100):
    """
    Load movies in smaller batches to avoid timeout
    
    Args:
        batch_size (int): Number of documents per Firestore batch
    """
    db = initialize_firebase()
    
    csv_path = PROCESSED_DIR / "movies_processed.csv"
    logger.info(f"📖 Loading movies from {csv_path}...")
    
    # Read CSV
    df = pd.read_csv(csv_path)
    logger.info(f"   Total movies to load: {len(df)}")
    
    # Prepare documents
    documents = []
    for idx, row in df.iterrows():
        doc = {
            'movieId': int(row['movieId']),
            'title': str(row['title']),
            'year': int(row['year']) if pd.notna(row['year']) else 0,
            'genres': ast.literal_eval(row['genres']) if isinstance(row['genres'], str) else (row['genres'].split('|') if pd.notna(row['genres']) else []),
            'imdbId': str(row['imdbId']) if pd.notna(row['imdbId']) else '',
            'tmdbId': int(row['tmdbId']) if pd.notna(row['tmdbId']) else 0,
            'avgRating': float(row['avgRating']) if pd.notna(row['avgRating']) else 0.0,
            'ratingCount': int(row['ratingCount']) if pd.notna(row['ratingCount']) else 0,
            'popularity': float(row['popularity']) if pd.notna(row['popularity']) else 0.0,
            'tags': ast.literal_eval(row['tags']) if isinstance(row['tags'], str) else (list(row['tags']) if pd.notna(row['tags']) else []),
            'createdAt': datetime.now(),
            'lastUpdated': datetime.now()
        }
        documents.append(doc)
    
    # Load in smaller batches
    FIRESTORE_BATCH_SIZE = 500  # Firestore limit
    
    logger.info(f"📝 Writing {len(documents)} movies to Firestore in batches of {batch_size}...")
    
    for chunk_start in tqdm(range(0, len(documents), batch_size), desc="Loading batches"):
        chunk_end = min(chunk_start + batch_size, len(documents))
        chunk = documents[chunk_start:chunk_end]
        
        # Write this chunk
        for firestore_batch_start in range(0, len(chunk), FIRESTORE_BATCH_SIZE):
            firestore_batch_end = min(firestore_batch_start + FIRESTORE_BATCH_SIZE, len(chunk))
            batch_docs = chunk[firestore_batch_start:firestore_batch_end]
            
            batch = db.batch()
            for doc in batch_docs:
                movie_id = doc['movieId']
                ref = db.collection('movies').document(str(movie_id))
                batch.set(ref, doc)
            
            try:
                batch.commit()
            except Exception as e:
                logger.error(f"   ❌ Batch commit failed: {str(e)}")
                logger.info("   Retrying this batch...")
                batch.commit()  # Retry once
    
    logger.info(f"✅ All {len(documents)} movies loaded successfully")

def verify_movies_loaded():
    """Verify movies were loaded into Firestore"""
    db = initialize_firebase()
    
    logger.info("🔍 Verifying movies in Firestore...")
    movies_ref = db.collection('movies')
    
    # Count documents
    count = 0
    for _ in movies_ref.stream():
        count += 1
        if count % 1000 == 0:
            logger.info(f"   Found {count} movies so far...")
    
    logger.info(f"✅ Total movies in Firestore: {count}")
    
    if count > 0:
        # Show sample
        sample_docs = movies_ref.limit(3).stream()
        logger.info("   Sample movies:")
        for doc in sample_docs:
            data = doc.data()
            logger.info(f"   - {data.get('title')} (Rating: {data.get('avgRating')})")
    
    return count

if __name__ == "__main__":
    try:
        logger.info("=" * 60)
        logger.info("🚀 INCREMENTAL DATA LOADING STARTED")
        logger.info("=" * 60)
        
        # Load movies
        load_movies_incremental(batch_size=200)
        
        # Verify
        total = verify_movies_loaded()
        
        logger.info("=" * 60)
        logger.info("✅ LOADING COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)
        
        if total == 0:
            logger.warning("⚠️ No movies loaded! Check Firestore permissions.")
        
    except Exception as e:
        logger.error("=" * 60)
        logger.error(f"❌ LOADING FAILED: {str(e)}")
        logger.error("=" * 60)
        import traceback
        traceback.print_exc()
        exit(1)
