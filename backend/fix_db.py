#!/usr/bin/env python3
from app import app, db, User
from werkzeug.security import generate_password_hash

def fix_database():
    with app.app_context():
        try:
            # Drop all tables and recreate
            db.drop_all()
            db.create_all()
            
            # Create a test user
            test_user = User(
                email='test@test.com',
                password=generate_password_hash('test', method='pbkdf2:sha256'),
                name='Test User'
            )
            db.session.add(test_user)
            db.session.commit()
            
            print("Database fixed successfully!")
            print("Test user created: test@test.com / test")
            
        except Exception as e:
            print(f"Error fixing database: {e}")

if __name__ == '__main__':
    fix_database()