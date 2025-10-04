from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
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