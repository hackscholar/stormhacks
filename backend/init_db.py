#!/usr/bin/env python3
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import app, db, User
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")
        
        # Test database connection by creating a test user
        test_user = User.query.filter_by(email='test@test.com').first()
        if not test_user:
            from werkzeug.security import generate_password_hash
            test_user = User(
                email='test@test.com',
                password=generate_password_hash('test123'),
                name='Test User'
            )
            db.session.add(test_user)
            db.session.commit()
            print("Test user created successfully!")
        else:
            print("Test user already exists")
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"Available tables: {tables}")
        
except Exception as e:
    print(f"Error initializing database: {e}")
    import traceback
    traceback.print_exc()