from flask import Blueprint, request, jsonify
from datetime import datetime
import sqlite3
import os

chat_bp = Blueprint('chat', __name__)

def get_db():
    conn = sqlite3.connect('instance/stormhacks.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_chat_db():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        content TEXT,
        file_path TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        reply_to INTEGER,
        chat_type TEXT DEFAULT 'public',
        chat_id TEXT DEFAULT 'general'
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS chat_topics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS chat_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER,
        user_id INTEGER,
        PRIMARY KEY (group_id, user_id)
    )''')
    
    # Insert default topics if they don't exist
    conn.execute('''INSERT OR IGNORE INTO chat_topics (id, name, color) VALUES 
        ('general', 'General', 'linear-gradient(135deg, #1e3c72, #c9a9dd)'),
        ('random', 'Random', 'linear-gradient(135deg, #2c5aa0, #b19cd9)')''')
    
    conn.commit()
    conn.close()

@chat_bp.route('/messages', methods=['GET'])
def get_messages():
    chat_id = request.args.get('chat_id', 'general')
    conn = get_db()
    messages = conn.execute(
        'SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp DESC LIMIT 50',
        (chat_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(msg) for msg in messages])

@chat_bp.route('/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    conn = get_db()
    conn.execute(
        'INSERT INTO messages (user_id, username, content, reply_to, chat_type, chat_id) VALUES (?, ?, ?, ?, ?, ?)',
        (data['user_id'], data['username'], data['content'], 
         data.get('reply_to'), data.get('chat_type', 'public'), data.get('chat_id', 'general'))
    )
    conn.commit()
    conn.close()
    return jsonify({'status': 'sent'})

@chat_bp.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    user_id = request.form['user_id']
    username = request.form['username']
    chat_id = request.form.get('chat_id', 'general')
    
    if file:
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        file_path = f"uploads/{filename}"
        os.makedirs('uploads', exist_ok=True)
        file.save(file_path)
        
        conn = get_db()
        conn.execute(
            'INSERT INTO messages (user_id, username, file_path, chat_id) VALUES (?, ?, ?, ?)',
            (user_id, username, file_path, chat_id)
        )
        conn.commit()
        conn.close()
        return jsonify({'status': 'uploaded', 'file_path': file_path})

@chat_bp.route('/groups', methods=['POST'])
def create_group():
    data = request.get_json()
    conn = get_db()
    cursor = conn.execute(
        'INSERT INTO chat_groups (name, created_by) VALUES (?, ?)',
        (data['name'], data['created_by'])
    )
    group_id = cursor.lastrowid
    conn.execute('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', (group_id, data['created_by']))
    conn.commit()
    conn.close()
    return jsonify({'group_id': group_id})

@chat_bp.route('/topics', methods=['GET'])
def get_topics():
    conn = get_db()
    topics = conn.execute('SELECT * FROM chat_topics ORDER BY created_at').fetchall()
    conn.close()
    return jsonify([dict(topic) for topic in topics])

@chat_bp.route('/topics', methods=['POST'])
def create_topic():
    data = request.get_json()
    conn = get_db()
    conn.execute(
        'INSERT INTO chat_topics (id, name, color) VALUES (?, ?, ?)',
        (data['id'], data['name'], data['color'])
    )
    conn.commit()
    conn.close()
    return jsonify({'status': 'created'})

@chat_bp.route('/groups/<int:group_id>/members', methods=['POST'])
def add_member():
    data = request.get_json()
    conn = get_db()
    conn.execute('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)', 
                (group_id, data['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'added'})