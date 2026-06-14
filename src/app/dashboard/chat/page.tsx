'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Paperclip, Send, Plus, Trash2, MoreVertical, Pencil, Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/contexts/NotificationContext';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  color?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'PRIVATE' | 'GROUP';
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    color?: string;
  }[];
  lastMessage?: {
    content: string;
    timestamp: Date;
  };
  isGlobal?: boolean;
}

export default function ChatPage() {
  // Replace this with your actual organization name from user context or API
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [participants, setParticipants] = useState<{ id: string, firstName: string, lastName: string }[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [groupAllUsers, setGroupAllUsers] = useState<{ id: string, firstName: string, lastName: string }[]>([]);
  const [savingGroupInfo, setSavingGroupInfo] = useState(false);

  // Fetch chat rooms from API
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const data = await res.json();
          setChatRooms(data);
        }
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
      }
    };
    fetchChatRooms();
  }, []);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${selectedChat}/messages`);
        if (res.ok) {
          const data = await res.json();
          const newMessages = data.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) }));

          // Check for new messages from other users
          if (messages.length > 0 && newMessages.length > messages.length) {
            const currentChat = chatRooms.find(chat => chat.id === selectedChat);
            const chatName = currentChat?.type === 'PRIVATE'
              ? `${currentChat.participants[0]?.firstName} ${currentChat.participants[0]?.lastName}`
              : currentChat?.name || 'Chat';

            // Get the newest message
            const newestMessage = newMessages[newMessages.length - 1];

            // Only show notification if it's not from the current user
            if (newestMessage && newestMessage.sender !== 'You') {
              addNotification({
                type: 'chat',
                title: `New message in ${chatName}`,
                message: `${newestMessage.sender}: ${newestMessage.content.substring(0, 50)}${newestMessage.content.length > 50 ? '...' : ''}`,
                clickAction: {
                  type: 'navigate',
                  path: '/dashboard/chat',
                },
                metadata: {
                  chatId: selectedChat,
                  senderId: newestMessage.sender,
                },
              });
            }
          }

          setMessages(newMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // Initial fetch
    fetchMessages();

    // Poll for new messages every 5 seconds when chat is selected
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [selectedChat, messages.length, chatRooms, addNotification]);

  // Fetch users for participant selection
  useEffect(() => {
    if (!showNewChatModal) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/practitioners');
        if (res.ok) {
          const data = await res.json();
          setParticipants(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [showNewChatModal]);

  // Fetch group info when modal opens
  useEffect(() => {
    if (!showGroupInfoModal || !selectedChat) return;
    const fetchGroupInfo = async () => {
      try {
        const res = await fetch(`/api/chat/${selectedChat}/info`);
        if (res.ok) {
          const data = await res.json();
          setGroupInfo(data);
          setEditedGroupName(data.name);
          setGroupParticipants(data.participants.map((p: any) => p.id));
        }
        // Fetch all users for participant editing
        const usersRes = await fetch('/api/practitioners');
        if (usersRes.ok) {
          setGroupAllUsers(await usersRes.json());
        }
      } catch (error) {
        console.error('Error fetching group info:', error);
      }
    };
    fetchGroupInfo();
  }, [showGroupInfoModal, selectedChat]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Here you would typically upload the file to your storage service
      const fileUrl = URL.createObjectURL(file);

      const newMessage: Message = {
        id: Date.now().toString(),
        content: '',
        sender: 'You',
        timestamp: new Date(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl,
        fileName: file.name,
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const res = await fetch(`/api/chat/${selectedChat}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, type: 'text' }),
      });
      if (res.ok) {
        // Option 1: Refetch all messages
        const messagesRes = await fetch(`/api/chat/${selectedChat}/messages`);
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          setMessages(data.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) })));

          // Show notification for new message
          // const currentChat = chatRooms.find(chat => chat.id === selectedChat);
          // const chatName = currentChat?.type === 'PRIVATE'
          //   ? `${currentChat.participants[0]?.firstName} ${currentChat.participants[0]?.lastName}`
          //   : currentChat?.name || 'Chat';

          // addNotification({
          //   type: 'chat',
          //   title: '',
          //   message: `Your message was sent to ${chatName}`,
          //   clickAction: {
          //     type: 'navigate',
          //     path: '/dashboard/chat',
          //   },
          //   metadata: {
          //     chatId: selectedChat,
          //   },
          // });
        }
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      handleSendMessage();
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleDeleteChat = (chatId: string) => {
    setChatRooms(prev => prev.filter(chat => chat.id !== chatId));
    if (selectedChat === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatName.trim() || selectedParticipants.length === 0) return;
    setCreatingChat(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChatName, participantIds: selectedParticipants, type: selectedParticipants.length > 1 ? 'GROUP' : 'PRIVATE' }),
      });
      if (res.ok) {
        const newChat = await res.json();
        // Refresh chat list
        const chatRes = await fetch('/api/chat');
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setChatRooms(chatData);
          setSelectedChat(newChat.id);
        }
        setShowNewChatModal(false);
        setNewChatName('');
        setSelectedParticipants([]);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  // Save group name/participants (dummy, implement backend as needed)
  const handleSaveGroupInfo = async () => {
    setSavingGroupInfo(true);
    // TODO: Implement backend PATCH/PUT for name/participants
    setEditingGroupName(false);
    setSavingGroupInfo(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* New Chat Modal */}
      <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-name">Chat Name</Label>
              <Input id="chat-name" value={newChatName} onChange={e => setNewChatName(e.target.value)} placeholder="Enter chat name" />
            </div>
            <div>
              <Label>Participants</Label>
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                {participants.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedParticipants.includes(user.id)}
                      onCheckedChange={checked => {
                        setSelectedParticipants(prev => checked ? [...prev, user.id] : prev.filter(id => id !== user.id));
                      }}
                    />
                    <Label htmlFor={`user-${user.id}`}>{user.firstName} {user.lastName}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateChat} disabled={creatingChat || !newChatName.trim() || selectedParticipants.length === 0}>
              Create Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Group Info Modal */}
      <Dialog open={showGroupInfoModal} onOpenChange={setShowGroupInfoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Group Info</DialogTitle>
          </DialogHeader>
          {groupInfo && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {editingGroupName ? (
                  <Input value={editedGroupName} onChange={e => setEditedGroupName(e.target.value)} className="flex-1" />
                ) : (
                  <h2 className="text-lg font-semibold flex-1">{groupInfo.name}</h2>
                )}
                <Button variant="ghost" size="icon" onClick={() => setEditingGroupName(v => !v)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">Created: {new Date(groupInfo.createdAt).toLocaleString()}</div>
              <div>
                <Label>Participants</Label>
                <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                  {groupAllUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`group-user-${user.id}`}
                        checked={groupParticipants.includes(user.id)}
                        onCheckedChange={checked => {
                          setGroupParticipants(prev => checked ? [...prev, user.id] : prev.filter(id => id !== user.id));
                        }}
                      />
                      <Label htmlFor={`group-user-${user.id}`}>{user.firstName} {user.lastName}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Messages</Label>
                <div>Total: {groupInfo.totalMessages}</div>
                <ul className="text-sm mt-1">
                  {Object.entries(groupInfo.messagesPerParticipant as Record<string, number>).map(([id, count]) => {
                    const user = groupAllUsers.find(u => u.id === id);
                    return (
                      <li key={id}>{user ? `${user.firstName} ${user.lastName}` : id}: {count}</li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <Label>Files</Label>
                <ul className="text-sm mt-1 space-y-1">
                  {groupInfo.files.map((file: any) => (
                    <li key={file.id}>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {file.fileName || file.fileUrl}
                      </a> <span className="text-xs text-muted-foreground">({file.type})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSaveGroupInfo} disabled={savingGroupInfo}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Sidebar */}
      <div className="w-80 border-r bg-background">
        <div className="p-4 border-b">
          <Button className="w-full" onClick={() => setShowNewChatModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          {chatRooms.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 border-b cursor-pointer hover:bg-accent ${selectedChat === chat.id ? 'bg-accent' : ''
                }`}
              onClick={() => setSelectedChat(chat.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full text-primary-foreground"
                      style={{
                        backgroundColor: chat.type === 'PRIVATE'
                          ? chat.participants[0]?.color || "#cfdbff"
                          : "#cfdbff"
                      }}
                    >
                      {chat.type === 'PRIVATE'
                        ? (chat.participants[0]?.firstName[0] + chat.participants[0]?.lastName[0]).toUpperCase()
                        : chat.name[0]}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">
                      {chat.type === 'PRIVATE'
                        ? `${chat.participants[0]?.firstName} ${chat.participants[0]?.lastName}`
                        : chat.name}
                    </p>
                    {chat.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {chatRooms.find(chat => chat.id === selectedChat)?.name || 'Chat'}
              </h2>
              {chatRooms.find(chat => chat.id === selectedChat)?.type === 'GROUP' && (
                <Button variant="ghost" size="icon" onClick={() => setShowGroupInfoModal(true)}>
                  <Info className="w-5 h-5" />
                </Button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full text-primary-foreground"
                      style={{ backgroundColor: message.color || "#cfdbff" }}
                    >
                      {message.sender[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{message.sender}</span>
                      <span className="text-sm text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                    {message.type === 'text' && (
                      <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                    )}
                    {message.type === 'image' && message.fileUrl && (
                      <img
                        src={message.fileUrl}
                        alt="Uploaded content"
                        className="mt-2 max-w-sm rounded-lg"
                      />
                    )}
                    {message.type === 'file' && message.fileUrl && (
                      <a
                        href={message.fileUrl}
                        download={message.fileName}
                        className="mt-2 inline-flex items-center gap-2 text-blue-500 hover:underline"
                      >
                        <Paperclip className="w-4 h-4" />
                        {message.fileName}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message... (Ctrl + Enter to send)"
                  className="flex-1 resize-none"
                  disabled={isUploading}
                  rows={1}
                />
                <Button onClick={handleSendMessage} disabled={isUploading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
