import { useState, useEffect } from "react";
import { MessageSquare, Send, Star, CheckCircle, Film, Bug, Lightbulb, Heart } from "lucide-react";
import { toast } from "sonner";
import { saveFeedback, getUserFeedback, FeedbackSubmission as FirestoreFeedback } from "../../config/authService";
import { Timestamp } from 'firebase/firestore';

interface FeedbackProps {
  userName: string;
  userEmail: string;
  uid: string;
}

type FeedbackType = "bug" | "feature" | "movie" | "general";

interface FeedbackSubmission {
  id: number;
  type: FeedbackType;
  subject: string;
  message: string;
  rating?: number;
  date: string;
}

const BACKEND_URL = "http://localhost:8000";

export function Feedback({ userName, userEmail, uid }: FeedbackProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const feedbackTypes = [
    {
      id: "bug" as FeedbackType,
      label: "Report Bug",
      icon: Bug,
      color: "from-red-600 to-orange-600",
      description: "Report technical issues or bugs"
    },
    {
      id: "feature" as FeedbackType,
      label: "Feature Request",
      icon: Lightbulb,
      color: "from-yellow-600 to-amber-600",
      description: "Suggest new features or improvements"
    },
    {
      id: "movie" as FeedbackType,
      label: "Movie Feedback",
      icon: Film,
      color: "from-purple-600 to-pink-600",
      description: "Feedback about movie recommendations"
    },
    {
      id: "general" as FeedbackType,
      label: "General Feedback",
      icon: MessageSquare,
      color: "from-blue-600 to-cyan-600",
      description: "General comments or suggestions"
    }
  ];

  // Load feedback from Firestore on component mount
  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const userFeedback = await getUserFeedback(uid);
        // Convert Firestore feedback to local format
        const formattedFeedback: FeedbackSubmission[] = userFeedback.map(item => ({
          id: Date.parse(item.date),
          type: item.type,
          subject: item.subject,
          message: item.message,
          rating: item.rating,
          date: item.date
        }));
        setSubmissions(formattedFeedback);
      } catch (error) {
        console.error("Failed to load feedback:", error);
      }
    };

    loadFeedback();
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (feedbackType === "movie" && rating === 0) {
      toast.error("Please select a rating for movie feedback");
      return;
    }
    
    setIsLoading(true);

    try {
      const currentDate = new Date().toLocaleDateString();
      
      // Create feedback object for local state
      const newSubmission: FeedbackSubmission = {
        id: Date.now(),
        type: feedbackType,
        subject,
        message,
        date: currentDate
      };
      
      // Only add rating if it's for movie feedback and has a value
      if (feedbackType === "movie" && rating > 0) {
        newSubmission.rating = rating;
      }

      // Create Firestore feedback object
      const firestoreFeedback: FirestoreFeedback = {
        id: String(Date.now()),
        type: feedbackType,
        subject,
        message,
        date: currentDate,
        timestamp: Timestamp.now()
      };
      
      // Only add rating if it's for movie feedback and has a value
      if (feedbackType === "movie" && rating > 0) {
        firestoreFeedback.rating = rating;
      }

      console.log("Saving feedback to Firestore:", firestoreFeedback);
      
      // Save to Firestore
      await saveFeedback(uid, firestoreFeedback);
      console.log("Feedback saved to Firestore successfully");

      // Send email notification to admin
      try {
        console.log("Sending email with data:", {
          uid,
          userName,
          userEmail,
          feedbackType,
          subject,
          message,
          rating: feedbackType === "movie" && rating > 0 ? rating : null
        });
        
        const response = await fetch(`${BACKEND_URL}/api/feedback/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid,
            userName,
            userEmail,
            feedbackType,
            subject,
            message,
            rating: feedbackType === "movie" && rating > 0 ? rating : null
          })
        });

        console.log("Email API response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Email notification failed:", errorText);
          toast.warning("Feedback saved but email notification may have failed");
        } else {
          const data = await response.json();
          console.log("Email sent successfully:", data);
          toast.success("Feedback submitted successfully! Email sent to admin.");
        }
      } catch (emailError) {
        console.error("Email API error:", emailError);
        toast.warning("Feedback saved locally (email notification unavailable)");
      }

      // Update local state
      setSubmissions([newSubmission, ...submissions]);
      setSubmitted(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setSubject("");
        setMessage("");
        setRating(0);
      }, 3000);
    } catch (error: any) {
      console.error("Feedback submission error:", error);
      const errorMessage = error?.message || String(error);
      console.error("Detailed error:", errorMessage);
      toast.error(`Failed to submit feedback: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Feedback Center</h1>
              <p className="text-zinc-400">We'd love to hear from you, {userName}!</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feedback Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-semibold text-white mb-6">Share Your Thoughts</h2>

              {/* Feedback Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = feedbackType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFeedbackType(type.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-purple-600 bg-purple-600/10"
                          : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${type.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-white font-medium text-sm">{type.label}</h3>
                      </div>
                      <p className="text-xs text-zinc-400 text-left">{type.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your feedback"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Rating (only for movie feedback) */}
                {feedbackType === "movie" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Overall Experience Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= (hoveredRating || rating)
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-zinc-600"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-zinc-400 text-sm">
                          {rating} / 5 stars
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please provide detailed feedback..."
                    rows={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none"
                    required
                  />
                </div>

                {/* User Info (read-only) */}
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <p className="text-xs text-zinc-400 mb-2">Submitting as:</p>
                  <p className="text-sm text-white">{userName} ({userEmail})</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitted || isLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    submitted
                      ? "bg-emerald-600 text-white"
                      : isLoading
                      ? "bg-zinc-600 text-white cursor-not-allowed opacity-75"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {submitted ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Feedback Submitted!
                    </span>
                  ) : isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      Submit Feedback
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Recent Submissions */}
            {submissions.length > 0 && (
              <div className="mt-6 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold text-white mb-4">Your Recent Feedback</h2>
                <div className="space-y-3">
                  {submissions.map((submission) => {
                    const feedbackType = feedbackTypes.find(t => t.id === submission.type);
                    const Icon = feedbackType?.icon || MessageSquare;
                    return (
                      <div key={submission.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${feedbackType?.color} shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="text-white font-medium text-sm">{submission.subject}</h3>
                              <span className="text-xs text-zinc-500 shrink-0">{submission.date}</span>
                            </div>
                            <p className="text-zinc-400 text-sm line-clamp-2">{submission.message}</p>
                            {submission.rating && (
                              <div className="flex items-center gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= submission.rating!
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-zinc-600"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Feedback Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Total Submitted</span>
                  <span className="text-white font-semibold">{submissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">This Month</span>
                  <span className="text-white font-semibold">
                    {submissions.filter(s => 
                      new Date(s.date).getMonth() === new Date().getMonth()
                    ).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Why Feedback Matters */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-800/30">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-pink-500" />
                <h3 className="text-lg font-semibold text-white">Why It Matters</h3>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Your feedback helps us improve CineSense and provide better movie recommendations
                for everyone. Every suggestion is carefully reviewed by our team.
              </p>
            </div>

            {/* Response Time Info */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-3">Response Time</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">Bug Reports</p>
                    <p className="text-zinc-400 text-xs">24-48 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">Feature Requests</p>
                    <p className="text-zinc-400 text-xs">3-5 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">General Feedback</p>
                    <p className="text-zinc-400 text-xs">1 week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}