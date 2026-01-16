import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { supabaseBrowser } from '../../utils/supabaseClient';

function ChatWidgetInner() {
  const {
    sessionId,
    messages,
    isOpen,
    isLoading,
    unreadCount,
    initializeSession,
    toggleChat,
    addMessage,
    setMessages,
    setIsLoading,
    markMessagesAsRead,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const [isPolling, setIsPolling] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      initializeSession(newSessionId);
    }
  }, [sessionId, initializeSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch once on open and subscribe to realtime updates
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    markMessagesAsRead();

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Subscribe to Supabase realtime for new messages in this session (guard if not configured or env missing)
    const realtimeEnabled = Boolean(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY && supabaseBrowser);
    if (!realtimeEnabled || !supabaseBrowser) return;

    try {
      const channel = supabaseBrowser
        .channel(`chat:${sessionId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        }, (payload) => {
          const m: any = payload.new;
          // Avoid duplicates
          if (messagesRef.current.some((x) => x.id === m.id)) return;
          addMessage({
            id: m.id,
            sessionId: m.session_id,
            senderType: m.sender_type,
            senderName: m.sender_name || undefined,
            message: m.message,
            timestamp: m.timestamp,
            isRead: m.is_read,
          });
        })
        .subscribe();

      return () => {
        if (supabaseBrowser) supabaseBrowser.removeChannel(channel);
      };
    } catch (err) {
      console.error('Realtime subscribe failed', err);
      return;
    }
  }, [isOpen, sessionId, setMessages, markMessagesAsRead, addMessage]);

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
        const updatedMessages = messages.filter((m) => m.id !== messageId);
        setMessages(updatedMessages);
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !sessionId || isLoading) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input,
          visitorEmail: visitorEmail || undefined,
          visitorName: visitorName || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          addMessage(data.message);
        }
        setInput('');
        // Clear email/name after first message
        if (visitorEmail || visitorName) {
          setVisitorEmail('');
          setVisitorName('');
        }
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-40 ${
          isOpen
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        aria-label="Open chat"
      >
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2h-2.93a1 1 0 00-.7.29l-1.14 1.14A1 1 0 008.05 15H8a1 1 0 01-1-1v-2.05a1 1 0 00-.29-.71l-1.14-1.14A1 1 0 005.93 10H4a2 2 0 01-2-2V5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 md:bottom-24 md:right-6 md:w-96 md:h-96 md:rounded-lg bg-white rounded-none md:rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 md:rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-base md:text-lg">ColorAuto Support</h3>
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200 transition p-1.5 md:p-1"
                aria-label="Close chat"
              >
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-blue-100 mt-1">We typically reply in minutes</p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50 space-y-2 md:space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm md:text-base">Start a conversation</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'visitor' ? 'justify-end' : 'justify-start'} group`}
                  >
                    {msg.senderType === 'visitor' && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="hidden md:block absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity text-xs font-bold"
                        title="Delete message"
                      >
                        ✕
                      </button>
                    )}
                    <div
                      className={`max-w-xs md:max-w-xs px-3 md:px-4 py-2 rounded-lg relative ${
                        msg.senderType === 'visitor'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {msg.senderType !== 'visitor' && (
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          {msg.senderName || 'Support'}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {msg.senderType === 'visitor' && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition text-xs"
                          title="Delete message"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 md:p-4 bg-white md:rounded-b-lg rounded-none space-y-2 md:space-y-3">
            {/* Show email/name inputs only on first message */}
            {messages.filter((m) => m.senderType === 'visitor').length === 0 && (
              <>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white px-4 md:px-5 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition text-sm font-medium touch-manipulation min-w-16 md:min-w-12"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

class ChatWidgetErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ChatWidget error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <button
          onClick={() => this.setState({ hasError: false })}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-600 text-white shadow-lg z-40"
        >
          !
        </button>
      );
    }
    return this.props.children;
  }
}

export function ChatWidget() {
  return (
    <ChatWidgetErrorBoundary>
      <ChatWidgetInner />
    </ChatWidgetErrorBoundary>
  );
}
