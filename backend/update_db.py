#!/usr/bin/env python3
import sqlite3
import os

def update_databases():
    # Update uploads.db
    if os.path.exists('uploads.db'):
        conn = sqlite3.connect('uploads.db')
        cursor = conn.cursor()
        
        # Add project_id columns if they don't exist
        try:
            cursor.execute('ALTER TABLE folders ADD COLUMN project_id TEXT NOT NULL DEFAULT ""')
        except sqlite3.OperationalError:
            pass  # Column already exists
            
        try:
            cursor.execute('ALTER TABLE uploaded_files ADD COLUMN project_id TEXT NOT NULL DEFAULT ""')
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute('ALTER TABLE history ADD COLUMN project_id TEXT NOT NULL DEFAULT ""')
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute('ALTER TABLE snapshots ADD COLUMN project_id TEXT NOT NULL DEFAULT ""')
        except sqlite3.OperationalError:
            pass
        
        conn.commit()
        conn.close()
        print("Updated uploads.db")
    
    # Update stormhacks.db
    if os.path.exists('instance/stormhacks.db'):
        conn = sqlite3.connect('instance/stormhacks.db')
        cursor = conn.cursor()
        
        # Add project_id columns if they don't exist
        try:
            cursor.execute('ALTER TABLE messages ADD COLUMN project_id TEXT NOT NULL DEFAULT ""')
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute('ALTER TABLE chat_groups ADD COLUMN project_id TEXT NOT NULL DEFAULT ""')
        except sqlite3.OperationalError:
            pass
        
        # Update chat_topics to have composite primary key
        try:
            cursor.execute('ALTER TABLE chat_topics ADD COLUMN project_id TEXT NOT NULL DEFAULT ""')
        except sqlite3.OperationalError:
            pass
        
        conn.commit()
        conn.close()
        print("Updated stormhacks.db")

if __name__ == '__main__':
    update_databases()
    print("Database update complete!")