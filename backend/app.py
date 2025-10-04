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
