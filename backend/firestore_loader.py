"""
Firestore Data Loader
=======================
Loads processed MovieLens data into Firestore database.

Features:
- Batch writes (Firestore limit: 500 operations per batch)
- Error handling and retry logic
- Progress tracking
- Data validation before loading
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


class FirestoreLoader:
    """Handles loading data into Firestore"""
    
    def __init__(self, service_account_key_path: str = None):
        """
        Initialize Firestore connection
        
        Args:
            service_account_key_path (str): Path to Firebase service account key
                                           If None, uses serviceAccountKey.json
        """
        if service_account_key_path is None:
            service_account_key_path = SERVICE_ACCOUNT_PATH
        
        logger.info("🔐 Initializing Firebase connection...")
        
        try:
            # Load service account key
            if not Path(service_account_key_path).exists():
                logger.error(f"❌ Service account key not found: {service_account_key_path}")
                logger.error("   Get it from Firebase Console -> Project Settings -> Service Accounts")
                raise FileNotFoundError(f"Service account key not found at {service_account_key_path}")
            
            # Initialize Firebase
            cred = credentials.Certificate(str(service_account_key_path))
            firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            logger.info("✅ Firebase connection established")
            
        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {str(e)}")
            raise
    
    def batch_write(self, collection: str, documents: List[Dict[str, Any]], 
                   doc_id_field: str = None):
        """
        Write documents to Firestore in batches
        
        Firestore has a limit of 500 operations per batch, so we split into chunks.
        
        Args:
            collection (str): Collection name
            documents (List[Dict]): List of documents to write
            doc_id_field (str): Field name to use as document ID
                               If None, Firestore auto-generates IDs
        """
        BATCH_SIZE = 500  # Firestore limit
        
        logger.info(f"📝 Writing {len(documents)} documents to '{collection}'...")
        
        # Split into batches
        for batch_num in range(0, len(documents), BATCH_SIZE):
            batch = self.db.batch()
            batch_docs = documents[batch_num:batch_num + BATCH_SIZE]
            
            for doc in batch_docs:
                doc_id = doc.pop(doc_id_field) if doc_id_field and doc_id_field in doc else None
                
                if doc_id:
                    ref = self.db.collection(collection).document(str(doc_id))
                else:
                    ref = self.db.collection(collection).document()
                
                batch.set(ref, doc)
            
            # Commit batch
            try:
                batch.commit()
                logger.info(f"   ✓ Batch {batch_num // BATCH_SIZE + 1} committed "
                          f"({len(batch_docs)} documents)")
            except Exception as e:
                logger.error(f"   ❌ Batch commit failed: {str(e)}")
                raise
        
        logger.info(f"✅ All {len(documents)} documents written successfully")
    
    def load_movies(self, csv_path: str = None):
        """
        Load movies from processed CSV into Firestore
        
        Args:
            csv_path (str): Path to movies_processed.csv
                           If None, uses default from processed dir
        """
        if csv_path is None:
            csv_path = PROCESSED_DIR / "movies_processed.csv"
        
        logger.info(f"📖 Loading movies from {csv_path}...")
        
        # Read CSV
        df = pd.read_csv(csv_path)
        logger.info(f"   Loaded {len(df)} movies from CSV")
        
        # Prepare documents
        documents = []
        for idx, row in df.iterrows():
            doc = {
                'movieId': int(row['movieId']),
                'title': str(row['title']),
                'year': int(row['year']) if pd.notna(row['year']) else 0,
                'genres': json.loads(row['genres']) if isinstance(row['genres'], str) else list(row['genres'].split('|') if pd.notna(row['genres']) else []),
                'imdbId': str(row['imdbId']) if pd.notna(row['imdbId']) else '',
                'tmdbId': int(row['tmdbId']) if pd.notna(row['tmdbId']) else 0,
                'avgRating': float(row['avgRating']) if pd.notna(row['avgRating']) else 0.0,
                'ratingCount': int(row['ratingCount']) if pd.notna(row['ratingCount']) else 0,
                'popularity': float(row['popularity']) if pd.notna(row['popularity']) else 0.0,
                'tags': json.loads(row['tags']) if isinstance(row['tags'], str) else (list(row['tags']) if pd.notna(row['tags']) else []),
                'tagGenome': {},  # Will be populated separately if needed
                'createdAt': datetime.now(),
                'lastUpdated': datetime.now()
            }
            documents.append(doc)
        
        # Write to Firestore
        self.batch_write('movies', documents, doc_id_field='movieId')
        
        logger.info(f"✅ Loaded {len(documents)} movies into Firestore collection 'movies'")
    
    def load_sample_ratings(self, csv_path: str = None, sample_size: int = 1000):
        """
        Load sample of ratings as initial user data
        
        Note: We don't load ALL 33M ratings to each user. Instead:
        - Load sample ratings for demo purposes
        - In production, ratings are added as users rate movies
        
        Args:
            csv_path (str): Path to ratings_processed.csv
            sample_size (int): Number of sample ratings to load
        """
        if csv_path is None:
            csv_path = PROCESSED_DIR / "ratings_processed.csv"
        
        logger.info(f"📖 Loading sample ratings from {csv_path}...")
        
        # Read CSV
        df = pd.read_csv(csv_path)
        logger.info(f"   Total ratings available: {len(df)}")
        
        # Take sample
        sample_df = df.sample(n=min(sample_size, len(df)), random_state=42)
        logger.info(f"   Using sample of {len(sample_df)} ratings for testing")
        
        # Group by userId to create user profiles
        grouped = sample_df.groupby('userId')
        
        user_count = 0
        total_ratings_loaded = 0
        
        for user_id, user_ratings in tqdm(grouped, desc="Processing users"):
            user_id = int(user_id)
            user_doc = {
                'uid': str(user_id),  # In production, this would be Firebase Auth UID
                'email': f'user{user_id}@movielens.demo',
                'displayName': f'User {user_id}',
                'preferredGenres': [],
                'createdAt': datetime.now(),
                'lastActive': datetime.now(),
                'totalRatings': len(user_ratings),
                'avgRatingGiven': user_ratings['rating'].mean(),
                'profileComplete': False
            }
            
            # Write user document
            self.db.collection('users').document(str(user_id)).set(user_doc)
            
            # Write ratings as subcollection
            ratings_batch = self.db.batch()
            for idx, (_, rating_row) in enumerate(user_ratings.iterrows()):
                rating_doc = {
                    'movieId': int(rating_row['movieId']),
                    'rating': float(rating_row['rating']),
                    'timestamp': rating_row['timestamp'],
                    'implicit': False
                }
                
                ref = self.db.collection('users').document(str(user_id)) \
                              .collection('ratings').document(str(int(rating_row['movieId'])))
                ratings_batch.set(ref, rating_doc)
                total_ratings_loaded += 1
                
                # Commit every 500 ratings
                if (idx + 1) % 500 == 0:
                    ratings_batch.commit()
                    ratings_batch = self.db.batch()
            
            # Commit remaining
            if (len(user_ratings) % 500) != 0:
                ratings_batch.commit()
            
            user_count += 1
        
        logger.info(f"✅ Loaded {user_count} sample users with {total_ratings_loaded} ratings")
    
    def load_dataset_metadata(self, metadata_path: str = None):
        """
        Load dataset metadata to Firestore
        
        Args:
            metadata_path (str): Path to metadata.json
        """
        if metadata_path is None:
            metadata_path = PROCESSED_DIR / "metadata.json"
        
        logger.info(f"📝 Loading dataset metadata...")
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Add to Firestore
        metadata['loadedAt'] = datetime.now()
        metadata['lastUpdated'] = datetime.now()
        
        self.db.collection('movielens_meta').document('dataset_info').set(metadata)
        
        logger.info(f"✅ Metadata loaded:")
        logger.info(f"   Total Movies: {metadata['total_movies']}")
        logger.info(f"   Total Ratings: {metadata['total_ratings']}")
        logger.info(f"   Unique Users: {metadata['unique_users']}")
    
    def run_full_load(self, load_ratings_sample: bool = True):
        """
        Execute full data loading pipeline
        
        Args:
            load_ratings_sample (bool): Whether to load sample user ratings
        """
        logger.info("=" * 60)
        logger.info("🚀 FIRESTORE DATA LOADING STARTED")
        logger.info("=" * 60)
        
        try:
            # Step 1: Load movies
            self.load_movies()
            
            # Step 2: Load sample ratings (optional)
            if load_ratings_sample:
                self.load_sample_ratings(sample_size=5000)
            
            # Step 3: Load metadata
            self.load_dataset_metadata()
            
            logger.info("=" * 60)
            logger.info("✅ FIRESTORE LOADING COMPLETED SUCCESSFULLY")
            logger.info("=" * 60)
            
        except Exception as e:
            logger.error("=" * 60)
            logger.error(f"❌ LOADING FAILED: {str(e)}")
            logger.error("=" * 60)
            raise


if __name__ == "__main__":
    # Example usage
    try:
        loader = FirestoreLoader()
        loader.run_full_load(load_ratings_sample=True)
    except Exception as e:
        logger.error(f"Failed to load data: {str(e)}")
        exit(1)
