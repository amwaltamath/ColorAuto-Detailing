# Chat Feature Documentation

## Overview

The chat feature allows customers and visitors to send messages to ColorAuto Detailing support staff. Employees and admins can respond to messages in real-time using the employee dashboard.

## Architecture

### Components

1. **ChatWidget** (`src/components/features/ChatWidget.tsx`)
   - Sticky chat button visible on all pages
   - Appears in bottom-right corner
   - Session-based for anonymous visitors
   - Real-time polling every 2 seconds
   - Shows unread message count badge

2. **ChatManager** (`src/components/features/ChatManager.tsx`)
   - Employee/admin dashboard interface
   - Left sidebar shows all active chat sessions
   - Main area displays message thread
   - Real-time response capability
   - Auto-refresh every 3 seconds for new sessions
   - Shows visitor name, email, and contact info

3. **Chat Store** (`src/stores/chatStore.ts`)
   - Zustand-based state management
   - Tracks sessions, messages, unread count
   - Persists in browser memory (not localStorage for privacy)

### API Endpoints

1. **GET /api/messages**
   - Query params: `sessionId`
   - Returns all messages for a session
   - Used by ChatWidget for polling

2. **POST /api/messages**
   - Body: `{ sessionId, message, visitorEmail?, visitorName? }`
   - Creates new message from visitor
   - Returns created message object

3. **POST /api/messages/respond**
   - Body: `{ sessionId, message, employeeName, employeeRole }`
   - Creates response from employee/admin
   - TODO: Add auth validation

4. **GET /api/admin/chat-sessions**
   - Returns all active chat sessions
   - Groups messages by sessionId
   - Used by ChatManager dashboard
   - TODO: Add auth validation

### Data Flow

**Visitor sends message:**
```
ChatWidget input → POST /api/messages → Server stores → Zustand store updated → Display
```

**Employee responds:**
```
ChatManager input → POST /api/messages/respond → Server stores → ChatWidget polls → Display
```

**Real-time updates:**
- ChatWidget polls `/api/messages` every 2 seconds when open
- ChatManager polls `/api/messages` every 2 seconds per selected session
- ChatManager polls `/api/admin/chat-sessions` every 3 seconds

## Session Management

- **Session ID**: Generated client-side as `session_{timestamp}_{randomId}`
- **Scope**: Per browser tab/window (browser memory)
- **Persistence**: Lost on page refresh (intentional for privacy)
- **Visitor Info**: Optional email/name collected on first message

## How to Use

### For Visitors
1. Click the blue chat button in bottom-right corner
2. (Optional) Enter name and email
3. Type message and click "Send"
4. Chat window shows responses from support staff

### For Employees
1. Go to Employee Dashboard (`/employee/dashboard`)
2. View all active chat sessions in left sidebar
3. Click a session to view message history
4. Enter your response and click "Send"
5. Sessions auto-refresh, newest first

## Storage (Current: In-Memory)

**Note**: Currently uses in-memory storage (messages lost on server restart).

### Migration to Supabase

When adding Supabase:

1. Create `messages` table:
```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY,
  sessionId text NOT NULL,
  senderType text NOT NULL, -- 'visitor' | 'employee' | 'admin'
  senderName text,
  message text NOT NULL,
  timestamp timestamp DEFAULT now(),
  isRead boolean DEFAULT false
);

CREATE INDEX idx_sessionId ON messages(sessionId);
CREATE INDEX idx_timestamp ON messages(timestamp);
```

2. Create `chat_sessions` table:
```sql
CREATE TABLE chat_sessions (
  id text PRIMARY KEY,
  visitorEmail text,
  visitorPhone text,
  visitorName text,
  createdAt timestamp DEFAULT now(),
  updatedAt timestamp DEFAULT now()
);
```

3. Update `/api/messages.ts`, `/api/messages/respond.ts`, `/api/admin/chat-sessions.ts` to query Supabase instead of in-memory array

4. Consider adding Supabase Realtime for true real-time updates instead of polling

## TODO Items

1. **Authentication**: Add auth checks to `/api/messages/respond` and `/api/admin/chat-sessions`
2. **Persistence**: Migrate to Supabase when ready
3. **Real-time**: Replace polling with Supabase Realtime subscriptions
4. **Email Notifications**: Send email to employees when new message arrives
5. **Message Read Status**: Track read status for unread message counts
6. **Session History**: Show past sessions in admin panel
7. **Typing Indicator**: Show when employee is typing
8. **File Attachments**: Support image/file uploads
9. **Rate Limiting**: Prevent chat spam
10. **Auto-close**: Close inactive sessions after X days

## Testing

### Manual Testing
1. Open multiple browser windows with the site
2. Send message from one window (visitor)
3. Check employee dashboard in another window
4. Type response and verify it appears in visitor window

### Browser DevTools
- Open Console to see polling requests
- Check Network tab for `/api/messages` requests (every 2-3 seconds)
- Use Redux DevTools extension to inspect Zustand store (if installed)

## Performance Notes

- Polling-based approach is simple but not optimized for high message volume
- Consider switching to Supabase Realtime when volume increases
- Chat widget adds ~15KB JS to bundle (lazy-loaded)
- Each open chat window polls independently
