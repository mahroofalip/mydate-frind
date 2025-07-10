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
    Dimensions,
    Modal
} from 'react-native';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av'; // Corrected audio import
import { Video, ResizeMode } from 'expo-av';

// Dummy emoji data
const emojis = {
    smileys: ['😀', '😂', '😍', '😎', '😜', '🤩', '🥳', '😊', '🙂', '😇'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
};

const emojiCategories = [
    { id: 'smileys', icon: 'emoticon-happy-outline' },
    { id: 'animals', icon: 'paw' },
];

const { width, height } = Dimensions.get('window');

export default function ChatScreen({ route, navigation }) {
    const { conversation } = route.params;

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaModalVisible, setMediaModalVisible] = useState(false);
    const [mediaType, setMediaType] = useState(null);
    const [audioPosition, setAudioPosition] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const flatListRef = useRef(null);
    const videoRef = useRef(null);
    const soundRef = useRef(null);
    const progressInterval = useRef(null);
    
    // Animation for voice recording UI
    const recordScale = useSharedValue(1);
    const animatedRecordStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: recordScale.value }],
        };
    });

    useEffect(() => {
        const initialMessages = [
            { id: '1', text: 'Hey there! 👋', time: '10:30 AM', sender: 'recipient', type: 'text' },
            { id: '2', text: 'Hi! How are you doing?', time: '10:31 AM', sender: 'user', type: 'text' },
            { 
                id: '3', 
                text: conversation.lastMessage, 
                time: conversation.time, 
                sender: 'recipient',
                type: 'text' 
            },
        ];
        setMessages(initialMessages);

        // Request permissions
        (async () => {
            await Audio.requestPermissionsAsync();
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        })();

        navigation.setOptions({ headerShown: false });
        
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, [conversation]);

    // Fixed voice recording functions
    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            
            console.log('Starting recording..');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            
            setRecording(recording);
            setIsRecording(true);
            recordScale.value = withSpring(1.2);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            stopRecording();
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        
        console.log('Stopping recording..');
        setIsRecording(false);
        recordScale.value = withSpring(1);
        
        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
            
            const uri = recording.getURI();
            console.log('Recording stopped and stored at', uri);
            
            if (uri) {
                const duration = await recording.getDurationMillis();
                const newMsg = {
                    id: Date.now().toString(),
                    uri,
                    time: 'Just now',
                    sender: 'user',
                    type: 'voice',
                    duration: Math.floor(duration / 1000)
                };
                setMessages(prev => [...prev, newMsg]);
            }
        } catch (error) {
            console.error('Failed to stop recording', error);
        } finally {
            setRecording(null);
        }
    };

    // Media handling functions
    const pickImage = async () => {
        setShowEmojiPicker(false);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            const newMsg = {
                id: Date.now().toString(),
                uri: result.assets[0].uri,
                time: 'Just now',
                sender: 'user',
                type: 'image',
                caption: ''
            };
            setMessages(prev => [...prev, newMsg]);
        }
    };

    const pickVideo = async () => {
        setShowEmojiPicker(false);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const newMsg = {
                id: Date.now().toString(),
                uri: asset.uri,
                time: 'Just now',
                sender: 'user',
                type: 'video',
                duration: Math.floor(asset.duration / 1000)
            };
            setMessages(prev => [...prev, newMsg]);
        }
    };

    const pickAudio = async () => {
        setShowEmojiPicker(false);
        let result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const newMsg = {
                id: Date.now().toString(),
                uri: asset.uri,
                time: 'Just now',
                sender: 'user',
                type: 'audio',
                name: asset.name,
                size: asset.size
            };
            setMessages(prev => [...prev, newMsg]);
        }
    };

    // Fixed audio playback functions
    const playAudio = async (uri) => {
        try {
            // Stop any currently playing audio
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }
            
            // Load and play the new audio
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }
            );
            soundRef.current = sound;
            
            // Get status and set duration
            const status = await sound.getStatusAsync();
            setAudioDuration(status.durationMillis || 0);
            
            setIsPlaying(true);
            
            // Set up progress tracking
            progressInterval.current = setInterval(async () => {
                const status = await sound.getStatusAsync();
                setAudioPosition(status.positionMillis || 0);
                
                if (status.didJustFinish) {
                    setIsPlaying(false);
                    clearInterval(progressInterval.current);
                }
            }, 500);
            
            await sound.playAsync();
        } catch (error) {
            console.error('Error playing audio', error);
        }
    };

    const pauseAudio = async () => {
        if (soundRef.current && isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        }
    };

    const handleMediaPress = (item) => {
        setSelectedMedia(item);
        setMediaType(item.type);
        setMediaModalVisible(true);
        
        if (item.type === 'audio' || item.type === 'voice') {
            playAudio(item.uri);
        }
    };

    // Message handling
    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
        if (!showEmojiPicker) {
            Keyboard.dismiss();
        }
    };

    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji);
    };

    const handleSend = () => {
        if (newMessage.trim() === '') return;

        const newMsg = {
            id: Date.now().toString(),
            text: newMessage,
            time: 'Just now',
            sender: 'user',
            type: 'text'
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setShowEmojiPicker(false);
    };

    // Render functions
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

    const renderMediaMessage = (item) => {
        switch (item.type) {
            case 'image':
                return (
                    <TouchableOpacity onPress={() => handleMediaPress(item)}>
                        <Image 
                            source={{ uri: item.uri }} 
                            style={styles.mediaImage}
                            resizeMode="cover"
                        />
                        {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
                    </TouchableOpacity>
                );
                
            case 'video':
                return (
                    <TouchableOpacity onPress={() => handleMediaPress(item)}>
                        <Image 
                            source={{ uri: 'https://placehold.co/200x200?text=Video+Thumb' }} 
                            style={styles.mediaImage}
                            resizeMode="cover"
                        />
                        <View style={styles.playButtonOverlay}>
                            <Ionicons name="play" size={40} color="white" />
                        </View>
                        <Text style={styles.videoDuration}>
                            {formatDuration(item.duration)}
                        </Text>
                    </TouchableOpacity>
                );
                
            case 'audio':
            case 'voice':
                return (
                    <View style={styles.audioContainer}>
                        <TouchableOpacity 
                            onPress={() => handleMediaPress(item)}
                            style={styles.playButton}
                        >
                            <Ionicons 
                                name={isPlaying && selectedMedia?.id === item.id ? "pause" : "play"} 
                                size={24} 
                                color="white" 
                            />
                        </TouchableOpacity>
                        <View style={styles.audioProgressContainer}>
                            <View style={[
                                styles.audioProgress, 
                                { 
                                    width: selectedMedia?.id === item.id ? `${(audioPosition / audioDuration) * 100}%` : '0%',
                                    backgroundColor: isPlaying && selectedMedia?.id === item.id ? "#FF5A5F" : "#888"
                                }
                            ]} />
                        </View>
                        <Text style={styles.audioDuration}>
                            {formatDuration(item.type === 'voice' ? item.duration : (audioDuration / 1000))}
                        </Text>
                    </View>
                );
                
            default:
                return null;
        }
    };

    const renderMessage = ({ item }) => (
        <View style={[
            styles.messageBubble,
            item.sender === 'user' ? styles.userBubble : styles.recipientBubble,
            item.type !== 'text' && styles.mediaBubble
        ]}>
            {item.type === 'text' ? (
                <>
                    <Text style={item.sender === 'user' ? styles.userText : styles.recipientText}>
                        {item.text}
                    </Text>
                    <Text style={item.sender === 'user' ? styles.userTime : styles.recipientTime}>
                        {item.time}
                    </Text>
                </>
            ) : (
                <>
                    {renderMediaMessage(item)}
                    <Text style={item.sender === 'user' ? styles.userTime : styles.recipientTime}>
                        {item.time}
                    </Text>
                </>
            )}
        </View>
    );

    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                                    { paddingBottom: showEmojiPicker ? 300 : 90 }
                                ]}
                                showsVerticalScrollIndicator={false}
                                onContentSizeChange={() =>
                                    flatListRef.current?.scrollToEnd({ animated: true })
                                }
                                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
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

                                {isRecording ? (
                                    <Animated.View style={[styles.recordingContainer, animatedRecordStyle]}>
                                        <MaterialIcons name="keyboard-voice" size={28} color="#FF5A5F" />
                                        <Text style={styles.recordingText}>Recording... Release to send</Text>
                                    </Animated.View>
                                ) : (
                                    <TextInput
                                        style={styles.messageInput}
                                        placeholder="Type a message..."
                                        placeholderTextColor="#999"
                                        value={newMessage}
                                        onChangeText={setNewMessage}
                                        multiline
                                    />
                                )}

                                {!isRecording && (
                                    <TouchableOpacity 
                                        style={styles.attachmentButton}
                                        onPress={pickImage}
                                    >
                                        <Ionicons name="attach" size={24} color="#FF5A5F" />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={isRecording ? stopRecording : (newMessage.trim() ? handleSend : undefined)}
                                    onLongPress={startRecording}
                                    onPressOut={isRecording ? stopRecording : undefined}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons
                                        name={isRecording ? "stop" : (newMessage.trim() ? 'send' : 'mic')}
                                        size={24}
                                        color="white"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Media Modal */}
            <Modal
                visible={mediaModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => {
                    setMediaModalVisible(false);
                    if (mediaType === 'audio' || mediaType === 'voice') pauseAudio();
                }}
            >
                <View style={styles.mediaModal}>
                    {mediaType === 'image' && selectedMedia && (
                        <Image 
                            source={{ uri: selectedMedia.uri }} 
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    )}
                    
                    {mediaType === 'video' && selectedMedia && (
                        <View style={styles.videoContainer}>
                            <Video
                                ref={videoRef}
                                source={{ uri: selectedMedia.uri }}
                                style={styles.fullScreenVideo}
                                resizeMode={ResizeMode.CONTAIN}
                                useNativeControls
                                isLooping
                            />
                        </View>
                    )}
                    
                    {(mediaType === 'audio' || mediaType === 'voice') && selectedMedia && (
                        <View style={styles.audioModalContainer}>
                            <Text style={styles.audioTitle}>
                                {selectedMedia.name || 'Voice Message'}
                            </Text>
                            
                            <View style={styles.audioProgressModalContainer}>
                                <View style={[
                                    styles.audioProgressModal,
                                    { width: `${(audioPosition / audioDuration) * 100}%` }
                                ]} />
                            </View>
                            
                            <Text style={styles.audioTime}>
                                {formatDuration(audioPosition / 1000)} / {formatDuration(audioDuration / 1000)}
                            </Text>
                            
                            <TouchableOpacity 
                                style={styles.audioPlayButton}
                                onPress={() => isPlaying ? pauseAudio() : playAudio(selectedMedia.uri)}
                            >
                                <Ionicons 
                                    name={isPlaying ? "pause" : "play"} 
                                    size={40} 
                                    color="#FF5A5F" 
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    <TouchableOpacity
                        style={styles.closeMediaButton}
                        onPress={() => {
                            setMediaModalVisible(false);
                            if (mediaType === 'audio' || mediaType === 'voice') pauseAudio();
                        }}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </GestureHandlerRootView>
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
    mediaBubble: {
        padding: 0,
        overflow: 'hidden',
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
    attachmentButton: {
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
        width: (width - 60) / 8,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    // Media styles
    mediaImage: {
        width: 250,
        height: 200,
        borderRadius: 12,
    },
    caption: {
        padding: 8,
        color: '#333',
        fontSize: 14,
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
        width: 200,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF5A5F',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    audioProgressContainer: {
        flex: 1,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        overflow: 'hidden',
    },
    audioProgress: {
        height: '100%',
        backgroundColor: '#FF5A5F',
    },
    audioDuration: {
        marginLeft: 10,
        fontSize: 12,
        color: '#666',
    },
    videoDuration: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: 3,
        borderRadius: 4,
        fontSize: 12,
    },
    playButtonOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    // Recording UI
    recordingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 8,
    },
    recordingText: {
        marginLeft: 10,
        color: '#FF5A5F',
        fontWeight: 'bold',
    },
    // Media Modal
    mediaModal: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: width,
        height: height,
    },
    videoContainer: {
        width: width,
        height: height,
        backgroundColor: 'black',
    },
    fullScreenVideo: {
        width: '100%',
        height: '100%',
    },
    closeMediaButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 10,
    },
    audioModalContainer: {
        width: '80%',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
    },
    audioTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    audioProgressModalContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        marginBottom: 10,
    },
    audioProgressModal: {
        height: '100%',
        backgroundColor: '#FF5A5F',
    },
    audioTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    audioPlayButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#FF5A5F',
        justifyContent: 'center',
        alignItems: 'center',
    },
});