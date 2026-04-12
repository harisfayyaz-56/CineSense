from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
from dotenv import load_dotenv
import logging
from urllib.parse import urlparse, parse_qs

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Email configuration
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "your-app-password")
RECIPIENT_EMAIL = "mhf.haris56@gmail.com"

def send_email(
    subject: str,
    body: str,
    recipient_email: str = RECIPIENT_EMAIL
) -> bool:
    """Send email using SMTP"""
    try:
        print(f"📧 Attempting to send email...")
        print(f"   From: {SENDER_EMAIL}")
        print(f"   To: {recipient_email}")
        print(f"   Subject: {subject}")
        
        # Check if email credentials are configured
        if not SENDER_EMAIL or SENDER_EMAIL == "your-email@gmail.com":
            print("❌ ERROR: SENDER_EMAIL not configured in .env")
            logger.error("SENDER_EMAIL not configured in .env")
            return False
        
        if not SENDER_PASSWORD or SENDER_PASSWORD == "your-app-password":
            print("❌ ERROR: SENDER_PASSWORD not configured in .env")
            logger.error("SENDER_PASSWORD not configured in .env")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = subject

        # Attach body
        msg.attach(MIMEText(body, 'html'))

        # Connect to Gmail SMTP
        print("🔗 Connecting to Gmail SMTP server...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        print("🔐 Logging in...")
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        print("✅ Login successful")
        
        # Send email
        print("📤 Sending email...")
        server.send_message(msg)
        server.quit()
        
        print("✅ Email sent successfully!")
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ AUTHENTICATION ERROR: {str(e)}")
        print("   Check: SENDER_EMAIL and SENDER_PASSWORD in .env")
        logger.error(f"SMTP Authentication failed: {str(e)}")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP ERROR: {str(e)}")
        logger.error(f"SMTP error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        logger.error(f"Failed to send email: {str(e)}")
        return False

class FeedbackHandler(BaseHTTPRequestHandler):
    """HTTP request handler for feedback endpoint"""
    
    def log_message(self, format, *args):
        """Override to add custom logging"""
        print(f"[{self.client_address[0]}] {format % args}")
    
    def add_cors_headers(self):
        """Add CORS headers to response"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Content-Type', 'application/json')
    
    def do_POST(self):
        """Handle POST requests"""
        # Only allow feedback endpoint
        if self.path == "/api/feedback/submit":
            content_length = int(self.headers.get('Content-Length', 0))
            try:
                print(f"\n📨 Received feedback submission")
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                
                # Extract feedback data
                uid = data.get('uid', 'N/A')
                userName = data.get('userName', 'Anonymous')
                userEmail = data.get('userEmail', 'N/A')
                feedbackType = data.get('feedbackType', 'general').upper()
                subject = data.get('subject', 'No subject')
                message = data.get('message', '')
                rating = data.get('rating')
                
                print(f"   User: {userName} ({userEmail})")
                print(f"   Type: {feedbackType}")
                print(f"   Subject: {subject}")
                
                # Create email subject
                email_subject = f"CineSense Feedback: {feedbackType} - {subject}"
                
                # Create email body
                rating_html = f"""
                <div style="margin-bottom: 15px;">
                    <p style="margin: 0; color: #666; font-size: 14px;"><strong>Rating:</strong> {"⭐ " * rating}({rating}/5)</p>
                </div>
                """ if rating else ""
                
                email_body = f"""
                <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <div style="border-bottom: 3px solid #a855f7; padding-bottom: 15px; margin-bottom: 20px;">
                                <h2 style="color: #333; margin: 0;">New Feedback Received</h2>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; color: #666; font-size: 14px;"><strong>Feedback Type:</strong> {feedbackType}</p>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; color: #666; font-size: 14px;"><strong>User ID:</strong> {uid}</p>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; color: #666; font-size: 14px;"><strong>User Name:</strong> {userName}</p>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; color: #666; font-size: 14px;"><strong>User Email:</strong> <a href="mailto:{userEmail}" style="color: #a855f7; text-decoration: none;">{userEmail}</a></p>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; color: #666; font-size: 14px;"><strong>Subject:</strong> {subject}</p>
                            </div>
                            
                            {rating_html}
                            
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0; color: #666; font-size: 14px;"><strong>Submitted at:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                            </div>
                            
                            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #a855f7; margin-top: 20px; border-radius: 5px;">
                                <p style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap; word-wrap: break-word;"><strong>Message:</strong></p>
                                <p style="margin: 10px 0 0 0; color: #555; font-size: 13px; white-space: pre-wrap; word-wrap: break-word;">{message}</p>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                                <p>This is an automated message from CineSense Feedback System</p>
                            </div>
                        </div>
                    </body>
                </html>
                """
                
                # Send email
                print("   Attempting to send email...")
                success = send_email(email_subject, email_body)
                
                # Send response
                if success:
                    response = json.dumps({
                        "success": True,
                        "message": "Feedback submitted successfully and email notification sent",
                        "timestamp": datetime.now().isoformat()
                    })
                    self.send_response(200)
                    print("✅ Response sent: 200 OK\n")
                else:
                    response = json.dumps({
                        "success": False,
                        "message": "Feedback received but email notification failed",
                        "timestamp": datetime.now().isoformat()
                    })
                    self.send_response(500)
                    print("❌ Response sent: 500 ERROR\n")
                
                self.add_cors_headers()
                self.end_headers()
                self.wfile.write(response.encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Error processing feedback: {str(e)}\n")
                logger.error(f"Error processing feedback: {str(e)}")
                response = json.dumps({"success": False, "error": str(e)})
                self.send_response(500)
                self.add_cors_headers()
                self.end_headers()
                self.wfile.write(response.encode('utf-8'))
        else:
            print(f"❌ Unknown endpoint: {self.path}\n")
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == "/health":
            print(f"❤️  Health check from {self.client_address[0]}")
            response = json.dumps({"status": "ok", "service": "CineSense Backend"})
            self.send_response(200)
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response.encode('utf-8'))
        elif self.path == "/":
            print(f"👋 Root request from {self.client_address[0]}")
            response = json.dumps({"message": "CineSense Backend API is running"})
            self.send_response(200)
            self.add_cors_headers()
            self.end_headers()
            self.wfile.write(response.encode('utf-8'))
        else:
            print(f"❌ Unknown GET endpoint: {self.path}")
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        print(f"📋 CORS preflight request to {self.path}")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '3600')
        self.end_headers()
        print("✅ CORS preflight response sent\n")

if __name__ == "__main__":
    server_address = ('0.0.0.0', 8000)
    httpd = HTTPServer(server_address, FeedbackHandler)
    print("=" * 60)
    print("🚀 CineSense Backend API Starting")
    print("=" * 60)
    print(f"📍 Server: http://localhost:8000")
    print(f"🌍 Listen on: 0.0.0.0:8000")
    print("\n📌 Available Endpoints:")
    print("   GET  http://localhost:8000/")
    print("   GET  http://localhost:8000/health")
    print("   POST http://localhost:8000/api/feedback/submit")
    print("   OPTIONS (CORS preflight)")
    print("\n📧 Email Configuration:")
    print(f"   From: {SENDER_EMAIL}")
    print(f"   To: {RECIPIENT_EMAIL}")
    if SENDER_EMAIL == "your-email@gmail.com":
        print("   ⚠️  WARNING: SENDER_EMAIL not configured in .env")
    if SENDER_PASSWORD == "your-app-password":
        print("   ⚠️  WARNING: SENDER_PASSWORD not configured in .env")
    print("=" * 60)
    print("✅ Server ready! Press Ctrl+C to stop.\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down server...")
        httpd.server_close()
        print("✅ Server stopped.")

