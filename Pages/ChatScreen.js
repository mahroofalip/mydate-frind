import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Keyboard,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Platform,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { emojis } from '../data/emojies';
import { emojiCategories } from '../data/emojiCategories';
const { width } = Dimensions.get('window');

export function ChatScreen({ route, navigation }) {
    const { conversation } = route.params;

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const flatListRef = useRef(null);
    const emojiListRef = useRef(null);

    useEffect(() => {
        const initialMessages = [
            { id: '1', text: 'Hey there! 👋', time: '10:30 AM', sender: 'recipient' },
            { id: '2', text: 'Hi! How are you doing?', time: '10:31 AM', sender: 'user' },
            { id: '3', text: conversation.lastMessage, time: conversation.time, sender: 'recipient' },
        ];
        setMessages(initialMessages);

        // Hide default header
        navigation.setOptions({ headerShown: false });
    }, [conversation]);

    // Scroll emoji list to top when category changes
    useEffect(() => {
        if (showEmojiPicker && emojiListRef.current) {
            emojiListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
    }, [activeEmojiCategory, showEmojiPicker]);

    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
        if (!showEmojiPicker) {
            Keyboard.dismiss();
        }
    };

    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji);
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

    const handleSend = () => {
        if (newMessage.trim() === '') return;

        const newMsg = {
            id: Date.now().toString(),
            text: newMessage,
            time: 'Just now',
            sender: 'user',
        };

        setMessages(prev => [...prev, newMsg])
        setNewMessage('');
        setShowEmojiPicker(false);
    };

    const renderMessage = ({ item }) => (
        <View style={[
            styles.messageBubble,
            item.sender === 'user' ? styles.userBubble : styles.recipientBubble
        ]}>
            <Text style={item.sender === 'user' ? styles.userText : styles.recipientText}>
                {item.text}
            </Text>
            <Text style={item.sender === 'user' ? styles.userTime : styles.recipientTime}>
                {item.time}
            </Text>
        </View>
    );

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
                                        source={{ uri: conversation.image }}
                                        style={styles.avatar}
                                        onError={() => setAvatarError(true)}
                                    />
                                )}

                                <View style={styles.nameContainer}>
                                    <Text style={styles.name}>{conversation.name}</Text>
                                    <Text style={styles.status}>Online</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.menuButton}>
                                <Ionicons name="ellipsis-vertical" size={24} color="#FF5A5F" />
                            </TouchableOpacity>
                        </View>

                        {/* Messages */}
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={[
                                styles.messagesContainer,
                                { paddingBottom: showEmojiPicker ? 250 + 70 : 70 }
                            ]}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() =>
                                flatListRef.current?.scrollToEnd({ animated: true })
                            }
                            ListHeaderComponent={<View style={{ height: 10 }} />}
                        />

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
                                    ref={emojiListRef}
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

                            <TouchableOpacity style={styles.attachmentButton}>
                                <Ionicons name="attach" size={24} color="#FF5A5F" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSend}
                                disabled={newMessage.trim() === ''}
                            >
                                <MaterialIcons
                                    name={newMessage.trim() === '' ? 'mic' : 'send'}
                                    size={24}
                                    color="white"
                                />
                            </TouchableOpacity>
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
    // Custom Header Styles
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
        color: '#666',
        marginTop: 2,
    },
    backButton: {
        padding: 5,
    },
    menuButton: {
        padding: 5,
        marginLeft: 10,
    },
    // Messages Styles
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
    userText: {
        color: 'white',
        fontSize: 16,
    },
    recipientText: {
        color: '#333',
        fontSize: 16,
    },
    userTime: {
        color: '#ffffffaa',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    recipientTime: {
        color: '#666',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
    // Input Styles
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
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
    attachmentButton: {
        padding: 8,
    },
    // Emoji Picker Styles
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
        width: (width - 60) / 8,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 24,
    },
});