from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager, UserMixin, login_user, login_required,
    logout_user, current_user
)
from werkzeug.security import generate_password_hash, check_password_hash
from flask_dance.contrib.google import make_google_blueprint, google
from flask_cors import CORS
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime


# Load Environment Variables
load_dotenv()

# Flask App Configuration
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
CORS(app)


# Database Setup
db = SQLAlchemy(app)


# Flask-Login Setup
login_manager = LoginManager(app)
login_manager.login_view = "login"


# User Model
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150))
    provider = db.Column(db.String(50), default="email")

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Google OAuth Setup
google_bp = make_google_blueprint(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    redirect_to="google_login"
)
app.register_blueprint(google_bp, url_prefix="/login")


# ============ Routes ==============

# Home Page
@app.route("/")
def home():
    if current_user.is_authenticated:
        return f"Hello, {current_user.email}! <a href='/logout'>Logout</a>"
    return (
        "<h1>Welcome!</h1>"
        "<a href='/signup'>Sign up</a> | "
        "<a href='/login'>Login</a> | "
        "<a href='/login/google'>Login with Google</a>"
    )

# Signup Route (Email/Password)
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        if User.query.filter_by(email=email).first():
            return "Email already exists!"

        hashed_pw = generate_password_hash(password)
        new_user = User(email=email, password_hash=hashed_pw, provider="email")
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for("login"))

    return render_template("signup.html")

# Login Route (Email/Password)
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for("home"))
        return "Invalid credentials"

    return render_template("login.html")

# Google OAuth Callback
@app.route("/google_login")
def google_login():
    if not google.authorized:
        return redirect(url_for("google.login"))

    resp = google.get("/oauth2/v2/userinfo")
    info = resp.json()
    email = info["email"]

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, provider="google")
        db.session.add(user)
        db.session.commit()

    login_user(user)
    return redirect(url_for("home"))

# Logout Route
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("home"))

# Run Flask App
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///files.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')

db = SQLAlchemy(app)

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

class UserFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    user_email = db.Column(db.String(255), nullable=True)

@app.route('/')
def index():
    return "File Upload API Ready!"

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Generate unique filename
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    # Save file
    file.save(file_path)
    
    # Store in database
    user_file = UserFile(
        filename=filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        user_email=request.form.get('user_email')
    )
    
    db.session.add(user_file)
    db.session.commit()
    
    return jsonify({
        'message': 'File uploaded successfully',
        'file_id': user_file.id,
        'filename': user_file.original_filename
    })

@app.route('/files', methods=['GET'])
def get_files():
    user_email = request.args.get('user_email')
    if user_email:
        files = UserFile.query.filter_by(user_email=user_email).all()
    else:
        files = UserFile.query.all()
    return jsonify([{
        'id': f.id,
        'filename': f.original_filename,
        'upload_date': f.upload_date.isoformat(),
        'file_size': f.file_size
    } for f in files])

@app.route('/download/<int:file_id>', methods=['GET'])
def download_file(file_id):
    user_file = UserFile.query.get_or_404(file_id)
    return send_file(user_file.file_path, as_attachment=True, download_name=user_file.original_filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)
