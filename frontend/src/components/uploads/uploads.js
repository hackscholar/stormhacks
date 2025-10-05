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
    // Initialize upload functionality
    const initializeUploadFunctions = () => {
          const uploadDiv = document.createElement('div');
          uploadDiv.className = 'upload-component';
          uploadDiv.innerHTML = `
            <div style="min-height: 100vh; background: #8178A1; display: flex; font-family: Arial, sans-serif;">
              <div style="width: 350px; background: rgba(255, 255, 255, 0.1); padding: 20px; backdrop-filter: blur(10px); border-right: 1px solid rgba(255, 255, 255, 0.2);">
                <button onclick="window.quickUpload()" style="margin: 10px 5px 10px 0; padding: 8px 16px; background: rgba(255, 249, 196, 0.6); color: #333; border: 2px solid #fffacd; border-radius: 25px; cursor: pointer; width: 100%; font-weight: 600;">
                  Upload File
                </button>
                <button onclick="window.createFolder()" style="margin: 10px 0; padding: 8px 16px; background: rgba(255, 249, 196, 0.6); color: #333; border: 2px solid #fffacd; border-radius: 25px; cursor: pointer; width: 100%; font-weight: 600;">
                  Create Folder
                </button>
                <label style="display: flex; align-items: center; margin: 10px 0; font-size: 12px; color: white;">
                  <input type="checkbox" id="log-history-toggle" style="margin-right: 5px;">
                  Log to version history
                </label>
                <button onclick="window.saveSnapshot()" style="margin: 10px 0; padding: 8px 16px; background: rgba(255, 249, 196, 0.6); color: #333; border: 2px solid #fffacd; border-radius: 25px; cursor: pointer; width: 100%; font-weight: 600;">
                  Save Snapshot
                </button>
                <input type="file" id="hidden-file-input" accept=".txt,.pdf,.doc,.docx,.jpg,.png,.gif" style="display: none;" />
                <div id="upload-status" style="margin-top: 10px;"></div>
                <div style="margin-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.3); padding-top: 15px;">
                  <h5 style="margin: 0 0 10px 0; font-size: 14px; color: white;">Version History</h5>
                  <div id="version-history" style="max-height: 200px; overflow-y: scroll; font-size: 12px; scrollbar-gutter: stable; -webkit-overflow-scrolling: touch;"></div>
                </div>
              </div>
              <div style="flex: 1; padding: 40px; display: flex; justify-content: center; align-items: flex-start;">
                <div id="folder-list"></div>
              </div>
            </div>
          `;
          // Functions are now available globally
          
          // Add global functions
          window.quickUpload = () => {
            const fileInput = document.getElementById('hidden-file-input');
            fileInput.click();
          };
          
          // Add event listener after a short delay to ensure DOM is ready
          setTimeout(() => {
            const fileInput = document.getElementById('hidden-file-input');
            if (fileInput) {
              fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                  window.showFolderSelection(e.target.files[0]);
                }
              });
            }
          }, 100);
          
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
              const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
              if (!currentProject.id) {
                document.getElementById('upload-status').innerHTML = '<p style="color: red;">No project selected</p>';
                return;
              }
              const response = await fetch('http://127.0.0.1:5000/api/create-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  folder_name: folderName,
                  parent_path: parentPath || 'root',
                  log_history: document.getElementById('log-history-toggle').checked,
                  project_id: currentProject.id
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
              const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
              const response = await fetch(`http://127.0.0.1:5000/api/folder-tree?project_id=${currentProject.id}`);
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
              
              folderList.innerHTML = '';
              
              // Add root folder with new styling
              folderList.innerHTML += `
                <div style="margin: 10px 0; padding: 15px 20px; background: rgba(255, 250, 250, 0.8); border-radius: 20px; border: 1px solid #f0f0f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="cursor: pointer; color: #470F59; font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 10px;" onclick="window.toggleFolder('root')">
                      Root folder <span id="root-toggle" style="color: #8178A1;">▶</span>
                    </span>
                    <button onclick="window.createFolder('root')" style="padding: 8px 15px; background: #470F59; color: white; border: none; border-radius: 15px; cursor: pointer; font-size: 12px; font-weight: 600;">+ Subfolder</button>
                  </div>
                  <div id="root-files" style="display: none; margin-top: 15px; padding-left: 20px;"></div>
                </div>
              `;
              
              // Don't show any folders at top level - they will appear when root is expanded
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
                const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
                const response = await fetch(`http://127.0.0.1:5000/api/folder-contents/${folderPath}?project_id=${currentProject.id}`);
                const result = await response.json();
                
                let content = '';
                
                if (result.items && result.items.length > 0) {
                  result.items.forEach(item => {
                    if (item.type === 'folder') {
                      // Calculate indentation based on folder depth
                      const folderDepth = item.path.split('/').length;
                      const indent = folderDepth * 20;
                      
                      // Add subfolder with new styling
                      content += `
                        <div style="margin: 8px 0; padding: 12px 15px; background: rgba(113, 120, 161, 0.1); border-radius: 15px; margin-left: ${indent}px; border-left: 3px solid #8178A1;">
                          <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="cursor: pointer; color: #470F59; font-weight: 500; display: flex; align-items: center; gap: 8px;" onclick="window.toggleFolder('${item.path}')">
                              ${item.name} <span id="${item.path.replace(/\//g, '-')}-toggle" style="color: #8178A1;">▶</span>
                            </span>
                            <div style="display: flex; gap: 5px;">
                              <button onclick="window.createFolder('${item.path}')" style="padding: 4px 8px; background: #470F59; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 11px;">+ Sub</button>
                              <button onclick="window.deleteFolder('${item.path}', '${item.name}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 11px;">Delete</button>
                            </div>
                          </div>
                          <div id="${item.path.replace(/\//g, '-')}-files" style="display: none; margin-top: 10px;"></div>
                        </div>
                      `;
                    } else {
                      // Calculate indentation for files
                      const folderDepth = folderPath === 'root' ? 0 : folderPath.split('/').length;
                      const fileIndent = (folderDepth + 1) * 20;
                      
                      // Add file with new styling
                      const filePath = folderPath === 'root' ? item.name : `${folderPath}/${item.name}`;
                      content += `<div style="margin: 5px 0; padding: 10px 15px; background: white; border-radius: 12px; border-left: 3px solid #470F59; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-left: ${fileIndent}px; transition: all 0.2s ease;" onclick="window.previewFile('${filePath}', '${item.name}')" onmouseover="this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)'" onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: #470F59; font-weight: 500;">${item.name}</span>
                          <span style="color: #7C7171; font-size: 12px; margin-left: auto;">${item.size} bytes</span>
                        </div>
                      </div>`;
                    }
                  });
                } else {
                  content = '<div style="color: #7C7171; font-size: 14px; text-align: center; padding: 20px; font-style: italic;">Empty folder</div>';
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
            if (window.currentModal && window.currentModal.parentNode) {
              document.body.removeChild(window.currentModal);
            }
          };
          
          window.cancelUpload = () => {
            if (window.currentModal && window.currentModal.parentNode) {
              document.body.removeChild(window.currentModal);
            }
          };
          
          window.uploadSelectedFile = async (file, folderName) => {
            const statusDiv = document.getElementById('upload-status');
            
            const formData = new FormData();
            const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
            formData.append('file', file);
            formData.append('folder', folderName);
            formData.append('log_history', document.getElementById('log-history-toggle').checked);
            formData.append('project_id', currentProject.id);
            
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
              const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
              const response = await fetch('http://127.0.0.1:5000/api/delete-folder', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  folder_path: folderPath,
                  log_history: document.getElementById('log-history-toggle').checked,
                  project_id: currentProject.id
                })
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
              const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
              const response = await fetch(`http://127.0.0.1:5000/api/file-preview/${filePath}?project_id=${currentProject.id}`);
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
          
          window.addToHistory = (action, item, type) => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const dateStr = now.toLocaleDateString();
            
            const historyDiv = document.getElementById('version-history');
            const entry = document.createElement('div');
            const color = action === 'Added' ? '#470F59' : '#dc3545';
            entry.style.cssText = 'margin: 8px 0; padding: 12px 15px; background: white; border-radius: 12px; border-left: 3px solid ' + color + '; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
            
            entry.innerHTML = `
              <div style="font-weight: 600; color: ${color}; font-size: 13px; margin-bottom: 4px;">${action} ${type}</div>
              <div style="color: #470F59; font-size: 12px; margin-bottom: 6px;">${item}</div>
              <div style="color: #7C7171; font-size: 10px;">${dateStr} ${timeStr}</div>
            `;
            
            historyDiv.insertBefore(entry, historyDiv.firstChild);
            
            // Keep only last 20 entries
            while (historyDiv.children.length > 20) {
              historyDiv.removeChild(historyDiv.lastChild);
            }
          };
          
          window.loadHistory = async () => {
            try {
              const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
              const response = await fetch(`http://127.0.0.1:5000/api/history?project_id=${currentProject.id}`);
              const result = await response.json();
              
              const historyDiv = document.getElementById('version-history');
              historyDiv.innerHTML = '';
              
              if (result.history && result.history.length > 0) {
                result.history.forEach(entry => {
                  const entryDiv = document.createElement('div');
                  const color = entry.action === 'Added' ? '#470F59' : entry.action === 'Snapshot' ? '#8178A1' : '#dc3545';
                  entryDiv.style.cssText = 'margin: 8px 0; padding: 12px 15px; background: white; border-radius: 12px; border-left: 3px solid ' + color + '; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
                  
                  entryDiv.innerHTML = `
                    <div style="font-weight: 600; color: ${color}; font-size: 13px; margin-bottom: 4px;">${entry.action} ${entry.type}</div>
                    <div style="color: #470F59; font-size: 12px; margin-bottom: 6px;">${entry.item}</div>
                    <div style="color: #7C7171; font-size: 10px; margin-bottom: 8px;">${entry.timestamp}</div>
                    <button onclick="window.revertToVersion(${entry.id})" style="padding: 4px 10px; background: #470F59; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 10px; font-weight: 500;">Revert</button>
                  `;
                  
                  historyDiv.appendChild(entryDiv);
                });
              } else {
                historyDiv.innerHTML = '<div style="color: #7C7171; font-style: italic; text-align: center; padding: 20px; font-size: 12px;">No history yet</div>';
              }
            } catch (error) {
              console.error('Failed to load history');
            }
          };
          
          window.saveSnapshot = async () => {
            const snapshotName = prompt('Enter a name for this snapshot:');
            if (!snapshotName) return;
            
            try {
              const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
              const response = await fetch('http://127.0.0.1:5000/api/create-snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  snapshot_name: snapshotName,
                  project_id: currentProject.id
                })
              });
              
              const result = await response.json();
              if (result.success) {
                document.getElementById('upload-status').innerHTML = '<p style="color: green;">Snapshot saved!</p>';
                await window.loadHistory();
              } else {
                document.getElementById('upload-status').innerHTML = `<p style="color: red;">${result.message}</p>`;
              }
            } catch (error) {
              document.getElementById('upload-status').innerHTML = '<p style="color: red;">Failed to save snapshot</p>';
            }
          };
          
          window.revertToVersion = async (historyId) => {
            const confirmed = confirm('Are you sure you want to revert to this version? This will restore the entire file structure from that point in time.');
            
            if (!confirmed) return;
            
            try {
              const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}');
              const response = await fetch(`http://127.0.0.1:5000/api/revert/${historyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: currentProject.id })
              });
              
              const result = await response.json();
              if (result.success) {
                document.getElementById('upload-status').innerHTML = '<p style="color: green;">Successfully reverted to previous version!</p>';
                await window.loadFolders();
                await window.loadHistory();
              } else {
                document.getElementById('upload-status').innerHTML = `<p style="color: red;">${result.message}</p>`;
              }
            } catch (error) {
              document.getElementById('upload-status').innerHTML = '<p style="color: red;">Failed to revert</p>';
            }
          };
          
          // Load folders and history immediately
          window.loadFolders();
          window.loadHistory();
    };
    
    initializeUploadFunctions();
  }, []);

  return (
    <div className="upload-component">
      <div style={{minHeight: '100vh', background: '#8178A1', display: 'flex', fontFamily: 'Arial, sans-serif'}}>
        <div style={{width: '350px', background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)', borderRight: '1px solid rgba(255, 255, 255, 0.2)'}}>
          <button onClick={() => window.quickUpload && window.quickUpload()} style={{margin: '10px 5px 10px 0', padding: '8px 16px', background: 'rgba(255, 249, 196, 0.6)', color: '#333', border: '2px solid #fffacd', borderRadius: '25px', cursor: 'pointer', width: '100%', fontWeight: '600'}}>
            Upload File
          </button>
          <button onClick={() => window.createFolder && window.createFolder()} style={{margin: '10px 0', padding: '8px 16px', background: 'rgba(255, 249, 196, 0.6)', color: '#333', border: '2px solid #fffacd', borderRadius: '25px', cursor: 'pointer', width: '100%', fontWeight: '600'}}>
            Create Folder
          </button>
          <label style={{display: 'flex', alignItems: 'center', margin: '10px 0', fontSize: '12px', color: 'white'}}>
            <input type="checkbox" id="log-history-toggle" style={{marginRight: '5px'}} />
            Log to version history
          </label>
          <button onClick={() => window.saveSnapshot && window.saveSnapshot()} style={{margin: '10px 0', padding: '8px 16px', background: 'rgba(255, 249, 196, 0.6)', color: '#333', border: '2px solid #fffacd', borderRadius: '25px', cursor: 'pointer', width: '100%', fontWeight: '600'}}>
            Save Snapshot
          </button>
          <input type="file" id="hidden-file-input" accept=".txt,.pdf,.doc,.docx,.jpg,.png,.gif" style={{display: 'none'}} />
          <div id="upload-status" style={{marginTop: '10px'}}></div>
          <div style={{marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.3)', paddingTop: '15px'}}>
            <h5 style={{margin: '0 0 10px 0', fontSize: '14px', color: 'white'}}>Version History</h5>
            <div id="version-history" style={{maxHeight: '200px', overflowY: 'scroll', fontSize: '12px', scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch'}}></div>
          </div>
        </div>
        <div style={{flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start'}}>
          <div id="folder-list"></div>
        </div>
      </div>
    </div>
  );
}

export default Uploads;