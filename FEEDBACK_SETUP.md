# Feedback Feature Setup Guide

## Overview
The feedback system now includes:
- ✅ Firestore persistence for all feedback submissions
- ✅ Email notifications sent to mhf.haris56@gmail.com
- ✅ Feedback history displayed on the page
- ✅ Loading states and error handling

## Backend Setup (Required for Email Notifications)

### 1. Install Python Dependencies
Navigate to the backend folder and install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` folder:
```
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
DEBUG=True
```

**Important:** For Gmail:
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password in `SENDER_PASSWORD` (not your regular password)

### 3. Run the Backend Server
```bash
cd backend
python main.py
```

The server will start at `http://localhost:8000`

Verify it's running:
```
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "ok", "service": "CineSense Backend"}
```

## Frontend Configuration

The frontend is already configured. The Feedback component will:
1. **Load previous feedback** from Firestore on mount
2. **Save new feedback** to Firestore with timestamp and user info
3. **Send email notification** to the admin email (mhf.haris56@gmail.com)
4. **Display feedback history** below the form

## How It Works

### User submits feedback:
1. Form data is validated
2. Feedback is saved to Firestore with:
   - User UID
   - Feedback type (bug, feature, movie, general)
   - Subject and message
   - Rating (only for movie feedback)
   - Timestamp
3. Backend API sends HTML-formatted email to admin at mhf.haris56@gmail.com containing:
   - User name and email
   - User UID (unique identifier)
   - Feedback type
   - Subject and message
   - Rating (if applicable)
   - Submission timestamp
4. Toast notification confirms submission

### Feedback Persistence:
- All feedback persists in Firestore
- Feedback is loaded from Firestore when user navigates to Feedback page
- Feedback history is displayed on the page (Your Recent Feedback section)
- Data survives page refreshes and logout/login

## Email Template
The email sent to mhf.haris56@gmail.com includes:
- Professional HTML formatting
- All user and feedback details
- Easily clickable reply link (mailto: to user's email)
- Timestamp for tracking

## Testing

### Test local without emails:
The feedback will save to Firestore even if the email backend is unavailable. A warning toast will show: "Feedback saved locally (email notification unavailable)"

### Test with emails:
1. Ensure backend is running
2. Configure .env with valid Gmail credentials
3. Submit feedback
4. Check mhf.haris56@gmail.com for notification

### Known Issues:
- If Gmail credentials are wrong, feedback still saves to Firestore but email sends a generic error
- Backend must be running for email notifications (feedback saved locally if backend is down)

## File Changes

### Backend:
- `backend/main.py` - New FastAPI server with email endpoint

### Frontend:
- `src/config/authService.ts` - Added `saveFeedback()` and `getUserFeedback()` functions
- `src/app/pages/Feedback.tsx` - Updated to use Firestore + email API
- `src/app/App.tsx` - Added uid state and passed to Feedback component

## Production Deployment

### Backend (Before Deploying):
1. Change `DEBUG=False` in .env
2. Set up environment variables on hosting platform (Heroku, Railway, etc.)
3. Update CORS origins in main.py to point to production URL

### Frontend (Before Deploying):
1. Update `BACKEND_URL` in Feedback.tsx to production backend URL
2. Build: `npm run build`
3. Deploy to Vercel, Netlify, etc.

## Support
If email notifications aren't working:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check .env has correct Gmail App Password
3. Check browser console for API errors
4. Feedback still saved to Firestore even if emails fail
