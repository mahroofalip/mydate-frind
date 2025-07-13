import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Platform,
    SafeAreaView,
    TextInput,
    Image,
    Keyboard,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { emojis } from '../data/emojies';
import { emojiCategories } from '../data/emojiCategories';
import { supabase } from '../lib/supabase';
import moment from 'moment';

export default function ChatScreen({ route, navigation }) {
    const { conversation } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [recipientOnline, setRecipientOnline] = useState(false);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);
    const lastSentMessageRef = useRef(null);

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            return user;
        };

        fetchUser();
    }, []);

    // Format message consistently
    const formatMessage = useCallback((msg) => ({
        id: msg.id,
        text: msg.content,
        time: formatTime(msg.created_at),
        sender: msg.sender === currentUser?.id ? 'user' : 'recipient',
        type: msg.type,
        status: msg.status
    }), [currentUser]);

    // Fetch messages and setup subscriptions
    useEffect(() => {
        if (!conversation || !currentUser) return;

        // Fetch initial messages
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', conversation.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                setLoading(false);
                return;
            }

            // Format messages for UI
            const formattedMessages = data.map(msg => formatMessage(msg));
            setMessages(formattedMessages);
            setLoading(false);
        };

        fetchMessages();

        // Check recipient's online status
        const checkRecipientStatus = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('last_login_at, last_logout_at, session_expires_at')
                .eq('id', conversation.userId)
                .single();

            if (!error && data) {
                const isOnline = checkOnlineStatus(data);
                setRecipientOnline(isOnline);
            }
        };

        checkRecipientStatus();

        // Real-time message subscription
        const messagesSubscription = supabase
            .channel(`chat_${conversation.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${conversation.id}`
            }, (payload) => {
                const newMsg = payload.new;
                
                // Skip if this is our own just-sent message
                if (lastSentMessageRef.current === newMsg.id) {
                    lastSentMessageRef.current = null;
                    return;
                }

                // Update existing message or add new one
                setMessages(prev => {
                    const existingIndex = prev.findIndex(m => m.id === newMsg.id);
                    
                    if (existingIndex !== -1) {
                        // Update existing message
                        const updated = [...prev];
                        updated[existingIndex] = formatMessage(newMsg);
                        return updated;
                    } else {
                        // Add new message
                        return [...prev, formatMessage(newMsg)];
                    }
                });
            })
            .subscribe();

        return () => {
            messagesSubscription.unsubscribe();
        };
    }, [conversation, currentUser, formatMessage]);

    

    const checkOnlineStatus = (profile) => {
        if (!profile.last_login_at) return false;
        
        const now = new Date();
        const lastLogin = new Date(profile.last_login_at);
        const lastLogout = profile.last_logout_at ? new Date(profile.last_logout_at) : null;
        const expiresAt = profile.session_expires_at ? new Date(profile.session_expires_at) : null;
    
        return (
            (!lastLogout || lastLogin > lastLogout) &&
            (!expiresAt || expiresAt > now)
        );
    };

    const formatTime = (dateString) => {
        return moment(dateString).format('h:mm A');
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
        if (!showEmojiPicker) Keyboard.dismiss();
    };

    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji);
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser || !conversation || sending) return;
        
        setSending(true);
        const tempId = `temp-${Date.now()}`;
        
        // Optimistic update
        const newMsg = {
            id: tempId,
            text: newMessage,
            time: 'Sending...',
            sender: 'user',
            type: 'text',
            status: 'sending'
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setShowEmojiPicker(false);
        
        try {
            // Save to database
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    chat_id: conversation.id,
                    sender: currentUser.id,
                    content: newMessage,
                    type: 'text',
                    status: 'sent'
                }])
                .select();
            
            if (error) throw error;
            
            // Store real ID to prevent duplicate in subscription
            lastSentMessageRef.current = data[0].id;
            
            // Update with real data
            setMessages(prev => prev.map(msg => 
                msg.id === tempId ? formatMessage(data[0]) : msg
            ));
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.map(msg => 
                msg.id === tempId ? { ...msg, status: 'failed' } : msg
            ));
        } finally {
            setSending(false);
        }
    };

    const resendMessage = async (message) => {
        if (!currentUser || !conversation) return;
        
        setMessages(prev => prev.map(msg => 
            msg.id === message.id ? { ...msg, status: 'sending' } : msg
        ));
        
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    chat_id: conversation.id,
                    sender: currentUser.id,
                    content: message.text,
                    type: 'text',
                    status: 'sent'
                }])
                .select();
            
            if (error) throw error;
            
            lastSentMessageRef.current = data[0].id;
            setMessages(prev => prev.map(msg => 
                msg.id === message.id ? formatMessage(data[0]) : msg
            ));
        } catch (error) {
            console.error('Resend failed:', error);
            setMessages(prev => prev.map(msg => 
                msg.id === message.id ? { ...msg, status: 'failed' } : msg
            ));
        }
    };

    const renderEmojiCategory = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.emojiCategory,
                activeEmojiCategory === item.id && styles.activeEmojiCategory
            ]}
            onPress={() => setActiveEmojiCategory(item.id)}
        >
            <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={activeEmojiCategory === item.id ? "#FF5A5F" : "#888"}
            />
        </TouchableOpacity>
    );

    const renderEmoji = ({ item }) => (
        <TouchableOpacity
            style={styles.emojiItem}
            onPress={() => handleEmojiSelect(item)}
        >
            <Text style={styles.emoji}>{item}</Text>
        </TouchableOpacity>
    );

    const renderMessage = ({ item }) => {
        const isFailed = item.status === 'failed';
        const isSending = item.status === 'sending';
        
        return (
            <View style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userBubble : styles.recipientBubble,
                isFailed && styles.failedMessage
            ]}>
                <Text style={item.sender === 'user' ? styles.userText : styles.recipientText}>
                    {item.text}
                </Text>
                <View style={styles.timeContainer}>
                    {isSending ? (
                        <ActivityIndicator size="small" color="#aaa" />
                    ) : isFailed ? (
                        <TouchableOpacity onPress={() => resendMessage(item)}>
                            <MaterialIcons name="error-outline" size={16} color="#ff4d4f" />
                        </TouchableOpacity>
                    ) : null}
                    <Text style={item.sender === 'user' ? styles.userTime : styles.recipientTime}>
                        {isFailed ? 'Failed - Tap to retry' : item.time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#FF5A5F" />
                            </TouchableOpacity>

                            <View style={styles.userInfo}>
                                {avatarError ? (
                                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                        <Ionicons name="person" size={24} color="white" />
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: conversation.image  }}
                                        style={styles.avatar}
                                        onError={() => setAvatarError(true)}
                                    />
                                )}

                                <View style={styles.nameContainer}>
                                    <Text style={styles.name}>{conversation.name}</Text>
                                    <Text style={[styles.status, { color: recipientOnline ? '#4CAF50' : '#888' }]}>
                                        {recipientOnline ? 'Online' : 'Offline'}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.menuButton}>
                                <Ionicons name="ellipsis-vertical" size={24} color="#FF5A5F" />
                            </TouchableOpacity>
                        </View>

                        {/* Messages */}
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#FF5A5F" />
                                <Text style={styles.loadingText}>Loading messages...</Text>
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderMessage}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={[
                                    styles.messagesContainer,
                                    { paddingBottom: showEmojiPicker ? 300 : 90 }
                                ]}
                                showsVerticalScrollIndicator={false}
                                onContentSizeChange={() => {
                                    if (messages.length > 0) {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }
                                }}
                                onLayout={() => {
                                    if (messages.length > 0) {
                                        flatListRef.current?.scrollToEnd({ animated: true });
                                    }
                                }}
                                ListHeaderComponent={<View style={{ height: 10 }} />}
                            />
                        )}

                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <View style={styles.emojiPicker}>
                                <View style={styles.emojiCategories}>
                                    <FlatList
                                        data={emojiCategories}
                                        renderItem={renderEmojiCategory}
                                        keyExtractor={(item) => item.id}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.emojiCategoriesContainer}
                                    />
                                </View>

                                <FlatList
                                    data={emojis[activeEmojiCategory]}
                                    renderItem={renderEmoji}
                                    keyExtractor={(item, index) => index.toString()}
                                    numColumns={8}
                                    columnWrapperStyle={styles.emojiRow}
                                    contentContainerStyle={styles.emojiScroll}
                                    showsVerticalScrollIndicator={false}
                                />
                            </View>
                        )}

                        {/* Input Container */}
                        <View style={styles.inputContainer}>
                            <TouchableOpacity
                                style={styles.emojiButton}
                                onPress={toggleEmojiPicker}
                            >
                                <Ionicons
                                    name={showEmojiPicker ? 'close' : 'happy-outline'}
                                    size={24}
                                    color="#FF5A5F"
                                />
                            </TouchableOpacity>

                            <TextInput
                                style={styles.messageInput}
                                placeholder="Type a message..."
                                placeholderTextColor="#999"
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline
                            />

                            {newMessage.trim() !== '' && (
                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={handleSend}
                                    activeOpacity={0.7}
                                    disabled={sending}
                                >
                                    {sending ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <MaterialIcons
                                            name="send"
                                            size={24}
                                            color="white"
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        paddingTop: 40,
        paddingBottom: 40
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: '#FF5A5F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    status: {
        fontSize: 14,
        marginTop: 2,
    },
    backButton: {
        padding: 5,
    },
    menuButton: {
        padding: 5,
        marginLeft: 10,
    },
    messagesContainer: {
        padding: 16,
        paddingTop: 10,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
        marginBottom: 12,
    },
    userBubble: {
        backgroundColor: '#FF5A5F',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    recipientBubble: {
        backgroundColor: 'white',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        elevation: 1,
    },
    failedMessage: {
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
    },
    userText: {
        color: 'white',
        fontSize: 16,
    },
    recipientText: {
        color: '#333',
        fontSize: 16,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    userTime: {
        color: '#ffffffaa',
        fontSize: 12,
        marginLeft: 5,
    },
    recipientTime: {
        color: '#666',
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    },
    messageInput: {
        flex: 1,
        minHeight: 45,
        maxHeight: 120,
        backgroundColor: '#f0f2f5',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        marginHorizontal: 8,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#FF5A5F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiButton: {
        padding: 8,
    },
    emojiPicker: {
        height: 250,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    emojiCategories: {
        height: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    emojiCategoriesContainer: {
        paddingHorizontal: 10,
    },
    emojiCategory: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeEmojiCategory: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF5A5F',
    },
    emojiScroll: {
        paddingHorizontal: 10,
    },
    emojiRow: {
        justifyContent: 'space-between',
    },
    emojiItem: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: '#FF5A5F',
        fontSize: 16,
    },
});