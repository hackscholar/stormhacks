import React, { useState, useEffect } from 'react';

function Uploads() {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      setUploadStatus(result.success ? 'success' : 'error');
    } catch (error) {
      setUploadStatus('error');
    }
  };

  useEffect(() => {
    // Auto-inject into ProjectView when on project page
    const injectIntoProjectView = () => {
      if (window.location.pathname.includes('/project/')) {
        const workspace = document.querySelector('.project-workspace');
        if (workspace && !workspace.querySelector('.upload-component')) {
          const uploadDiv = document.createElement('div');
          uploadDiv.className = 'upload-component';
          uploadDiv.innerHTML = `
            <button onclick="window.quickUpload()" style="margin: 10px 5px 10px 0; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Upload File
            </button>
            <button onclick="window.createFolder()" style="margin: 10px 0; padding: 8px 16px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;">
              Create Folder
            </button>
            <input type="file" id="hidden-file-input" accept=".txt,.pdf,.doc,.docx,.jpg,.png,.gif" style="display: none;" />
            <div id="upload-status" style="margin-top: 10px;"></div>
            <div id="folder-list" style="margin-top: 15px;"></div>
          `;
          workspace.appendChild(uploadDiv);
          
          // Add global functions
          window.quickUpload = () => {
            window.loadFolders().then(() => {
              const fileInput = document.getElementById('hidden-file-input');
              fileInput.click();
            });
          };
          
          document.getElementById('hidden-file-input').addEventListener('change', (e) => {
            if (e.target.files[0]) {
              window.showFolderSelection(e.target.files[0]);
            }
          });
          
          window.showFolderSelection = (file) => {
            const folders = window.currentFolders || [];
            
            // Create modal dialog
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
            
            const dialog = document.createElement('div');
            dialog.style.cssText = 'background: white; padding: 20px; border-radius: 8px; min-width: 300px; max-width: 400px;';
            
            const folderOptions = folders.map(folder => {
              const indent = '&nbsp;'.repeat(folder.path.split('/').length * 2);
              return `<option value="${folder.path}">${indent}${folder.name}</option>`;
            }).join('');
            
            dialog.innerHTML = `
              <h3>Select folder for "${file.name}"</h3>
              <select id="folder-dropdown" style="width: 100%; padding: 8px; margin: 10px 0; font-size: 14px;">
                <option value="">Root folder</option>
                ${folderOptions}
              </select>
              <div style="margin-top: 15px; text-align: right;">
                <button onclick="window.cancelUpload()" style="margin-right: 10px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button onclick="window.confirmUpload()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Upload</button>
              </div>
            `;
            
            modal.appendChild(dialog);
            document.body.appendChild(modal);
            
            window.currentFile = file;
            window.currentModal = modal;
          };
          
          window.createFolder = async (parentPath = '') => {
            const folderName = prompt(`Enter folder name${parentPath ? ` (inside ${parentPath})` : ''}:`);
            if (!folderName) return;
            
            try {
              const response = await fetch('http://127.0.0.1:5000/api/create-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  folder_name: folderName,
                  parent_path: parentPath || 'root'
                })
              });
              
              const result = await response.json();
              if (result.success) {
                await window.loadFolders();
                document.getElementById('upload-status').innerHTML = '<p style="color: green;">Folder created!</p>';
              } else {
                document.getElementById('upload-status').innerHTML = `<p style="color: red;">${result.message}</p>`;
              }
            } catch (error) {
              document.getElementById('upload-status').innerHTML = '<p style="color: red;">Failed to create folder</p>';
            }
          };
          
          window.loadFolders = async () => {
            try {
              const response = await fetch('http://127.0.0.1:5000/api/folder-tree');
              const result = await response.json();
              
              const folderList = document.getElementById('folder-list');
              // Store all folders for dropdown and internal use
              window.allFolders = (result.folders || []).map(folder => ({
                name: folder.name,
                path: folder.path,
                level: folder.level || 0
              }));
              
              // Only show folders for dropdown (all folders)
              window.currentFolders = window.allFolders;
              
              folderList.innerHTML = '<h4>File Structure:</h4>';
              
              // Add root folder
              folderList.innerHTML += `
                <div style="margin: 5px 0; padding: 5px; background: #e9ecef; border-radius: 3px;">
                  <span style="cursor: pointer;" onclick="window.toggleFolder('root')">
                    folder/Root folder <span id="root-toggle">▶</span>
                  </span>
                  <button onclick="window.createFolder('root')" style="margin-left: 10px; padding: 2px 6px; font-size: 11px; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer;">+ Subfolder</button>
                </div>
                <div id="root-files" style="display: none; margin-left: 50px; padding: 5px;"></div>
              `;
              
              // Only show top-level folders (level 0)
              const topLevelFolders = window.allFolders.filter(folder => folder.level === 0);
              
              if (topLevelFolders.length > 0) {
                topLevelFolders.forEach(folder => {
                  folderList.innerHTML += `
                    <div style="margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 3px;">
                      <span style="cursor: pointer;" onclick="window.toggleFolder('${folder.path}')">
                        folder/${folder.name} <span id="${folder.path.replace(/\//g, '-')}-toggle">▶</span>
                      </span>
                      <button onclick="window.createFolder('${folder.path}')" style="margin-left: 10px; padding: 2px 6px; font-size: 11px; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer;">+ Subfolder</button>
                      <button onclick="window.deleteFolder('${folder.path}', '${folder.name}')" style="margin-left: 5px; padding: 2px 6px; font-size: 11px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer;">Delete</button>
                    </div>
                    <div id="${folder.path.replace(/\//g, '-')}-files" style="display: none; margin-left: 50px; padding: 5px;"></div>
                  `;
                });
              }
            } catch (error) {
              console.error('Failed to load folders');
            }
          };
          
          window.toggleFolder = async (folderPath) => {
            const safeId = folderPath.replace(/\//g, '-');
            const filesDiv = document.getElementById(`${safeId}-files`);
            const toggle = document.getElementById(`${safeId}-toggle`);
            
            if (filesDiv.style.display === 'none') {
              // Load and show contents
              try {
                const response = await fetch(`http://127.0.0.1:5000/api/folder-contents/${folderPath}`);
                const result = await response.json();
                
                let content = '';
                
                if (result.items && result.items.length > 0) {
                  result.items.forEach(item => {
                    if (item.type === 'folder') {
                      // Calculate indentation based on folder depth
                      const folderDepth = item.path.split('/').length;
                      const indent = folderDepth * 50;
                      
                      // Add subfolder with full functionality
                      content += `
                        <div style="margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 3px; margin-left: ${indent}px;">
                          <span style="cursor: pointer;" onclick="window.toggleFolder('${item.path}')">
                            folder/${item.name} <span id="${item.path.replace(/\//g, '-')}-toggle">▶</span>
                          </span>
                          <button onclick="window.createFolder('${item.path}')" style="margin-left: 10px; padding: 2px 6px; font-size: 11px; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer;">+ Subfolder</button>
                          <button onclick="window.deleteFolder('${item.path}', '${item.name}')" style="margin-left: 5px; padding: 2px 6px; font-size: 11px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer;">Delete</button>
                        </div>
                        <div id="${item.path.replace(/\//g, '-')}-files" style="display: none; margin-left: ${indent + 50}px; padding: 5px;"></div>
                      `;
                    } else {
                      // Calculate indentation for files
                      const folderDepth = folderPath === 'root' ? 0 : folderPath.split('/').length;
                      const fileIndent = (folderDepth + 1) * 50;
                      
                      // Add file with click handler
                      const filePath = folderPath === 'root' ? item.name : `${folderPath}/${item.name}`;
                      content += `<div style="margin: 3px 0; padding: 4px; background: #fff; border-left: 2px solid #007bff; font-size: 13px; margin-left: ${fileIndent}px; cursor: pointer;" onclick="window.previewFile('${filePath}', '${item.name}')">
                        file/${item.name} <span style="color: #666;">(${item.size} bytes)</span>
                      </div>`;
                    }
                  });
                } else {
                  content = '<div style="color: #666; font-size: 12px;">Empty folder</div>';
                }
                
                filesDiv.innerHTML = content;
                filesDiv.style.display = 'block';
                toggle.textContent = '▼';
              } catch (error) {
                filesDiv.innerHTML = '<div style="color: red; font-size: 12px;">Error loading contents</div>';
                filesDiv.style.display = 'block';
                toggle.textContent = '▼';
              }
            } else {
              // Hide contents
              filesDiv.style.display = 'none';
              toggle.textContent = '▶';
            }
          };
          
          window.confirmUpload = () => {
            const dropdown = document.getElementById('folder-dropdown');
            const selectedFolder = dropdown.value;
            window.uploadSelectedFile(window.currentFile, selectedFolder);
            document.body.removeChild(window.currentModal);
          };
          
          window.cancelUpload = () => {
            document.body.removeChild(window.currentModal);
          };
          
          window.uploadSelectedFile = async (file, folderName) => {
            const statusDiv = document.getElementById('upload-status');
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folderName);
            
            try {
              const response = await fetch('http://127.0.0.1:5000/api/upload', {
                method: 'POST',
                body: formData
              });
              
              const result = await response.json();
              statusDiv.innerHTML = result.success ? 
                '<p style="color: green;">Upload successful!</p>' : 
                '<p style="color: red;">Upload failed!</p>';
            } catch (error) {
              statusDiv.innerHTML = '<p style="color: red;">Upload failed!</p>';
            }
          };
          
          window.deleteFolder = async (folderPath, folderName) => {
            const confirmed = confirm(`Are you sure you want to delete the folder "${folderName}" and all its contents? This action cannot be undone.`);
            
            if (!confirmed) return;
            
            try {
              const response = await fetch('http://127.0.0.1:5000/api/delete-folder', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder_path: folderPath })
              });
              
              const result = await response.json();
              if (result.success) {
                await window.loadFolders();
                document.getElementById('upload-status').innerHTML = '<p style="color: green;">Folder deleted successfully!</p>';
              } else {
                document.getElementById('upload-status').innerHTML = `<p style="color: red;">${result.message}</p>`;
              }
            } catch (error) {
              document.getElementById('upload-status').innerHTML = '<p style="color: red;">Failed to delete folder</p>';
            }
          };
          
          window.previewFile = async (filePath, fileName) => {
            try {
              const response = await fetch(`http://127.0.0.1:5000/api/file-preview/${filePath}`);
              const result = await response.json();
              
              if (!result.success) {
                alert('Failed to preview file: ' + result.message);
                return;
              }
              
              // Create preview modal
              const modal = document.createElement('div');
              modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;';
              
              const dialog = document.createElement('div');
              dialog.style.cssText = 'background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;';
              
              let content = '';
              
              if (result.type === 'text') {
                content = `
                  <h3>Preview: ${fileName}</h3>
                  <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow: auto; max-height: 400px; white-space: pre-wrap;">${result.content}</pre>
                `;
              } else if (result.type === 'image') {
                content = `
                  <h3>Preview: ${fileName}</h3>
                  <img src="data:${result.mime_type};base64,${result.content}" style="max-width: 100%; max-height: 400px; border-radius: 4px;" />
                `;
              } else {
                content = `
                  <h3>Preview: ${fileName}</h3>
                  <p style="color: #666;">${result.message}</p>
                `;
              }
              
              dialog.innerHTML = content + `
                <div style="margin-top: 15px; text-align: right;">
                  <button onclick="document.body.removeChild(this.closest('.preview-modal'))" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
              `;
              
              modal.className = 'preview-modal';
              modal.appendChild(dialog);
              document.body.appendChild(modal);
              
            } catch (error) {
              alert('Failed to preview file');
            }
          };
          
          // Load folders immediately
          window.loadFolders();
        }
      }
    };
    
    // Try to inject immediately and also after a delay
    injectIntoProjectView();
    setTimeout(injectIntoProjectView, 1000);
    setTimeout(injectIntoProjectView, 3000);
  }, []);

  return null;
}

export default Uploads;