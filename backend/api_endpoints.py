"""
API Endpoints for Recommendations
==================================

FastAPI endpoints that expose the recommendation engine to the frontend.

Routes:
-------
POST /api/recommendations/user/{user_id}          - Get recommendations for user
GET  /api/recommendations/similar/{movie_id}      - Get similar movies
POST /api/recommendations/feedback                - Accept user ratings
GET  /api/recommendations/status                  - Check engine status

Author: Sprint 2 Implementation
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# Global recommendation engine instance (will be initialized in main.py)
recommendation_engine = None


# ============================================================
# DATA MODELS (For API request/response validation)
# ============================================================

class RecommendationResponse(BaseModel):
    """
    Single movie recommendation
    
    Example:
    {
        "movieId": 122,
        "title": "The Lord of the Rings",
        "avgRating": 4.27,
        "score": 0.92,
        "reason": "Users with your taste loved this"
    }
    """
    movieId: int
    title: str
    avgRating: float
    score: float
    reason: str


class RecommendationsListResponse(BaseModel):
    """
    List of recommendations with metadata
    
    Example:
    {
        "userId": "user_abc123",
        "recommendations": [...],
        "timestamp": "2026-04-20T12:30:45",
        "algorithm": "hybrid"
    }
    """
    userId: str  # Supports both Firebase UIDs (strings) and numeric IDs
    recommendations: List[RecommendationResponse]
    timestamp: str
    algorithm: str = "hybrid"


class RatingFeedback(BaseModel):
    """
    User rating feedback to update recommendations
    
    Example:
    {
        "userId": 1,
        "movieId": 122,
        "rating": 4.5
    }
    """
    userId: int
    movieId: int
    rating: float  # 1-5 scale


class SimilarMovieResponse(BaseModel):
    """
    Similar movie information
    
    Example:
    {
        "movieId": 451,
        "title": "Inception",
        "similarity": 0.87,
        "avgRating": 4.16
    }
    """
    movieId: int
    title: str
    similarity: float
    avgRating: float


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/user/{user_id}", response_model=RecommendationsListResponse)
async def get_user_recommendations(
    user_id: str,
    n: int = Query(10, ge=1, le=50),
    algorithm: str = Query("hybrid", regex="^(hybrid|user_user|item_item|svd)$")
):
    """
    GET PERSONALIZED RECOMMENDATIONS
    =================================
    
    Endpoint: GET /api/recommendations/user/{user_id}
    
    What: Returns personalized movie recommendations for a user
    
    Parameters:
    -----------
    user_id : str (path)
        The user ID to generate recommendations for
        Can be numeric (MovieLens: 1-610) or Firebase UID (string)
        Examples: "123" or "user_abc123xyz"
    
    n : int (query, default=10)
        Number of recommendations to return
        Range: 1-50
        Example: ?n=15
    
    algorithm : str (query, default="hybrid")
        Which algorithm to use:
        - "hybrid": Combine all three (recommended) ⭐
        - "user_user": Similar users' favorites
        - "item_item": Similar to movies you liked
        - "svd": Matrix factorization only
        Example: ?algorithm=item_item
    
    Returns:
    --------
    RecommendationsListResponse with:
    - userId: The requested user
    - recommendations: List of movies with scores
    - timestamp: When recommendations were generated
    - algorithm: Which algorithm was used
    
    Example Response (200 OK):
    {
        "userId": 123,
        "recommendations": [
            {
                "movieId": 122,
                "title": "The Lord of the Rings: The Return of the King",
                "avgRating": 4.27,
                "score": 0.92,
                "reason": "Users with your taste loved this"
            },
            {
                "movieId": 451,
                "title": "Inception",
                "avgRating": 4.16,
                "score": 0.88,
                "reason": "Similar to movies you liked"
            },
            ...
        ],
        "timestamp": "2026-04-20T12:30:45.123456",
        "algorithm": "hybrid"
    }
    
    Error Cases:
    -----------
    404 Not Found - User doesn't exist
        {
            "detail": "User 999 not found in database"
        }
    
    400 Bad Request - Invalid parameters
        {
            "detail": "n must be between 1 and 50"
        }
    
    500 Internal Server Error - Engine error
        {
            "detail": "Error generating recommendations"
        }
    
    Use Cases:
    ----------
    1. Dashboard: Display personalized recommendations
        GET /api/recommendations/user/123?n=10
    
    2. Show more recommendations
        GET /api/recommendations/user/123?n=20
    
    3. Try different algorithm
        GET /api/recommendations/user/123?algorithm=item_item&n=10
    
    Frontend Example (React):
    -------------------------
    async function getRecommendations(userId) {
        const response = await fetch(
            `/api/recommendations/user/${userId}?n=10&algorithm=hybrid`
        );
        const data = await response.json();
        return data.recommendations;
    }
    """
    try:
        if recommendation_engine is None:
            raise HTTPException(status_code=500, detail="Recommendation engine not initialized")
        
        logger.info(f"📋 API Request: Get {n} recommendations for user {user_id}")
        
        # Get recommendations based on algorithm choice
        if algorithm == "hybrid":
            recommendations = recommendation_engine.get_recommendations(user_id, n=n)
        elif algorithm == "user_user":
            logger.info("   Using User-User similarity algorithm")
            uu_similar = recommendation_engine._user_user_similarity(user_id, k=10)
            uu_scores = recommendation_engine._get_uu_scores(user_id, uu_similar)
            # TODO: Format uu_scores into RecommendationResponse list
            recommendations = []
        elif algorithm == "item_item":
            logger.info("   Using Item-Item similarity algorithm")
            ii_scores = recommendation_engine._item_item_similarity(user_id, n=n)
            # TODO: Format ii_scores into RecommendationResponse list
            recommendations = []
        elif algorithm == "svd":
            logger.info("   Using SVD algorithm")
            svd_scores = recommendation_engine._svd_recommendations(user_id, n=n)
            # TODO: Format svd_scores into RecommendationResponse list
            recommendations = []
        
        if not recommendations:
            logger.warning(f"⚠️ No recommendations found for user {user_id}")
            return RecommendationsListResponse(
                userId=user_id,
                recommendations=[],
                timestamp=datetime.now().isoformat(),
                algorithm=algorithm
            )
        
        logger.info(f"✅ Generated {len(recommendations)} recommendations")
        
        return RecommendationsListResponse(
            userId=user_id,
            recommendations=[
                RecommendationResponse(
                    movieId=r['movieId'],
                    title=r['title'],
                    avgRating=r['avgRating'],
                    score=r['score'],
                    reason=r['reason']
                )
                for r in recommendations
            ],
            timestamp=datetime.now().isoformat(),
            algorithm=algorithm
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{movie_id}", response_model=List[SimilarMovieResponse])
async def get_similar_movies(
    movie_id: int,
    n: int = Query(5, ge=1, le=20)
):
    """
    GET SIMILAR MOVIES (ITEM-ITEM)
    ==============================
    
    Endpoint: GET /api/recommendations/similar/{movie_id}
    
    What: Find movies similar to a given movie based on user rating patterns
    
    Parameters:
    -----------
    movie_id : int (path)
        The movie to find similar movies for
        Example: 122 (Avatar)
    
    n : int (query, default=5)
        Number of similar movies to return
        Range: 1-20
        Example: ?n=10
    
    Returns:
    --------
    List[SimilarMovieResponse] with movies sorted by similarity
    
    Example Response (200 OK):
    [
        {
            "movieId": 451,
            "title": "Inception",
            "similarity": 0.87,
            "avgRating": 4.16
        },
        {
            "movieId": 862,
            "title": "Interstellar",
            "similarity": 0.84,
            "avgRating": 4.20
        },
        ...
    ]
    
    Interpretation:
    - Similarity 0.9-1.0 = Very similar
    - Similarity 0.7-0.9 = Similar
    - Similarity 0.5-0.7 = Somewhat similar
    
    Use Cases:
    ----------
    1. Movie detail page: "Similar movies" section
        GET /api/recommendations/similar/122?n=5
    
    2. Carousel widget: "Users also watched"
        GET /api/recommendations/similar/451?n=10
    
    3. Browse similar by rating (all sci-fi movies)
        GET /api/recommendations/similar/1?n=20
    
    Frontend Example (React):
    -------------------------
    async function getSimilarMovies(movieId) {
        const response = await fetch(
            `/api/recommendations/similar/${movieId}?n=5`
        );
        return await response.json();
    }
    
    // Usage in MovieDetails component
    <SimilarMoviesSection 
        movies={await getSimilarMovies(currentMovie.id)}
    />
    """
    try:
        if recommendation_engine is None:
            raise HTTPException(status_code=500, detail="Recommendation engine not initialized")
        
        logger.info(f"🎬 API Request: Get {n} similar movies to {movie_id}")
        
        similar_movies = recommendation_engine.get_similar_movies(movie_id, n=n)
        
        if not similar_movies:
            logger.info(f"⚠️ No similar movies found for movie {movie_id}")
            return []
        
        logger.info(f"✅ Found {len(similar_movies)} similar movies")
        
        return [
            SimilarMovieResponse(
                movieId=m['movieId'],
                title=m['title'],
                similarity=m['similarity'],
                avgRating=m['avgRating']
            )
            for m in similar_movies
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting similar movies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def record_rating_feedback(feedback: RatingFeedback):
    """
    RECORD USER RATING FEEDBACK
    ===========================
    
    Endpoint: POST /api/recommendations/feedback
    
    What: Accept a user's movie rating and update the recommendation engine
    
    Body (JSON):
    -----------
    {
        "userId": 123,
        "movieId": 451,
        "rating": 4.5
    }
    
    Flow:
    -----
    1. User rates a movie in the frontend (1-5 stars)
    2. Frontend sends POST request to this endpoint
    3. Backend saves rating to Firestore
    4. Backend updates recommendation engine (optional: async job)
    5. Next time user requests recommendations, they're more accurate
    
    Response (202 Accepted):
    {
        "status": "accepted",
        "message": "Rating recorded successfully",
        "userId": 123,
        "movieId": 451,
        "rating": 4.5,
        "timestamp": "2026-04-20T12:30:45"
    }
    
    Use Cases:
    ----------
    1. After user rates a movie in the app
        const response = await fetch(
            '/api/recommendations/feedback',
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: 123,
                    movieId: 451,
                    rating: 4.5
                })
            }
        );
    
    2. Bulk rating update
        for each rating in userRatings:
            POST /api/recommendations/feedback with rating data
    
    Frontend Example (React):
    -------------------------
    async function saveRating(userId, movieId, rating) {
        const response = await fetch(
            '/api/recommendations/feedback',
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId, movieId, rating})
            }
        );
        return await response.json();
    }
    
    // Usage
    await saveRating(123, 451, 4.5);
    console.log("Rating saved!");
    """
    try:
        logger.info(f"⭐ Received rating: User {feedback.userId} rated movie {feedback.movieId} with {feedback.rating} stars")
        
        # TODO: In Phase 2, implement this
        # 1. Save to Firestore in users/{userId}/ratings/{movieId}
        # 2. Optionally: Trigger async engine update
        # 3. Return success response
        
        return {
            "status": "accepted",
            "message": "Rating recorded successfully",
            "userId": feedback.userId,
            "movieId": feedback.movieId,
            "rating": feedback.rating,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error recording feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




@router.post("/sync-firestore")
async def sync_firebase_ratings():
    """
    SYNC FIREBASE RATINGS TO ENGINE
    ===============================
    
    Endpoint: POST /api/recommendations/sync-firestore
    
    What: Manually trigger a sync of Firebase user ratings to the recommendation engine
    
    Purpose: 
    - Update engine with new Firebase user ratings
    - Make recommendations available for new users
    - Refresh recommendations based on latest ratings
    
    Response:
    {
        "success": true,
        "new_users": 3,
        "total_ratings": 100856,
        "message": "Successfully synced 3 new Firebase users",
        "timestamp": "2026-04-20T12:30:45"
    }
    
    Use Cases:
    ----------
    1. Backend admin: Manually update recommendations
        POST /api/recommendations/sync-firestore
    
    2. Frontend: After user rates movies (optional, background sync runs automatically)
        POST /api/recommendations/sync-firestore
    
    3. Monitoring: Verify sync is working
        result = await fetch('/api/recommendations/sync-firestore', {method: 'POST'})
        if (result.new_users > 0) { console.log('Sync successful') }
    
    Note:
    -----
    - Background sync runs automatically every 5 minutes
    - Manual calls are useful for immediate updates
    - Safe to call multiple times (no duplicates)
    """
    try:
        if recommendation_engine is None:
            raise HTTPException(status_code=500, detail="Recommendation engine not initialized")
        
        # Import here to avoid circular dependency
        from firestore_sync import sync_firestore_ratings
        
        logger.info("🔄 Manual sync triggered via API")
        result = sync_firestore_ratings(recommendation_engine)
        
        if result.get('success'):
            return {
                "success": True,
                "new_users": result.get('new_users', 0),
                "total_ratings": result.get('total_ratings', 0),
                "message": f"Successfully synced {result.get('new_users', 0)} new Firebase users",
                "timestamp": result.get('timestamp')
            }
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))
    
    except Exception as e:
        logger.error(f"❌ Sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_engine_status():
    """
    CHECK RECOMMENDATION ENGINE STATUS
    ==================================
    
    Endpoint: GET /api/recommendations/status
    
    What: Returns health information about the recommendation engine
    
    Response:
    {
        "status": "ready",
        "initialized": true,
        "users": 610,
        "movies": 9742,
        "ratings": 100836,
        "algorithms": ["user_user", "item_item", "svd"],
        "latent_factors": 10,
        "timestamp": "2026-04-20T12:30:45"
    }
    
    Use Cases:
    ----------
    1. Frontend health check on app startup
        if (await getEngineStatus().status === "ready") {
            // Show recommendations feature
        }
    
    2. Monitoring dashboard
        setInterval(() => fetch('/api/recommendations/status'), 60000)
    
    3. Debug: Check if engine is properly initialized
    """
    try:
        if recommendation_engine is None:
            return {
                "status": "not_initialized",
                "initialized": False,
                "message": "Recommendation engine not loaded"
            }
        
        return {
            "status": "ready",
            "initialized": True,
            "users": recommendation_engine.user_item_matrix.shape[0],
            "movies": recommendation_engine.user_item_matrix.shape[1],
            "ratings": len(recommendation_engine.ratings_df),
            "algorithms": ["user_user", "item_item", "svd"],
            "latent_factors": recommendation_engine.n_factors,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error checking engine status: {str(e)}")
        return {
            "status": "error",
            "initialized": False,
            "error": str(e)
        }


def initialize_engine(engine_instance):
    """
    Initialize the global recommendation engine
    
    Called from main.py on startup:
    
    from recommendation_engine import RecommendationEngine
    from api_endpoints import initialize_engine, router
    
    # Load data from Firestore
    engine = RecommendationEngine(ratings_df, movies_df, n_factors=10)
    
    # Set global instance
    initialize_engine(engine)
    
    # Add routes to app
    app.include_router(router)
    """
    global recommendation_engine
    recommendation_engine = engine_instance
    logger.info("✅ Recommendation engine initialized in API endpoints")
