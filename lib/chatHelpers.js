// lib/chatHelpers.js
import { supabase } from './supabase';

// Get or create conversation between two users
export const getOrCreateConversation = async (user1, user2) => {
  // Check if conversation already exists
  const { data: existing, error: existingError } = await supabase
    .from('chats')
    .select('*')
    .or(`and(user1.eq.${user1},user2.eq.${user2}),and(user1.eq.${user2},user2.eq.${user1})`)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Error checking conversation:', existingError);
    return null;
  }

  if (existing) return existing;

  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from('chats')
    .insert([{ user1, user2 }])
    .select()
    .single();

  if (createError) {
    console.error('Error creating conversation:', createError);
    return null;
  }

  return newConversation;
};

// Fetch messages for a conversation
export const fetchMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data;
};

// Send a new message
export const sendMessage = async (chatId, sender, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      chat_id: chatId,
      sender,
      content,
      type: 'text',
      status: 'sent'
    }]);

  if (error) {
    console.error('Error sending message:', error);
    return false;
  }

  return true;
};


// Add this function to chatHelpers.js
export const getUnreadCount = async (chatId, currentUserId) => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('chat_id', chatId)
    .eq('status', 'sent')
    .neq('sender', currentUserId);

  return error ? 0 : count;
};