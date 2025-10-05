#!/usr/bin/env python3
"""
Database initialization script for StormHacks project management system.
This ensures all tables are created and the database is properly set up
for persistent project storage across multiple app instances.
"""

from app import app, db, User, Project, Collaborator, Responsibility, Milestone, Task
import os

def init_database():
    """Initialize the database with all required tables."""
    try:
        with app.app_context():
            # Create database directory if it doesn't exist
            db_path = os.path.join(app.instance_path, 'stormhacks.db')
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            
            # Drop all tables and recreate (for development)
            print("Dropping existing tables...")
            db.drop_all()
            
            # Create all tables
            print("Creating database tables...")
            db.create_all()
            
            # Verify tables were created
            tables = db.engine.table_names()
            print(f"Created tables: {tables}")
            
            # Test basic operations
            print("Testing database operations...")
            
            # Test user creation
            test_user = User(
                email='test@example.com',
                password='test_password',
                name='Test User'
            )
            db.session.add(test_user)
            
            # Test project creation
            test_project = Project(
                id='test123',
                name='Test Project',
                creator='test@example.com',
                code='TEST01',
                description='Test project for database verification'
            )
            db.session.add(test_project)
            
            # Test collaborator creation
            test_collaborator = Collaborator(
                project_id='test123',
                email='collaborator@example.com'
            )
            db.session.add(test_collaborator)
            db.session.flush()
            
            # Test responsibility creation
            test_responsibility = Responsibility(
                collaborator_id=test_collaborator.id,
                description='Test responsibility'
            )
            db.session.add(test_responsibility)
            
            db.session.commit()
            
            # Verify data was saved
            user_count = User.query.count()
            project_count = Project.query.count()
            collaborator_count = Collaborator.query.count()
            responsibility_count = Responsibility.query.count()
            
            print(f"Database verification:")
            print(f"  Users: {user_count}")
            print(f"  Projects: {project_count}")
            print(f"  Collaborators: {collaborator_count}")
            print(f"  Responsibilities: {responsibility_count}")
            
            # Clean up test data
            db.session.delete(test_responsibility)
            db.session.delete(test_collaborator)
            db.session.delete(test_project)
            db.session.delete(test_user)
            db.session.commit()
            
            print("Database initialization completed successfully!")
            print(f"Database file location: {db_path}")
            
    except Exception as e:
        print(f"Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def check_database_integrity():
    """Check if the database is properly set up and accessible."""
    try:
        with app.app_context():
            # Check if all required tables exist
            required_tables = ['user', 'project', 'collaborator', 'responsibility', 'milestone', 'task']
            existing_tables = db.engine.table_names()
            
            missing_tables = [table for table in required_tables if table not in existing_tables]
            
            if missing_tables:
                print(f"Missing tables: {missing_tables}")
                return False
            
            # Test basic queries
            User.query.count()
            Project.query.count()
            Collaborator.query.count()
            Responsibility.query.count()
            Milestone.query.count()
            Task.query.count()
            
            print("Database integrity check passed!")
            return True
            
    except Exception as e:
        print(f"Database integrity check failed: {e}")
        return False

if __name__ == '__main__':
    print("Initializing StormHacks database...")
    
    if init_database():
        print("\n" + "="*50)
        print("DATABASE SETUP COMPLETE")
        print("="*50)
        print("Your project data will now persist across app restarts.")
        print("Database location: backend/instance/stormhacks.db")
        print("="*50)
    else:
        print("\n" + "="*50)
        print("DATABASE SETUP FAILED")
        print("="*50)
        print("Please check the error messages above and try again.")
        print("="*50)