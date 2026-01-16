import React, { useEffect, useState } from 'react';

interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'visitor' | 'employee' | 'admin';
  senderName?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatSession {
  id: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorName?: string;
  messageCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export function ChatManager() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState('Support Agent');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [showTeamChat] = useState(false); // Team chat hidden; handled via Teams section
  const [teamMessages] = useState<ChatMessage[]>([]);
  const [teamText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Load all sessions on mount
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Load messages for selected session
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
      const interval = setInterval(() => loadMessages(selectedSession), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/admin/chat-sessions');
      if (response.ok) {
        const data = await response.json();
        const newSessions = data.sessions || [];
        
        // Calculate total messages across all sessions
        const totalMessages = newSessions.reduce((sum: number, s: ChatSession) => sum + s.messageCount, 0);
        
        // Check if there are new messages
        if (previousMessageCount > 0 && totalMessages > previousMessageCount) {
          // Play sound alert
          playNotificationSound();
          
          // Show browser notification
          if (notificationsEnabled) {
            const newMessageCount = totalMessages - previousMessageCount;
            new Notification('New Customer Message', {
              body: `You have ${newMessageCount} new message${newMessageCount > 1 ? 's' : ''} from customers`,
              icon: '/favicon.svg',
              tag: 'chat-notification',
            });
          }
          
          // Send email notification
          sendEmailNotification(newSessions);
        }
        
        setPreviousMessageCount(totalMessages);
        setSessions(newSessions);
        
        // Calculate unread count (messages from visitors)
        const unread = newSessions.reduce((sum: number, s: ChatSession) => sum + s.messageCount, 0);
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const playNotificationSound = () => {
    // Play a simple notification beep
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzbM8dl+OAYgdcbw2IlBCBBbt+vqpF4UIkWd+fq6ZS0Fzt');
    audio.volume = 0.3;
    audio.play().catch(() => {/* Ignore errors */});
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        // Remove from local state
        setMessages(messages.filter((m) => m.id !== messageId));
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleDeleteTeamMessage = (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    setTeamMessages(teamMessages.filter((m) => m.id !== messageId));
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this entire conversation? This cannot be undone.')) return;

    try {
      const response = await fetch('/api/admin/chat-sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        // Remove from local state
        setSessions(sessions.filter((s) => s.id !== sessionId));
        // Clear messages if this session was selected
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
      } else {
        console.error('Failed to delete session');
        alert('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting conversation');
    }
  };

  const sendEmailNotification = async (sessions: ChatSession[]) => {
    // Only send if there are active sessions
    if (sessions.length === 0) return;
    
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCount: sessions.length,
          latestSession: sessions[0],
        }),
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseText.trim() || !selectedSession || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/messages/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession,
          message: responseText,
          employeeName,
          employeeRole: 'employee', // TODO: Get from auth store
        }),
      });

      if (response.ok) {
        setResponseText('');
        loadMessages(selectedSession);
      }
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[70vh] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 shadow-xl">
      {/* Mobile Header with Sidebar Toggle */}
      <div className="lg:hidden bg-slate-850 border-b border-slate-800 p-3 flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-200">Chat</h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400 hover:text-slate-200 transition p-1.5"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sessions List - Sidebar */}
      <div className={`${
        sidebarOpen ? 'block' : 'hidden'
      } lg:block w-full lg:w-72 bg-slate-850/80 border-b lg:border-b-0 lg:border-r border-slate-800 max-h-[60vh] lg:max-h-none overflow-y-auto`}>
        <div className="p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-200">Chat Sessions</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">{sessions.length} active</p>
          {!notificationsEnabled && (
            <button
              onClick={() => {
                Notification.requestPermission().then((permission) => {
                  setNotificationsEnabled(permission === 'granted');
                });
              }}
              className="mt-2 text-[11px] text-blue-300 hover:text-blue-200 underline"
            >
              Enable notifications
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-800 overflow-y-auto max-h-[70vh]">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <p className="text-sm">No chat sessions yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center transition group ${
                  selectedSession === session.id
                    ? 'bg-slate-800/80 border-l-4 border-l-blue-500'
                    : 'hover:bg-slate-850'
                }`}
              >
                <button
                  onClick={() => setSelectedSession(session.id)}
                  className="flex-1 text-left p-4"
                >
                  <p className="font-semibold text-sm truncate text-slate-100">
                    {session.visitorName || session.visitorEmail || 'Visitor'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{session.visitorEmail}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{session.messageCount} messages</p>
                </button>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="pr-4 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300"
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>


      {/* Chat View */}
      <div className="flex-1 flex flex-col bg-slate-900/80 min-h-0">
        {!selectedSession && !showTeamChat && (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p className="text-center text-sm">
              {sessions.length === 0 ? 'No active chats' : 'Select a chat to start'}
            </p>
          </div>
        )}
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="bg-slate-850 border-b border-slate-800 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-50 text-sm md:text-base">Session {selectedSession.slice(0, 6)}…</h3>
                <p className="text-xs text-slate-400">Live customer support</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{messages.length} messages</span>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-slate-400 hover:text-slate-200 transition p-1"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-slate-900/50 to-slate-950">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p className="text-sm md:text-base">No messages in this session</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex group ${msg.senderType === 'visitor' ? 'justify-start' : 'justify-end'}`}
                  >
                    {msg.senderType !== 'visitor' && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity text-sm font-bold"
                        title="Delete message"
                      >
                        ✕
                      </button>
                    )}
                    <div
                      className={`max-w-md px-4 py-3 rounded-xl shadow relative ${
                        msg.senderType === 'visitor'
                          ? 'bg-slate-800 text-slate-100 rounded-bl-sm'
                          : 'bg-blue-600 text-white rounded-br-sm'
                      }`}
                    >
                      {msg.senderType !== 'visitor' && (
                        <p className="text-[11px] font-semibold mb-1 opacity-90">{msg.senderName}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p className="text-[11px] mt-2 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Response Input */}
            <form onSubmit={handleSendResponse} className="bg-slate-850 border-t border-slate-800 p-3 md:p-4 space-y-2 md:space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your name</label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Type your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-slate-700 rounded text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-blue-500 disabled:bg-slate-800"
                />
                <button
                  type="submit"
                  disabled={isLoading || !responseText.trim()}
                  className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded hover:bg-blue-700 disabled:bg-slate-700 transition text-sm font-medium touch-manipulation w-full md:w-auto"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Select a chat session to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
