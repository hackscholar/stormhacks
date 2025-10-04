// Toggle objects
const toggles = {
    createProject: {
        element: document.getElementById('createProject'),
        action: function() {
            console.log('Create Project clicked');
            // Functionality to be implemented
        }
    },
    
    joinProject: {
        element: document.getElementById('joinProject'),
        action: function() {
            console.log('Join Project clicked');
            // Functionality to be implemented
        }
    },
    
    viewProjects: {
        element: document.getElementById('viewProjects'),
        action: function() {
            console.log('View Projects clicked');
            // Functionality to be implemented
        }
    }
};

// Add click listeners to toggle objects
Object.keys(toggles).forEach(key => {
    toggles[key].element.addEventListener('click', toggles[key].action);
});

// Profile dropdown functionality
document.getElementById('settings').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Settings clicked');
    // Functionality to be implemented
});

document.getElementById('profile').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Profile clicked');
    // Functionality to be implemented
});

document.getElementById('signOut').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'frontend/index.html';
});