import React, { useState, useEffect } from 'react';

const Chatroom = ({ currentUser, chatId = 'general' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [chatrooms, setChatrooms] = useState(() => {
    const stored = localStorage.getItem('chatrooms');
    return stored ? JSON.parse(stored) : [
      { id: 'general', name: 'General', color: 'linear-gradient(135deg, #1e3c72, #c9a9dd)', pinned: false, hasUnread: false, lastRead: Date.now() }
    ];
  });
  const [isAttachHovered, setIsAttachHovered] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicName, setEditTopicName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [hoveredAttachment, setHoveredAttachment] = useState(null);

  const [touchStart, setTouchStart] = useState(null);
  const [hoveredTopic, setHoveredTopic] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const getRandomGradient = () => {
    const gradients = [
      'linear-gradient(135deg, #1e3c72, #c9a9dd)',
      'linear-gradient(135deg, #2c5aa0, #b19cd9)',
      'linear-gradient(135deg, #1a237e, #d1c4e9)',
      'linear-gradient(135deg, #283593, #ce93d8)',
      'linear-gradient(135deg, #303f9f, #ba68c8)',
      'linear-gradient(135deg, #3949ab, #ab47bc)',
      'linear-gradient(135deg, #3f51b5, #9c27b0)',
      'linear-gradient(135deg, #1565c0, #e1bee7)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  useEffect(() => {
    fetchTopics();
    fetchMessages();
    markAsRead(activeChatId);
    
    const interval = setInterval(() => {
      fetch(`http://localhost:5000/api/chat/messages?chat_id=${activeChatId}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('API not available');
        })
        .then(data => {
          setMessages(data.reverse());
          checkForUnreadMessages();
        })
        .catch(() => {
          // Don't update messages if API is down - keep local messages
        });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChatId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Delete, Backspace, or 'd' key
      if ((e.key === 'Delete' || e.key === 'Backspace' || e.key === 'd') && activeChatId !== 'general') {
        e.preventDefault();
        const currentTopic = chatrooms.find(room => room.id === activeChatId);
        if (currentTopic) {
          setTopicToDelete(currentTopic);
          setShowDeleteModal(true);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeChatId, chatrooms]);



  const fetchTopics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/topics');
      if (response.ok) {
        const data = await response.json();
        setChatrooms(data);
      } else {
        // Load from localStorage as fallback
        const stored = localStorage.getItem('chatrooms');
        if (stored) {
          setChatrooms(JSON.parse(stored));
        }
      }
    } catch (error) {
      // Load from localStorage as fallback
      const stored = localStorage.getItem('chatrooms');
      if (stored) {
        setChatrooms(JSON.parse(stored));
      }
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/messages?chat_id=${activeChatId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse());
      } else {
        // Load from localStorage as fallback
        const stored = localStorage.getItem(`messages_${activeChatId}`);
        setMessages(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      // Load from localStorage as fallback
      const stored = localStorage.getItem(`messages_${activeChatId}`);
      setMessages(stored ? JSON.parse(stored) : []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    
    try {
      if (selectedFile) {
        // Handle file upload with optional text
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('user_id', currentUser.id);
        formData.append('username', currentUser.name);
        formData.append('chat_id', activeChatId);
        if (newMessage.trim()) formData.append('content', newMessage);
        if (replyTo) formData.append('reply_to', replyTo);
        
        const response = await fetch('http://localhost:5000/api/chat/upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          fetchMessages();
        } else {
          // Fallback: add file message locally
          const newMsg = {
            id: Date.now(),
            username: currentUser.name,
            content: newMessage.trim() || null,
            file_path: `uploads/${selectedFile.name}`,
            timestamp: new Date().toISOString(),
            reply_to: replyTo
          };
          const updatedMessages = [...messages, newMsg];
          setMessages(updatedMessages);
          localStorage.setItem(`messages_${activeChatId}`, JSON.stringify(updatedMessages));
        }
      } else {
        // Handle text-only message
        const response = await fetch('http://localhost:5000/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            username: currentUser.name,
            content: newMessage,
            reply_to: replyTo,
            chat_id: activeChatId
          })
        });
        
        if (response.ok) {
          fetchMessages();
        } else {
          // Fallback: add message locally
          const newMsg = {
            id: Date.now(),
            username: currentUser.name,
            content: newMessage,
            timestamp: new Date().toISOString(),
            reply_to: replyTo
          };
          const updatedMessages = [...messages, newMsg];
          setMessages(updatedMessages);
          localStorage.setItem(`messages_${activeChatId}`, JSON.stringify(updatedMessages));
        }
      }
    } catch (error) {
      // Fallback: add message locally
      const newMsg = {
        id: Date.now(),
        username: currentUser.name,
        content: newMessage.trim() || null,
        file_path: selectedFile ? `uploads/${selectedFile.name}` : null,
        timestamp: new Date().toISOString(),
        reply_to: replyTo
      };
      const updatedMessages = [...messages, newMsg];
      setMessages(updatedMessages);
      localStorage.setItem(`messages_${activeChatId}`, JSON.stringify(updatedMessages));
    }
    
    setNewMessage('');
    setSelectedFile(null);
    setReplyTo(null);
  };

  const createTopic = async () => {
    if (!newTopicName.trim()) return;
    
    // Check if topic name already exists
    const existingTopic = chatrooms.find(room => 
      room.name.toLowerCase() === newTopicName.trim().toLowerCase()
    );
    
    if (existingTopic) {
      alert('A topic with this name already exists!');
      return;
    }
    
    const newTopic = {
      id: newTopicName.toLowerCase().replace(/\s+/g, '-'),
      name: newTopicName,
      color: getRandomGradient(),
      pinned: false,
      hasUnread: false,
      lastRead: Date.now()
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/chat/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic)
      });
      
      if (response.ok) {
        fetchTopics();
      } else {
        const updatedRooms = [...chatrooms, newTopic];
        setChatrooms(updatedRooms);
        localStorage.setItem('chatrooms', JSON.stringify(updatedRooms));
      }
    } catch (error) {
      const updatedRooms = [...chatrooms, newTopic];
      setChatrooms(updatedRooms);
      localStorage.setItem('chatrooms', JSON.stringify(updatedRooms));
    }
    
    setNewTopicName('');
    setShowTopicModal(false);
  };

  const togglePin = (topicId) => {
    const updatedRooms = chatrooms.map(room => 
      room.id === topicId ? { ...room, pinned: !room.pinned } : room
    );
    setChatrooms(updatedRooms);
    localStorage.setItem('chatrooms', JSON.stringify(updatedRooms));
  };

  const getSortedChatrooms = () => {
    return [...chatrooms].sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Then unread (but after pinned)
      if (!a.pinned && !b.pinned) {
        if (a.hasUnread && !b.hasUnread) return -1;
        if (!a.hasUnread && b.hasUnread) return 1;
      }
      
      return 0;
    });
  };

  const markAsRead = (chatId) => {
    const updatedRooms = chatrooms.map(room => 
      room.id === chatId ? { ...room, hasUnread: false, lastRead: Date.now() } : room
    );
    setChatrooms(updatedRooms);
    localStorage.setItem('chatrooms', JSON.stringify(updatedRooms));
  };

  const checkForUnreadMessages = () => {
    const updatedRooms = chatrooms.map(room => {
      const roomMessages = messages.filter(msg => !msg.reply_to); // Only main messages
      const latestMessage = roomMessages[roomMessages.length - 1];
      
      if (latestMessage && room.id !== activeChatId) {
        const messageTime = new Date(latestMessage.timestamp).getTime();
        const hasUnread = messageTime > (room.lastRead || 0);
        return { ...room, hasUnread };
      }
      
      return room;
    });
    
    setChatrooms(updatedRooms);
    localStorage.setItem('chatrooms', JSON.stringify(updatedRooms));
  };

  const deleteTopic = async (topicId) => {
    try {
      // Delete topic and its messages from backend
      const response = await fetch(`http://localhost:5000/api/chat/topics/${topicId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchTopics();
      } else {
        const updatedRooms = chatrooms.filter(room => room.id !== topicId);
        setChatrooms(updatedRooms);
        localStorage.setItem('chatrooms', JSON.stringify(updatedRooms));
      }
    } catch (error) {
      const updatedRooms = chatrooms.filter(room => room.id !== topicId);
      setChatrooms(updatedRooms);
      localStorage.setItem('chatrooms', JSON.stringify(updatedRooms));
    }
    
    // Remove topic messages from localStorage
    localStorage.removeItem(`messages_${topicId}`);
    
    // Clear current messages if we're deleting the active topic
    if (activeChatId === topicId) {
      setMessages([]);
      setActiveChatId('general');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUserAvatar = (username) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=40&background=8178A1`;
  };

  const activeChat = chatrooms.find(chat => chat.id === activeChatId) || chatrooms[0];

  const getThreadMessages = (parentId) => {
    return messages.filter(msg => msg.reply_to === parentId);
  };

  const getMainMessages = () => {
    return messages.filter(msg => !msg.reply_to);
  };

  const openThread = (message) => {
    setSelectedThread(message);
    setShowThreadModal(true);
  };

  return (
    <div className="chatroom-compact" style={{
      width: '100%',
      height: '500px',
      background: '#8178A1',
      display: 'flex',
      fontFamily: 'Archivo, sans-serif',
      borderRadius: '20px',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '300px',
        background: 'rgba(255, 250, 250, 0.55)',
        borderRadius: '0 45px 0 0',
        padding: sidebarCollapsed ? '30px 10px' : '30px 20px',
        boxShadow: '4px 0 4px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          {!sidebarCollapsed && (
            <h2 style={{
              color: '#470F59',
              fontSize: '28px',
              fontWeight: '700',
              margin: 0
            }}>Topics</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: '#470F59',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {getSortedChatrooms().map(room => (
          <div
            key={room.id}
            onClick={() => {
              setActiveChatId(room.id);
              markAsRead(room.id);
            }}
            onMouseEnter={() => setHoveredTopic(room.id)}
            onMouseLeave={() => setHoveredTopic(null)}
            style={{
              padding: '15px 20px',
              margin: '10px 0',
              background: 'white',
              color: activeChatId === room.id ? '#470F59' : '#7C7171',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '400',
              transition: 'all 0.3s ease',
              border: activeChatId === room.id ? '2px solid #470F59' : '1px solid #ddd',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {room.hasUnread ? (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#dc3545'
                }} />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#28a745">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
              {!sidebarCollapsed && room.name}
            </div>
            {(hoveredTopic === room.id || room.pinned) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(room.id);
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: room.pinned ? '#FFD700' : '#ccc',
                  cursor: 'pointer',
                  fontSize: '16px',
                  opacity: room.pinned ? 1 : 0.8
                }}
              >
                ★
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={() => setShowTopicModal(true)}
          style={{
            width: '100%',
            padding: '15px',
            background: '#470F59',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          {sidebarCollapsed ? '+' : '+ New Topic'}
        </button>
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={() => window.history.back()}
          style={{
            width: '100%',
            padding: '15px',
            background: '#7C7171',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          {sidebarCollapsed ? '←' : '← Back to Project'}
        </button>
      </div>

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 250, 250, 0.9)',
        margin: '20px',
        borderRadius: '45px',
        overflow: 'hidden',
        boxShadow: '4px 4px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '30px',
          background: activeChat.color,
          color: 'white',
          borderRadius: '45px 45px 0 0'
        }}>
          {isEditingTopic ? (
            <input
              type="text"
              value={editTopicName}
              onChange={(e) => setEditTopicName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const updatedRooms = chatrooms.map(room => 
                    room.id === activeChatId ? { ...room, name: editTopicName } : room
                  );
                  setChatrooms(updatedRooms);
                  setIsEditingTopic(false);
                }
              }}
              onBlur={() => setIsEditingTopic(false)}
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '32px',
                fontWeight: '700',
                outline: 'none',
                borderRadius: '10px',
                padding: '5px 10px'
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '700'
              }}>{activeChat.name}</h1>
              
              <button
                onClick={() => {
                  setEditTopicName(activeChat.name);
                  setIsEditingTopic(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 30px',
          background: 'white'
        }}>
          {getMainMessages().map(msg => {
            const replies = getThreadMessages(msg.id);
            const visibleReplies = replies.slice(0, 2);
            const hasMoreReplies = replies.length > 2;
            
            return (
              <div key={msg.id} style={{
                marginBottom: '20px',
                padding: '15px 20px',
                background: 'rgba(255, 250, 250, 0.8)',
                borderRadius: '20px',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <img 
                    src={getUserAvatar(msg.username)} 
                    alt={msg.username}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px' }}
                  />
                  <div>
                    <strong style={{ color: '#470F59', fontSize: '16px' }}>{msg.username}</strong>
                    <div style={{ fontSize: '12px', color: '#7C7171' }}>{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
                
                {msg.content && <div style={{ color: '#333', fontSize: '16px', lineHeight: '1.4' }}>{msg.content}</div>}
                {msg.file_path && (
                  <div style={{ marginTop: '10px' }}>
                    <div 
                      onMouseEnter={() => setHoveredAttachment(msg.id)}
                      onMouseLeave={() => setHoveredAttachment(null)}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `/${msg.file_path}`;
                        link.download = msg.file_path.split('/').pop();
                        link.click();
                      }}
                      style={{
                        color: '#470F59',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '8px 12px',
                        background: hoveredAttachment === msg.id ? 'rgba(113, 120, 161, 0.3)' : 'rgba(113, 120, 161, 0.1)',
                        borderRadius: '15px',
                        width: 'fit-content',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📎 {msg.file_path.split('/').pop()}
                    </div>
                  </div>
                )}
              
                <button 
                  onClick={() => setReplyTo(msg.id)}
                  style={{
                    fontSize: '12px',
                    marginTop: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#8178A1',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Reply
                </button>
                
                {/* Nested Replies */}
                {visibleReplies.length > 0 && (
                  <div style={{ marginTop: '15px', marginLeft: '20px' }}>
                    {visibleReplies.map(reply => (
                      <div key={reply.id} style={{
                        marginBottom: '10px',
                        padding: '10px 15px',
                        background: 'rgba(113, 120, 161, 0.1)',
                        borderRadius: '15px',
                        borderLeft: '3px solid #8178A1'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                          <img 
                            src={getUserAvatar(reply.username)} 
                            alt={reply.username}
                            style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                          />
                          <div>
                            <strong style={{ color: '#470F59', fontSize: '14px' }}>{reply.username}</strong>
                            <div style={{ fontSize: '10px', color: '#7C7171' }}>{formatTime(reply.timestamp)}</div>
                          </div>
                        </div>
                        <div style={{ color: '#333', fontSize: '14px', lineHeight: '1.3' }}>{reply.content}</div>
                      </div>
                    ))}
                    
                    {hasMoreReplies && (
                      <button
                        onClick={() => openThread(msg)}
                        style={{
                          fontSize: '12px',
                          color: '#8178A1',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '600',
                          textDecoration: 'underline'
                        }}
                      >
                        See {replies.length - 2} more replies
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reply Indicator */}
        {replyTo && (
          <div style={{
            padding: '10px 30px',
            background: 'rgba(113, 120, 161, 0.1)',
            borderTop: '1px solid #f0f0f0',
            color: '#470F59'
          }}>
            Replying to message #{replyTo}
            <button 
              onClick={() => setReplyTo(null)} 
              style={{
                marginLeft: '15px',
                background: 'none',
                border: 'none',
                color: '#8178A1',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div style={{
            padding: '10px 30px',
            background: 'rgba(113, 120, 161, 0.1)',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#470F59'
            }}>
              📎 {selectedFile.name}
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8178A1',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Message Input */}
        <div style={{
          padding: '20px 30px',
          background: 'white',
          borderTop: selectedFile ? 'none' : '1px solid #f0f0f0',
          display: 'flex',
          gap: '15px',
          alignItems: 'center'
        }}>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setSelectedFile(file);
              }
            }}
          />
          <button
            onClick={() => document.getElementById('file-upload').click()}
            onMouseEnter={() => setIsAttachHovered(true)}
            onMouseLeave={() => setIsAttachHovered(false)}
            style={{
              padding: '12px',
              background: isAttachHovered ? '#8178A1' : 'rgba(113, 120, 161, 0.1)',
              color: isAttachHovered ? 'white' : '#333',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '45px',
              height: '45px',
              fontSize: '18px',
              transition: 'all 0.3s ease'
            }}
          >
            +
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              borderRadius: '20px',
              background: 'rgba(113, 120, 161, 0.1)',
              fontSize: '16px',
              color: '#333',
              outline: 'none'
            }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            onClick={sendMessage}
            style={{
              padding: '15px 25px',
              background: '#470F59',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Thread Modal */}
      {showThreadModal && selectedThread && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            width: '80%',
            height: '80%',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              background: '#8178A1',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0 }}>Thread</h2>
              <button
                onClick={() => setShowThreadModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Original Message */}
              <div style={{
                padding: '15px 20px',
                background: 'rgba(255, 250, 250, 0.8)',
                borderRadius: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <img 
                    src={getUserAvatar(selectedThread.username)} 
                    alt={selectedThread.username}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px' }}
                  />
                  <div>
                    <strong style={{ color: '#470F59', fontSize: '16px' }}>{selectedThread.username}</strong>
                    <div style={{ fontSize: '12px', color: '#7C7171' }}>{formatTime(selectedThread.timestamp)}</div>
                  </div>
                </div>
                <div style={{ color: '#333', fontSize: '16px', lineHeight: '1.4' }}>{selectedThread.content}</div>
              </div>
              
              {/* All Replies */}
              {getThreadMessages(selectedThread.id).map(reply => (
                <div key={reply.id} style={{
                  marginBottom: '15px',
                  marginLeft: '20px',
                  padding: '10px 15px',
                  background: 'rgba(113, 120, 161, 0.1)',
                  borderRadius: '15px',
                  borderLeft: '3px solid #8178A1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <img 
                      src={getUserAvatar(reply.username)} 
                      alt={reply.username}
                      style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                    />
                    <div>
                      <strong style={{ color: '#470F59', fontSize: '14px' }}>{reply.username}</strong>
                      <div style={{ fontSize: '10px', color: '#7C7171' }}>{formatTime(reply.timestamp)}</div>
                    </div>
                  </div>
                  <div style={{ color: '#333', fontSize: '14px', lineHeight: '1.3' }}>{reply.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Topic Modal */}
      {showDeleteModal && topicToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255, 250, 250, 0.95)',
            padding: '40px',
            borderRadius: '45px',
            boxShadow: '4px 4px 4px rgba(0,0,0,0.1)',
            minWidth: '400px'
          }}>
            <h3 style={{
              color: '#470F59',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center'
            }}>Delete Topic</h3>
            <p style={{
              color: '#7C7171',
              fontSize: '16px',
              textAlign: 'center',
              marginBottom: '30px'
            }}>Are you sure you want to delete "{topicToDelete.name}"? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  deleteTopic(topicToDelete.id);
                  setShowDeleteModal(false);
                  setTopicToDelete(null);
                }}
                style={{
                  padding: '12px 25px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setTopicToDelete(null);
                }}
                style={{
                  padding: '12px 25px',
                  background: '#7C7171',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {showTopicModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255, 250, 250, 0.95)',
            padding: '40px',
            borderRadius: '45px',
            boxShadow: '4px 4px 4px rgba(0,0,0,0.1)',
            minWidth: '400px'
          }}>
            <h3 style={{
              color: '#470F59',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center'
            }}>Create New Topic</h3>
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Topic name"
              onKeyPress={(e) => e.key === 'Enter' && createTopic()}
              style={{
                width: '100%',
                padding: '15px 20px',
                border: 'none',
                borderRadius: '20px',
                fontSize: '16px',
                marginBottom: '20px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={createTopic}
                style={{
                  padding: '12px 25px',
                  background: '#470F59',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
              <button 
                onClick={() => setShowTopicModal(false)}
                style={{
                  padding: '12px 25px',
                  background: '#7C7171',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatroom;