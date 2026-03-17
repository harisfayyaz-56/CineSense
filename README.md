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

CineSense is a full-stack web application that allows users to:
- Browse and search movies
- Rate and review movies
- Create personalized watchlists
- Get movie recommendations
- Manage user profiles
- View detailed movie information

The application uses Firebase for authentication and real-time database management, with a React frontend and Node.js/Express backend.

---

## ✨ Features

### User Features
- 🔐 User authentication (Sign up, Login, Password reset)
- 🎬 Browse movies and detailed information
- ⭐ Rate and review movies
- 📋 Create and manage watchlists
- 🤖 Get personalized movie recommendations
- 👤 User profile management
- 🔍 Advanced movie search and filtering

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
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Firebase Admin SDK** - Authentication & Database
- **Firestore** - NoSQL database

### DevOps & Tools
- **npm** - Package manager
- **Git** - Version control

---

## 📁 Project Structure

```
CineSense/
├── backend/
│   ├── firebase.js              # Firebase config & functions
│   ├── serviceAccountKey.json   # Firebase credentials
│   ├── package.json            # Backend dependencies
│   ├── test.js                 # Authentication tests
│   └── createUser.js           # User creation script
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── components/     # Reusable components
│   │   │   ├── pages/          # Page components
│   │   │   ├── data/           # Mock data
│   │   │   └── styles/         # Global styles
│   │   └── main.tsx
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   └── index.html
│
└── README.md                    # This file
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
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
npm install
```

### 2. Firebase Configuration
- Ensure `serviceAccountKey.json` is in the `backend/` directory
- This file contains your Firebase credentials (keep it secure!)

### 3. Verify Firebase Setup
```bash
node test.js
```

Expected output:
```
✅ ALL TESTS PASSED! Firebase is working correctly.
```

### 4. Create a Test User
```bash
node createUser.js
```

This will create a user with:
- Email: john.doe@example.com
- Name: John Doe
- Role: user

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

## 🏃 Running the Project

### Backend
```bash
cd backend
npm start
# or
node server.js  # (once you create your server file)
```

### Frontend
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (default Vite port)

---

## 🧪 Testing

### Test Firebase Authentication
```bash
cd backend
node test.js
```

This runs the following tests:
1. ✅ User creation
2. ✅ User retrieval by UID
3. ✅ User deletion

### Create a New User
```bash
cd backend
node createUser.js
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

### Users
- `GET /api/users/:uid` - Get user profile
- `PUT /api/users/:uid` - Update user profile
- `DELETE /api/users/:uid` - Delete user account

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/search?q=query` - Search movies
- `POST /api/movies` - Create movie (admin only)
- `PUT /api/movies/:id` - Update movie (admin only)
- `DELETE /api/movies/:id` - Delete movie (admin only)

### Ratings & Reviews
- `POST /api/ratings` - Add movie rating
- `GET /api/movies/:id/ratings` - Get movie ratings
- `PUT /api/ratings/:id` - Update rating
- `DELETE /api/ratings/:id` - Delete rating

### Watchlist
- `GET /api/users/:uid/watchlist` - Get user watchlist
- `POST /api/users/:uid/watchlist` - Add to watchlist
- `DELETE /api/users/:uid/watchlist/:movieId` - Remove from watchlist

---

## 🔐 Security Considerations

1. **Never commit `serviceAccountKey.json`** - Add to `.gitignore`
2. **Firebase rules** - Set up proper Firestore security rules
3. **Environment variables** - Use `.env` files for sensitive data
4. **Backend validation** - Always validate user input on the server
5. **CORS configuration** - Properly configure CORS for frontend requests
6. **Authentication** - Verify ID tokens from Firebase on all protected routes

---

## 📝 Firebase Auth Functions

Available functions in `backend/firebase.js`:

### Authentication
```javascript
createUser(email, password, displayName)
deleteUser(uid)
getUserByUID(uid)
updateUserProfile(uid, updates)
verifyIdToken(idToken)
```

### Firestore Operations
```javascript
addDocument(collection, data)
getDocument(collection, docId)
updateDocument(collection, docId, data)
deleteDocument(collection, docId)
getAllDocuments(collection)
queryDocuments(collection, conditions)
```

### User Profile
```javascript
createUserProfile(uid, userData)
getUserProfile(uid)
updateUserProfileData(uid, updates)
deleteUserProfile(uid)
```

### Batch Operations
```javascript
batchWrite(operations)
```

---

## 🎓 Next Steps

- [ ] Set up Express server with API routes
- [ ] Implement user authentication endpoints
- [ ] Create movie database management system
- [ ] Build rating and review system
- [ ] Implement watchlist functionality
- [ ] Add movie recommendation algorithm
- [ ] Set up frontend Firebase integration
- [ ] Deploy backend to cloud (Firebase Functions or Heroku)
- [ ] Deploy frontend to Vercel or Netlify
- [ ] Add unit tests
- [ ] Set up CI/CD pipeline

---

## 📧 Support & Contribution

For issues, questions, or contributions, please open an issue or submit a pull request.

---

## 📄 License

ISC License

---

**Last Updated:** March 18, 2026
