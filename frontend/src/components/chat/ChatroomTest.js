import React, { useState } from 'react';

const ChatroomTest = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      username: 'Ahmad',
      content: 'Hey everyone! How\'s the project going?',
      timestamp: new Date().toISOString(),
      reply_to: null
    },
    {
      id: 2,
      username: 'Adrian',
      content: 'Going great! Just finished the backend API.',
      timestamp: new Date().toISOString(),
      reply_to: null
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [activeChatId, setActiveChatId] = useState('general');
  const [chatrooms, setChatrooms] = useState([
    { id: 'general', name: 'General', color: 'linear-gradient(135deg, #1e3c72, #c9a9dd)' },
    { id: 'random', name: 'Random', color: 'linear-gradient(135deg, #2c5aa0, #b19cd9)' }
  ]);
  
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
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isAttachHovered, setIsAttachHovered] = useState(false);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: messages.length + 1,
      username: 'Annie',
      content: newMessage,
      timestamp: new Date().toISOString(),
      reply_to: null
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const createTopic = () => {
    if (!newTopicName.trim()) return;
    
    const newTopic = {
      id: newTopicName.toLowerCase().replace(/\s+/g, '-'),
      name: newTopicName,
      color: getRandomGradient()
    };
    
    setChatrooms([...chatrooms, newTopic]);
    setNewTopicName('');
    setShowTopicModal(false);
  };

  const activeChat = chatrooms.find(chat => chat.id === activeChatId) || chatrooms[0];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#8178A1',
      display: 'flex',
      fontFamily: 'Archivo, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '300px',
        background: 'rgba(255, 250, 250, 0.55)',
        borderRadius: '0 45px 0 0',
        padding: '30px 20px',
        boxShadow: '4px 0 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          color: '#470F59',
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '30px',
          textAlign: 'center'
        }}>Topics</h2>
        
        {chatrooms.map(room => (
          <div
            key={room.id}
            onClick={() => setActiveChatId(room.id)}
            style={{
              padding: '15px 20px',
              margin: '10px 0',
              background: activeChatId === room.id ? '#470F59' : 'white',
              color: activeChatId === room.id ? 'white' : '#7C7171',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '400'
            }}
          >
            # {room.name}
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
          + New Topic
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
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700'
          }}>#{activeChat.name}</h1>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 30px',
          background: 'white'
        }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              marginBottom: '20px',
              padding: '15px 20px',
              background: 'rgba(255, 250, 250, 0.8)',
              borderRadius: '20px',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#8178A1',
                  marginRight: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {msg.username[0]}
                </div>
                <div>
                  <strong style={{ color: '#470F59', fontSize: '16px' }}>{msg.username}</strong>
                  <div style={{ fontSize: '12px', color: '#7C7171' }}>Just now</div>
                </div>
              </div>
              {msg.content && <div style={{ color: '#333', fontSize: '16px', lineHeight: '1.4' }}>{msg.content}</div>}
              {msg.file_path && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{
                    color: '#470F59',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    background: 'rgba(113, 120, 161, 0.1)',
                    borderRadius: '15px',
                    width: 'fit-content'
                  }}>
                    📎 {msg.file_path.split('/').pop()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div style={{
          padding: '20px 30px',
          background: 'white',
          borderTop: '1px solid #f0f0f0',
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
                const newMsg = {
                  id: messages.length + 1,
                  username: 'Annie',
                  content: null,
                  file_path: `uploads/${file.name}`,
                  timestamp: new Date().toISOString(),
                  reply_to: null
                };
                setMessages([...messages, newMsg]);
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
          }}>
            Send
          </button>
        </div>
      </div>

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

export default ChatroomTest;