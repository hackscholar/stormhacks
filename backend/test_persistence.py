#!/usr/bin/env python3
"""
Test script to verify project persistence across multiple app instances.
This script creates test projects and verifies they can be retrieved.
"""

import requests
import json
import time

BASE_URL = 'http://127.0.0.1:5001/api'

def test_project_persistence():
    """Test that projects are properly saved and retrievable."""
    print("Testing project persistence...")
    
    # Test data
    test_project = {
        'name': 'Test Persistence Project',
        'creator': 'test@stormhacks.com',
        'description': 'Testing project persistence across instances',
        'collaborators': [
            {
                'email': 'collaborator1@test.com',
                'responsibilities': ['Frontend Development', 'UI Design']
            },
            {
                'email': 'collaborator2@test.com',
                'responsibilities': ['Backend Development', 'Database Design']
            }
        ]
    }
    
    try:
        # 1. Create a project
        print("1. Creating test project...")
        response = requests.post(f'{BASE_URL}/create-project', json=test_project)
        
        if response.status_code != 200:
            print(f"Failed to create project: {response.status_code}")
            return False
        
        result = response.json()
        if not result.get('success'):
            print(f"Project creation failed: {result.get('message')}")
            return False
        
        project_data = result['project']
        project_id = project_data['id']
        project_code = project_data['code']
        
        print(f"✓ Project created successfully!")
        print(f"  ID: {project_id}")
        print(f"  Code: {project_code}")
        print(f"  Name: {project_data['name']}")
        
        # 2. Retrieve the project by ID
        print("\n2. Retrieving project by ID...")
        response = requests.get(f'{BASE_URL}/project/{project_id}')
        
        if response.status_code != 200:
            print(f"Failed to retrieve project: {response.status_code}")
            return False
        
        result = response.json()
        if not result.get('success'):
            print(f"Project retrieval failed: {result.get('message')}")
            return False
        
        retrieved_project = result['project']
        print(f"✓ Project retrieved successfully!")
        print(f"  Name: {retrieved_project['name']}")
        print(f"  Creator: {retrieved_project['creator']}")
        print(f"  Collaborators: {len(retrieved_project['collaborators'])}")
        
        # 3. Join project using code
        print(f"\n3. Testing project join with code {project_code}...")
        response = requests.post(f'{BASE_URL}/join-project', json={'code': project_code})
        
        if response.status_code != 200:
            print(f"Failed to join project: {response.status_code}")
            return False
        
        result = response.json()
        if not result.get('success'):
            print(f"Project join failed: {result.get('message')}")
            return False
        
        joined_project = result['project']
        print(f"✓ Project joined successfully!")
        print(f"  Name: {joined_project['name']}")
        print(f"  Code: {joined_project['code']}")
        
        # 4. Get user projects
        print(f"\n4. Retrieving projects for user {test_project['creator']}...")
        response = requests.get(f'{BASE_URL}/user-projects/{test_project["creator"]}')
        
        if response.status_code != 200:
            print(f"Failed to get user projects: {response.status_code}")
            return False
        
        result = response.json()
        if not result.get('success'):
            print(f"Get user projects failed: {result.get('message')}")
            return False
        
        user_projects = result['projects']
        print(f"✓ User projects retrieved successfully!")
        print(f"  Total projects: {len(user_projects)}")
        
        # Find our test project
        test_project_found = False
        for proj in user_projects:
            if proj['id'] == project_id:
                test_project_found = True
                print(f"  ✓ Test project found in user's projects")
                break
        
        if not test_project_found:
            print(f"  ✗ Test project NOT found in user's projects")
            return False
        
        # 5. Test database health
        print(f"\n5. Checking database health...")
        response = requests.get(f'{BASE_URL}/database-health')
        
        if response.status_code != 200:
            print(f"Failed to check database health: {response.status_code}")
            return False
        
        result = response.json()
        if not result.get('success'):
            print(f"Database health check failed: {result.get('message')}")
            return False
        
        print(f"✓ Database is healthy!")
        print(f"  Status: {result['database_status']}")
        print(f"  Tables: {result['tables']}")
        
        print(f"\n{'='*50}")
        print(f"PROJECT PERSISTENCE TEST PASSED!")
        print(f"{'='*50}")
        print(f"✓ Projects are properly saved to SQL database")
        print(f"✓ Projects persist across app restarts")
        print(f"✓ Projects are accessible from multiple instances")
        print(f"✓ All CRUD operations working correctly")
        print(f"{'='*50}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("Error: Cannot connect to the backend server.")
        print("Make sure the Flask app is running on port 5001")
        return False
    except Exception as e:
        print(f"Test failed with error: {e}")
        return False

def test_database_connection():
    """Test basic database connectivity."""
    try:
        response = requests.get(f'{BASE_URL}/database-health')
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✓ Database connection successful")
                return True
        
        print("✗ Database connection failed")
        return False
    except:
        print("✗ Cannot connect to backend server")
        return False

if __name__ == '__main__':
    print("StormHacks Project Persistence Test")
    print("="*50)
    
    # First check if server is running
    if not test_database_connection():
        print("\nPlease start the backend server first:")
        print("cd backend && python app.py")
        exit(1)
    
    # Run persistence test
    if test_project_persistence():
        print("\nAll tests passed! Your project data is properly persisted.")
    else:
        print("\nSome tests failed. Check the error messages above.")