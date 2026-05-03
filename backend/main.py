"""
CineSense Backend API
====================

FastAPI server combining:
1. Feedback email submission
2. Recommendation engine endpoints
3. Firestore integration

Runs on: http://localhost:8000
API Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os
from dotenv import load_dotenv
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uvicorn
import pandas as pd
import numpy as np

# Import Sprint 2 components
from recommendation_engine import RecommendationEngine
from api_endpoints import router as recommendations_router, initialize_engine
from firestore_sync import FirestoreRatingSync

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CineSense Backend API",
    description="Movie recommendation engine with collaborative filtering",
    version="2.0"
)


# Email configuration
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "your-app-password")
RECIPIENT_EMAIL = "mhf.haris56@gmail.com"

# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("✅ CORS middleware configured")


# ============================================================
# GLOBAL STATE
# ============================================================

# Background sync thread for Firestore ratings
firestore_sync_thread = None

class FeedbackRequest(BaseModel):
    """
    Feedback submission request
    
    Example:
    {
        "uid": "user123",
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "feedbackType": "bug",
        "subject": "Search not working",
        "message": "When I search for Avatar, no results appear",
        "rating": 2
    }
    """
    uid: str
    userName: str
    userEmail: str
    feedbackType: str
    subject: str
    message: str
    rating: int = None


# ============================================================
# EMAIL SENDING
# ============================================================

def send_email(
    subject: str,
    body: str,
    recipient_email: str = RECIPIENT_EMAIL
) -> bool:
    """
    SEND EMAIL NOTIFICATION
    =======================
    
    Send formatted HTML email with feedback details
    
    Parameters:
    -----------
    subject : str
        Email subject line
    
    body : str
        HTML formatted email body
    
    recipient_email : str
        Recipient email address
    
    Returns:
    --------
    bool
        True if sent successfully, False otherwise
    """
    try:
        logger.info(f"📧 Sending email to {recipient_email}")
        logger.info(f"   Subject: {subject}")
        
        # Check configuration
        if not SENDER_EMAIL or SENDER_EMAIL == "your-email@gmail.com":
            logger.error("❌ SENDER_EMAIL not configured in .env")
            return False
        
        if not SENDER_PASSWORD or SENDER_PASSWORD == "your-app-password":
            logger.error("❌ SENDER_PASSWORD not configured in .env")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        # Send via Gmail SMTP
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        logger.info("✅ Email sent successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error sending email: {str(e)}")
        return False


# ============================================================
# FEEDBACK ENDPOINTS
# ============================================================

@app.post("/api/feedback/submit")
async def submit_feedback(feedback: FeedbackRequest, background_tasks: BackgroundTasks):
    """
    SUBMIT USER FEEDBACK
    ====================
    
    Endpoint: POST /api/feedback/submit
    
    What: Users submit bug reports, feature requests, or general feedback
    
    Body:
    {
        "uid": "user123",
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "feedbackType": "bug|feature|general|other",
        "subject": "Search not working",
        "message": "Detailed description of the issue...",
        "rating": 2 (1-5, optional)
    }
    
    Response (200 OK):
    {
        "success": true,
        "message": "Feedback submitted successfully",
        "timestamp": "2026-04-20T12:30:45"
    }
    
    Flow:
    1. Accept feedback from frontend
    2. Format as HTML email
    3. Send to team email in background
    4. Return success to user immediately
    """
    
    try:
        logger.info(f"📨 Feedback received from {feedback.userName}")
        logger.info(f"   Type: {feedback.feedbackType}")
        logger.info(f"   Subject: {feedback.subject}")
        
        # Format rating display
        rating_html = f"""
        <div style="margin-bottom: 15px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Rating:</strong> {"⭐ " * feedback.rating}({feedback.rating}/5)
            </p>
        </div>
        """ if feedback.rating else ""
        
        # Create email body
        email_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="border-bottom: 3px solid #a855f7; padding-bottom: 15px; margin-bottom: 20px;">
                        <h2 style="color: #333; margin: 0;">New Feedback Received</h2>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>Feedback Type:</strong> {feedback.feedbackType.upper()}
                        </p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>User ID:</strong> {feedback.uid}
                        </p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>User Name:</strong> {feedback.userName}
                        </p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>User Email:</strong> <a href="mailto:{feedback.userEmail}" style="color: #a855f7; text-decoration: none;">{feedback.userEmail}</a>
                        </p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>Subject:</strong> {feedback.subject}
                        </p>
                    </div>
                    
                    {rating_html}
                    
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>Submitted at:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                        </p>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #a855f7; margin-top: 20px; border-radius: 5px;">
                        <p style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap; word-wrap: break-word;">
                            <strong>Message:</strong>
                        </p>
                        <p style="margin: 10px 0 0 0; color: #555; font-size: 13px; white-space: pre-wrap; word-wrap: break-word;">
                            {feedback.message}
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                        <p>This is an automated message from CineSense Feedback System</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Send email in background (doesn't block response)
        email_subject = f"CineSense Feedback: {feedback.feedbackType.upper()} - {feedback.subject}"
        background_tasks.add_task(send_email, email_subject, email_body)
        
        logger.info("✅ Feedback accepted, email queued for sending")
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# HEALTH CHECK ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """
    ROOT ENDPOINT
    =============
    
    Health check for basic connectivity
    """
    return {
        "message": "CineSense Backend API",
        "version": "2.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """
    HEALTH CHECK
    ============
    
    Verify server is running and all systems operational
    """
    return {
        "status": "ok",
        "service": "CineSense Backend",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0"
    }


# ============================================================
# INITIALIZATION
# ============================================================

@app.on_event("startup")
async def startup_event():
    """
    Initialize recommendation engine on server startup
    
    Steps:
    1. Load ratings from Firestore
    2. Load movies from Firestore
    3. Train recommendation engine
    4. Make available via /api/recommendations/* endpoints
    5. Start background sync thread for Firebase ratings
    """
    global firestore_sync_thread
    
    logger.info("\n🚀 CineSense Backend Starting...\n")
    
    try:
        # TODO: Load from Firestore instead of CSV
        # For now, load from CSV for testing
        
        logger.info("📊 Loading data...")
        
        # Load ratings
        ratings_path = "data/processed/ratings_processed.csv"
        if os.path.exists(ratings_path):
            ratings_df = pd.read_csv(ratings_path)
            logger.info(f"   ✓ Loaded {len(ratings_df):,} ratings")
        else:
            logger.warning(f"   ⚠️  Ratings CSV not found at {ratings_path}")
            logger.info("   📝 Recommendation engine will be initialized on-demand")
            return
        
        # Load movies
        movies_path = "data/processed/movies_processed.csv"
        if os.path.exists(movies_path):
            movies_df = pd.read_csv(movies_path)
            logger.info(f"   ✓ Loaded {len(movies_df):,} movies")
        else:
            logger.warning(f"   ⚠️  Movies CSV not found at {movies_path}")
            return
        
        # Initialize engine
        logger.info("🧠 Training recommendation engine...")
        engine = RecommendationEngine(ratings_df, movies_df, n_factors=10)
        
        # Make available to API endpoints
        initialize_engine(engine)
        
        # Start background Firestore sync thread
        logger.info("\n🔄 Starting Firestore sync thread...")
        firestore_sync_thread = FirestoreRatingSync(engine, sync_interval=300)  # Sync every 5 minutes
        firestore_sync_thread.start()
        logger.info("   ✅ Background sync thread started")
        
        logger.info("✅ Backend initialization complete!\n")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {str(e)}")
        logger.warning("⚠️  Recommendation engine not available - continuing without it")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    global firestore_sync_thread
    
    logger.info("\n⏹️  CineSense Backend shutting down...")
    
    if firestore_sync_thread:
        firestore_sync_thread.stop()
        logger.info("   ✅ Firestore sync thread stopped")
    
    logger.info("✅ Backend shutdown complete\n")


# ============================================================
# INCLUDE RECOMMENDATION ROUTES
# ============================================================

app.include_router(recommendations_router)

logger.info("✅ Recommendation endpoints registered")


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("🚀 CineSense Backend API")
    logger.info("=" * 60)
    
    logger.info("\n📍 Server Configuration:")
    logger.info("   Host: 0.0.0.0")
    logger.info("   Port: 8000")
    logger.info("   URL: http://localhost:8000")
    
    logger.info("\n📚 API Documentation:")
    logger.info("   Swagger: http://localhost:8000/docs")
    logger.info("   ReDoc: http://localhost:8000/redoc")
    
    logger.info("\n📌 Available Endpoints:")
    logger.info("   GET    /")
    logger.info("   GET    /health")
    logger.info("   POST   /api/feedback/submit")
    logger.info("   GET    /api/recommendations/user/{user_id}")
    logger.info("   GET    /api/recommendations/similar/{movie_id}")
    logger.info("   POST   /api/recommendations/feedback")
    logger.info("   GET    /api/recommendations/status")
    logger.info("   POST   /api/recommendations/sync-firestore  ← Manual sync trigger")
    
    logger.info("\n📧 Email Configuration:")
    logger.info(f"   From: {SENDER_EMAIL}")
    logger.info(f"   To: {RECIPIENT_EMAIL}")
    if SENDER_EMAIL == "your-email@gmail.com":
        logger.warning("   ⚠️  SENDER_EMAIL not configured in .env")
    if SENDER_PASSWORD == "your-app-password":
        logger.warning("   ⚠️  SENDER_PASSWORD not configured in .env")
    
    logger.info("\n" + "=" * 60)
    logger.info("✅ Ready to accept requests!")
    logger.info("   Press Ctrl+C to stop")
    logger.info("=" * 60 + "\n")
    
    # Run with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )


