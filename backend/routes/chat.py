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
        chat_id TEXT DEFAULT 'general',
        project_id TEXT NOT NULL
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS chat_topics (
        id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        project_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, project_id)
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS chat_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        project_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER,
        user_id INTEGER,
        PRIMARY KEY (group_id, user_id)
    )''')
    
    conn.commit()
    conn.close()

@chat_bp.route('/messages', methods=['GET'])
def get_messages():
    chat_id = request.args.get('chat_id', 'general')
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify([])
    
    conn = get_db()
    messages = conn.execute(
        'SELECT * FROM messages WHERE chat_id = ? AND project_id = ? ORDER BY timestamp DESC LIMIT 50',
        (chat_id, project_id)
    ).fetchall()
    conn.close()
    return jsonify([dict(msg) for msg in messages])

@chat_bp.route('/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'status': 'error', 'message': 'Project ID required'})
    
    conn = get_db()
    conn.execute(
        'INSERT INTO messages (user_id, username, content, reply_to, chat_type, chat_id, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        (data['user_id'], data['username'], data['content'], 
         data.get('reply_to'), data.get('chat_type', 'public'), data.get('chat_id', 'general'), project_id)
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
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify([])
    
    conn = get_db()
    topics = conn.execute('SELECT * FROM chat_topics WHERE project_id = ? ORDER BY created_at', (project_id,)).fetchall()
    
    # If no topics exist for this project, create default ones
    if not topics:
        conn.execute('''INSERT INTO chat_topics (id, name, color, project_id) VALUES 
            ('general', 'General', 'linear-gradient(135deg, #1e3c72, #c9a9dd)', ?),
            ('random', 'Random', 'linear-gradient(135deg, #2c5aa0, #b19cd9)', ?)''', (project_id, project_id))
        conn.commit()
        topics = conn.execute('SELECT * FROM chat_topics WHERE project_id = ? ORDER BY created_at', (project_id,)).fetchall()
    
    conn.close()
    return jsonify([dict(topic) for topic in topics])

@chat_bp.route('/topics', methods=['POST'])
def create_topic():
    data = request.get_json()
    project_id = data.get('project_id')
    if not project_id:
        return jsonify({'status': 'error', 'message': 'Project ID required'})
    
    conn = get_db()
    conn.execute(
        'INSERT INTO chat_topics (id, name, color, project_id) VALUES (?, ?, ?, ?)',
        (data['id'], data['name'], data['color'], project_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'status': 'created'})

@chat_bp.route('/topics/<topic_id>', methods=['DELETE'])
def delete_topic(topic_id):
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({'status': 'error', 'message': 'Project ID required'})
    
    conn = get_db()
    # Delete all messages for this topic in this project
    conn.execute('DELETE FROM messages WHERE chat_id = ? AND project_id = ?', (topic_id, project_id))
    # Delete the topic itself
    conn.execute('DELETE FROM chat_topics WHERE id = ? AND project_id = ?', (topic_id, project_id))
    conn.commit()
    conn.close()
    return jsonify({'status': 'deleted'})

@chat_bp.route('/groups/<int:group_id>/members', methods=['POST'])
def add_member():
    data = request.get_json()
    conn = get_db()
    conn.execute('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)', 
                (group_id, data['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'added'})