# CineSense 🎬

A modern movie recommendation and rating application built with React, Firebase, and Node.js.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)

---

## 🎯 Overview

CineSense is a full-stack AI-powered movie recommendation platform that allows users to:
- Browse and search movies
- Rate and review movies
- Create personalized watchlists
- **Get AI-powered personalized movie recommendations** (using collaborative filtering)
- Manage user profiles
- View detailed movie information

The application uses Firebase for authentication and real-time database management, with a React frontend and Python/FastAPI backend with integrated machine learning recommendation engine. The recommendation system is trained on the MovieLens dataset (25M+ ratings) for accurate, personalized suggestions.

---

## ✨ Features

### User Features
- 🔐 User authentication (Sign up, Login, Password reset)
- 🎬 Browse movies and detailed information
- ⭐ Rate and review movies
- 📋 Create and manage watchlists
- 🤖 **AI-Powered movie recommendations** (Collaborative filtering)
- 👤 User profile management
- 🔍 Advanced movie search and filtering

### AI Recommendation Engine
- 🧠 Machine learning-based recommendations
- 📊 Collaborative filtering algorithm
- 🎯 Personalized suggestions based on user ratings
- 📈 Trained on MovieLens dataset (25M+ ratings)
- 🔄 Real-time recommendation updates

### Admin Features
- 👥 User management
- 📊 Analytics dashboard
- 🎥 Movie database management

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend
- **Python 3.9+** - Runtime environment
- **FastAPI** - Modern, high-performance web framework
- **Firebase Admin SDK** - Authentication & Database
- **Firestore** - NoSQL database
- **Swagger UI** - Interactive API documentation (built-in with FastAPI)

### AI & Machine Learning
- **scikit-learn** - Machine learning algorithms
- **pandas** - Data processing and analysis
- **numpy** - Numerical computing
- **MovieLens Dataset** - Collaborative filtering dataset (25M+ ratings)
- **Recommendation System** - Collaborative filtering & content-based hybrid approach

### DevOps & Tools
- **npm** - Frontend package manager
- **pip** - Python package manager
- **Git** - Version control
- **Docker** - Containerization (optional)

---

## 📁 Project Structure

```
CineSense/
├── backend/                         # Python/FastAPI Backend
│   ├── main.py                      # FastAPI application entry point
│   ├── requirements.txt             # Python dependencies
│   ├── config.py                    # Configuration settings
│   ├── firebase_config.py           # Firebase configuration
│   ├── serviceAccountKey.json       # Firebase credentials
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py             # Authentication endpoints
│   │   │   ├── movies.py           # Movie endpoints
│   │   │   ├── ratings.py          # Rating endpoints
│   │   │   ├── recommendations.py  # Recommendation system endpoints
│   │   │   └── users.py            # User profile endpoints
│   │   │
│   │   ├── models/
│   │   │   ├── recommendation.py   # ML recommendation model
│   │   │   └── database.py         # Database models
│   │   │
│   │   └── utils/
│   │       ├── firebase.py         # Firebase utilities
│   │       └── helpers.py          # Helper functions
│   │
│   └── data/
│       └── movielens/              # MovieLens dataset
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── components/         # Reusable components
│   │   │   ├── pages/              # Page components
│   │   │   ├── data/               # Mock data
│   │   │   └── styles/             # Global styles
│   │   └── main.tsx
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js          # Tailwind configuration
│   └── index.html
│
└── README.md                        # This file
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Python 3.9+** - Backend runtime
- **Node.js 16+** - Frontend runtime  
- **npm** - JavaScript package manager
- **pip** - Python package manager
- Firebase project with service account key
- Git

### Clone Repository
```bash
git clone <repository-url>
cd CineSense
```

---

## 🔧 Backend Setup

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Generate Requirements File
```bash
pip freeze > requirements.txt
```

Required packages:
- fastapi
- uvicorn
- firebase-admin
- pandas
- numpy
- scikit-learn
- python-multipart

### 3. Firebase Configuration
- Ensure `serviceAccountKey.json` is in the `backend/` directory
- This file contains your Firebase credentials (keep it secure!)

### 4. Download MovieLens Dataset
```bash
# Create data directory
mkdir data/movielens

# Download from: https://grouplens.org/datasets/movielens/
# Place the dataset files in backend/data/movielens/
```

### 5. Start the Backend Server
```bash
uvicorn main:app --reload
```

- Backend runs on `http://localhost:8000`
- **Swagger UI Documentation**: `http://localhost:8000/docs`
- **ReDoc Alternative Docs**: `http://localhost:8000/redoc`

---

## 🎨 Frontend Setup

### 1. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `frontend/` directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=cinesense-3c393
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Build Configuration
The frontend uses:
- **Vite** for fast build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** components for UI elements

---

## 🤖 AI Recommendation System

### Overview
The recommendation engine uses **collaborative filtering** trained on the MovieLens dataset to provide personalized movie suggestions.

### How It Works
1. **Data Collection** - Collects user ratings from Firestore
2. **Model Training** - Trains ML model using user-item rating matrix
3. **Similarity Calculation** - Computes user/item similarities
4. **Recommendation Generation** - Generates top-N recommendations per user
5. **Real-Time Updates** - Updates recommendations as new ratings are added

### MovieLens Dataset
- **Size**: 25M+ ratings
- **Coverage**: 62K movies, 162K users
- **Format**: CSV with user ID, movie ID, rating, timestamp
- **URL**: https://grouplens.org/datasets/movielens/

### Implementation Details
- **Algorithm**: User-based or item-based collaborative filtering (configurable)
- **ML Library**: scikit-learn
- **Data Processing**: pandas & numpy
- **API Endpoint**: `GET /recommendations/{user_id}`

### Example Recommendation Request
```bash
curl http://localhost:8000/recommendations/user123?top_n=10
```

Response:
```json
{
  "user_id": "user123",
  "recommendations": [
    {
      "movie_id": "tt0111161",
      "title": "The Shawshank Redemption",
      "predicted_rating": 4.8,
      "reason": "Similar to movies you liked"
    }
  ]
}
```

### Future Enhancements
- Content-based filtering
- Hybrid recommendation models
- Deep learning approaches (Neural Collaborative Filtering)
- Real-time model updates

---

### Backend
```bash
cd backend
uvicorn main:app --reload
```

Backend will be available at:
- **API**: `http://localhost:8000`
- **Swagger UI Docs**: `http://localhost:8000/docs`
- **ReDoc Docs**: `http://localhost:8000/redoc`

### Frontend
```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:5173` (default Vite port)

---

## 🧪 Testing

### Test API Endpoints
Access Swagger UI to test all endpoints interactively:
```
http://localhost:8000/docs
```

### Manual Testing with curl

**Health Check**
```bash
curl http://localhost:8000/health
```

**Get Recommendations**
```bash
curl http://localhost:8000/recommendations/user123?top_n=10
```

**Create User**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","displayName":"John"}'
```

### Running ML Model Tests
```bash
cd backend
python -m pytest tests/
```

---

## 💾 Database Schema

### Firestore Collections

#### `users/` collection
```javascript
{
  uid: string,              // Unique Firebase UID
  email: string,            // User email
  displayName: string,      // User's display name
  role: string,             // 'user' or 'admin'
  createdAt: Timestamp,     // Creation timestamp
  updatedAt: Timestamp,     // Last update timestamp
  // Additional fields:
  // - profilePicture: string (URL)
  // - bio: string
  // - favoriteGenres: array
}
```

#### `movies/` collection
```javascript
{
  id: string,
  title: string,
  description: string,
  genre: string[],
  releaseDate: string,
  rating: number,
  posterUrl: string,
  director: string,
  cast: string[],
  // Additional fields
}
```

#### `ratings/` collection
```javascript
{
  userId: string,
  movieId: string,
  rating: number,          // 1-5 stars
  review: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `watchlists/` collection
```javascript
{
  userId: string,
  movies: string[],        // Array of movie IDs
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔗 API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-token` - Verify ID token

### Users
- `GET /api/users/{uid}` - Get user profile
- `PUT /api/users/{uid}` - Update user profile
- `DELETE /api/users/{uid}` - Delete user account

### Movies
- `GET /api/movies` - Get all movies with pagination
- `GET /api/movies/{id}` - Get movie details
- `GET /api/movies/search` - Search movies by title/genre
- `POST /api/movies` - Create movie (admin only)
- `PUT /api/movies/{id}` - Update movie (admin only)
- `DELETE /api/movies/{id}` - Delete movie (admin only)

### Ratings & Reviews
- `POST /api/ratings` - Add movie rating
- `GET /api/movies/{id}/ratings` - Get movie ratings and reviews
- `PUT /api/ratings/{id}` - Update rating
- `DELETE /api/ratings/{id}` - Delete rating

### Watchlist
- `GET /api/users/{uid}/watchlist` - Get user watchlist
- `POST /api/users/{uid}/watchlist` - Add movie to watchlist
- `DELETE /api/users/{uid}/watchlist/{movieId}` - Remove from watchlist

### Recommendations (AI Engine)
- `GET /recommendations/{user_id}` - Get personalized recommendations
- `GET /recommendations/{user_id}?top_n=10` - Get top N recommendations
- `POST /recommendations/train` - Train recommendation model (admin only)
- `GET /recommendations/health` - Check model status

### Health & Status
- `GET /health` - API health check
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

---

## 🔐 Security Considerations

1. **Never commit `serviceAccountKey.json`** - Add to `.gitignore`
2. **Firebase rules** - Set up proper Firestore security rules
3. **Environment variables** - Use `.env` files for sensitive data
4. **Backend validation** - Always validate user input on the server
5. **CORS configuration** - Properly configure CORS for frontend requests
6. **Authentication** - Verify ID tokens from Firebase on all protected routes

---

## 📝 Backend Architecture

### Python/FastAPI Backend Structure

**Main Application (main.py)**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CineSense API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api import auth, movies, ratings, recommendations, users
app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(ratings.router)
app.include_router(recommendations.router)
app.include_router(users.router)

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Firebase Integration (Python)
```python
import firebase_admin
from firebase_admin import credentials, auth, firestore

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

# Verify ID token
def verify_token(token):
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise Exception(f"Token verification failed: {e}")
```

### Recommendation Model
```python
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import numpy as np

class RecommendationEngine:
    def __init__(self):
        self.user_item_matrix = None
        self.model = None
    
    def train(self, ratings_data):
        # Create user-item matrix
        self.user_item_matrix = ratings_data.pivot_table(
            index='user_id',
            columns='movie_id',
            values='rating'
        ).fillna(0)
        
        # Calculate similarities
        self.similarity_matrix = cosine_similarity(self.user_item_matrix)
    
    def recommend(self, user_id, top_n=10):
        # Generate recommendations
        pass
```

---

## 🎓 Next Steps

### Backend Development (Python/FastAPI)
- [ ] Create FastAPI main application (main.py)
- [ ] Set up project structure and modules
- [ ] Implement Firebase authentication endpoints
- [ ] Create database models and schemas
- [ ] Build CRUD operations for movies
- [ ] Implement rating and review system
- [ ] Set up watchlist functionality

### Machine Learning & Recommendations
- [ ] Download and process MovieLens dataset
- [ ] Build collaborative filtering model
- [ ] Train recommendation engine
- [ ] Implement recommendation API endpoint
- [ ] Add model persistence (save/load trained models)
- [ ] Set up background training job scheduler
- [ ] Implement hybrid recommendation approach

### Frontend Integration
- [ ] Connect React to FastAPI backend
- [ ] Build authentication UI (login/signup)
- [ ] Create movie browsing pages
- [ ] Implement rating/review components
- [ ] Build recommendation carousel/component
- [ ] Integrate watchlist functionality
- [ ] Add user profile management

### Deployment & DevOps
- [ ] Containerize backend (Docker)
- [ ] Set up backend deployment (Heroku/GCP)
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Configure CI/CD pipeline
- [ ] Set up monitoring and logging

### Testing & Quality
- [ ] Write unit tests for ML models
- [ ] Create integration tests
- [ ] Add API testing with pytest
- [ ] Set up code coverage reporting
- [ ] Performance testing and optimization

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] ML model documentation
- [ ] Setup and installation guides
- [ ] Contributing guidelines

---

## 📧 Support & Contribution

For issues, questions, or contributions, please open an issue or submit a pull request.

---

## 📄 License

ISC License

---

**Last Updated:** March 18, 2026
