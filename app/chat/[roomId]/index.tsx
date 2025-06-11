import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { authApi, PhotoUploadPayload } from '@/services/api';
import theme from '@/app/theme';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import WaitingMessage from '@/components/WaitingMessage';
import LocationCard from '@/components/LocationCard';
import { useAuth } from '@/context/AuthContext';

// API Response type for a single chat message
interface ApiChatMessage {
    id: string;
    roomId: string;
    sender: string;
    senderRole: 'user' | 'architect';
    content: string;
    type: 'TEXT' | 'IMAGE';
    createdAt: string;
}

// Local state interface for a message
interface Message {
  id: string;
  message: string;
  timestamp: string;
  isFromUser: boolean; // For architect app, this means "is from architect"
  senderName: string;
  senderAvatar?: string;
  type: 'TEXT' | 'IMAGE';
}

// Local state interface for consultation details (from API)
interface ConsultationDetails {
  id: string;
  type: 'online' | 'offline';
  status: 'waiting-for-confirmation' | 'scheduled' | 'in-progress' | 'ended' | 'cancelled' | 'waiting-for-payment';
  userName: string; // Changed from architectName to userName
  userAvatar?: string; // Changed from architectAvatar to userAvatar
  startDate: string;
  endDate: string;
  location?: string | null;
  locationDescription?: string | null;
  roomId: string;
}

interface MessageWithDate extends Message {
  date: string;
}

interface GroupedMessage {
  id: string;
  type: 'date' | 'message';
  date?: string;
  message?: MessageWithDate;
  isFirstMessageFromSender?: boolean;
}

export default function ArchitectChatPage() {
  const router = useRouter();
  const { roomId, consultationId } = useLocalSearchParams<{ roomId: string, consultationId: string }>();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [consultation, setConsultation] = useState<ConsultationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatStatus, setChatStatus] = useState<'waiting' | 'active' | 'ended'>('waiting');
  const flatListRef = useRef<FlatList>(null);
  // MAJOR FIX 1: Refs to hold the latest state for our WebSocket callbacks
  const ws = useRef<WebSocket | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const consultationRef = useRef<ConsultationDetails | null>(null);
  const userRef = useRef<any>(null); // Using `any` for simplicity, could be a proper User type from your context
  const isUnmounting = useRef(false); // Ref to prevent reconnect on unmount

  // Keep refs updated with the latest state
  useEffect(() => {
    consultationRef.current = consultation;
    userRef.current = user;
  });

  // 1. REPLACE the getLocalTimestamp function:
  const getLocalTimestamp = (): string => {
    const now = new Date();
    // Format as YYYY-MM-DDTHH:mm:ss (NO 'Z' suffix to avoid UTC interpretation)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // 2. REPLACE the parseTimestamp function:
  const parseTimestamp = (timestamp: string): Date => {
    // Always treat timestamp as local time, never convert from UTC
    // Remove 'Z' suffix if present to prevent UTC interpretation
    const cleanTimestamp = timestamp.replace('Z', '');
    
    // Create date assuming local timezone
    return new Date(cleanTimestamp);
  };

  useEffect(() => {
    isUnmounting.current = false;
    loadChatRoom();

    // Cleanup on component unmount
    return () => {
      isUnmounting.current = true; // Mark that we are unmounting
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (ws.current) {
        console.log('Closing WebSocket connection on unmount...');
        ws.current.close(1000); // 1000 is a normal closure
      }
    };
  }, [roomId, consultationId]);

  const loadChatRoom = async () => {
    if (!roomId || !consultationId || !user) {
      Alert.alert('Error', 'Missing required information to load chat.');
      setLoading(false);
      router.back();
      return;
    }

    try {
      setLoading(true);

      const consultationResponse = await authApi.getConsultationById(consultationId);

      if (consultationResponse.code !== 200 || !consultationResponse.data) {
        throw new Error(consultationResponse.error || 'Failed to load consultation details.');
      }
      
      const details = consultationResponse.data;
      const fetchedConsultation: ConsultationDetails = {
        id: details.id,
        type: details.type,
        status: details.status,
        userName: details.userName, // Changed from architectName
        userAvatar: undefined, // Always use blank profile for now
        startDate: details.startDate,
        endDate: details.endDate,
        location: details.location,
        locationDescription: details.locationDescription,
        roomId: details.roomId!,
      };
      setConsultation(fetchedConsultation);
      
      const currentStatus = determineChatStatus(fetchedConsultation);
      setChatStatus(currentStatus);

      const chatHistoryResponse = await authApi.getChatByRoomId(roomId);
      if (chatHistoryResponse.code === 200 && chatHistoryResponse.data) {
        const apiMessages = Array.isArray(chatHistoryResponse.data) ? chatHistoryResponse.data : [chatHistoryResponse.data];
        
        const mappedMessages = (apiMessages as ApiChatMessage[]).map((msg): Message => ({
          id: msg.id,
          message: msg.content,
          timestamp: msg.createdAt, // Keep original timestamp from server
          isFromUser: msg.sender === user.userId, // For architect: isFromUser means "is from architect"
          senderName: msg.sender === user.userId ? (user.username || 'You') : fetchedConsultation.userName,
          type: msg.type,
          senderAvatar: msg.sender !== user.userId ? undefined : undefined, // Always blank profile
        }));
        setMessages(mappedMessages);
      } else if (chatHistoryResponse.code !== 404) {
         throw new Error(chatHistoryResponse.error || 'Failed to load chat history.');
      }

      if (currentStatus === 'active') {
        initializeWebSocket(roomId);
      }

    } catch (error: any) {
      console.error('Error loading chat room:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // 5. UPDATE the determineChatStatus function:
  const determineChatStatus = (consult: ConsultationDetails): 'waiting' | 'active' | 'ended' => {
    if (!consult) return 'waiting';

    const now = new Date();
    // Parse consultation times as local (no timezone conversion)
    const consultationStart = parseTimestamp(consult.startDate);
    const consultationEnd = parseTimestamp(consult.endDate);

    if (consult.status === 'ended' || consult.status === 'cancelled') {
      return 'ended';
    }
    if (consult.status === 'in-progress') {
      return 'active';
    }
    if (consult.status === 'scheduled') {
      if(now >= consultationStart && now < consultationEnd) return 'active';
      if(now >= consultationEnd) return 'ended';
      return 'waiting';
    }
    
    return 'waiting';
  };

  const initializeWebSocket = async (currentRoomId: string) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      Alert.alert('Authentication Error', 'Cannot connect to chat. Please log in again.');
      return;
    }

    // Close any existing connection before creating a new one
    if (ws.current) {
        ws.current.onclose = null; // Prevent the old onclose from firing
        ws.current.close();
    }
    
    const wsUrl = `wss://build-better.site/ws/chat/${currentRoomId}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    // @ts-ignore - Ignoring TS error as React Native's WebSocket supports a 3rd options arg.
    const newWs = new WebSocket(wsUrl, undefined, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    newWs.onopen = () => {
      console.log('WebSocket connection established.');
      setChatStatus('active');

      // Start the keep-alive ping
      if (pingInterval.current) clearInterval(pingInterval.current);
      pingInterval.current = setInterval(() => {
        if (newWs.readyState === WebSocket.OPEN) {
          // The server might expect a simple string 'PING' or a JSON object.
          // A simple string is often more robust with proxies.
          console.log("Sending PING");
          newWs.send('PING'); 
        }
      }, 30000); // Every 30 seconds
    };
    
    newWs.onmessage = (event) => {
      // MAJOR FIX 2: The onmessage handler NOW works correctly
      // We read from the refs to get the LATEST user and consultation data
      const currentUser = userRef.current;
      const currentConsultation = consultationRef.current;

      console.log('WebSocket message received:', event.data);
      if (event.data === 'PONG') {
          console.log("Received PONG");
          return;
      }
      
      if (!currentUser || !currentConsultation) {
        console.error("Message received, but user or consultation ref is not set.");
        return; // This check is now safe
      }

      try {
        const receivedMsg = JSON.parse(event.data);

        // Don't add your own messages again (if server echoes them)
        if (receivedMsg.sender === currentUser.userId) {
            return;
        }

        const newMessage: Message = {
          id: receivedMsg.id || Date.now().toString(),
          message: receivedMsg.content,
          timestamp: receivedMsg.createdAt || receivedMsg.sentAt || new Date().toISOString(), // Use sentAt if available
          isFromUser: receivedMsg.sender === currentUser.userId,
          senderName: currentConsultation.userName, // Safely use ref data
          type: receivedMsg.type,
          senderAvatar: undefined,
        };
        
        // This will now correctly update the state and cause a re-render
        setMessages(prev => [newMessage, ...prev]);

      } catch (e) {
        console.error('Error parsing WebSocket message:', e, 'Raw data:', event.data);
      }
    };

    // --- THIS IS THE KEY CHANGE ---
    newWs.onerror = (error: any) => {
      console.error('WebSocket error:', error.message);
  
      // Check for the specific handshake failure error (400, 401, 403, etc.).
      if (error.message && error.message.includes("Expected HTTP 101 response but was")) {
        console.log("WebSocket handshake failed. Server rejected connection, likely due to session timing.");
        
        // The server is the source of truth. It told us we can't connect.
        // So, we are NOT 'active'. We must be either 'waiting' or 'ended'.
        // We can re-evaluate the status to show the correct UI.
        if (consultation) {
            const now = new Date();
            const consultationEnd = new Date(consultation.endDate);
            
            // If the session is over, mark it as 'ended'. Otherwise, we're still 'waiting'.
            if (now > consultationEnd) {
                setChatStatus('ended');
            } else {
                setChatStatus('waiting');
            }
        }
        
        // IMPORTANT: We do NOT show a generic, scary error alert here.
        // The UI will simply update to show the "Waiting" or "Ended" message,
        // which is the correct user experience.

      } else {
        // For other, unexpected errors (e.g., real network loss), the generic alert is appropriate.
        Alert.alert('Connection Error', 'Lost connection to the chat server.');
        setChatStatus('ended');
      }
    };
  
    newWs.onclose = (event) => { 
      console.log('WebSocket connection closed:', event.code, event.reason); 
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }

      // MAJOR FIX 3: Robust Reconnection Logic
      // Only try to reconnect if the closure was abnormal (not code 1000)
      // and if the component is not in the process of unmounting.
      if (!isUnmounting.current && event.code !== 1000) {
        console.log("Abnormal closure. Attempting to reconnect in 5 seconds...");
        setTimeout(() => {
          // Re-check that we haven't unmounted in the meantime
          if (!isUnmounting.current) {
            initializeWebSocket(currentRoomId);
          }
        }, 5000); // Wait 5 seconds before trying again
      }
    };
  
    ws.current = newWs;
  };

  const handleSendMessage = async (message: string, images?: string[]) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !user) {
          Alert.alert('Not Connected', 'You are not connected to the chat.');
          return;
      }

      // Handle text messages
      if (message.trim()) {
          const tempId = `temp_${Date.now()}`;
          const sentAt = getLocalTimestamp(); // Generate timestamp on client side

          // Create the message object for the UI *immediately*
          const optimisticMessage: Message = {
              id: tempId,
              message: message.trim(),
              timestamp: sentAt, // Use client-generated timestamp
              isFromUser: true, // It's from the architect
              senderName: user.username || 'You',
              type: 'TEXT',
              senderAvatar: undefined,
          };

          // Update the state to show the message on screen instantly
          setMessages(prev => [optimisticMessage, ...prev]);

          // Send the actual payload to the server with client timestamp
          const payload = { 
              sender: user.userId, 
              senderRole: "architect", 
              content: message.trim(), 
              type: "TEXT",
              sentAt: sentAt // Include client timestamp
          };
          ws.current.send(JSON.stringify(payload));
      }

      // Handle image messages
      if (images && images.length > 0) {
          for (const uri of images) {
              try {
                  // Create optimistic image message with loading state
                  const tempImageId = `temp_image_${Date.now()}_${Math.random()}`;
                  const sentAt = getLocalTimestamp();
                  
                  const optimisticImageMessage: Message = {
                      id: tempImageId,
                      message: uri, // Use local URI initially
                      timestamp: sentAt,
                      isFromUser: true,
                      senderName: user.username || 'You',
                      type: 'IMAGE',
                      senderAvatar: undefined,
                  };

                  // Show the image immediately with loading state
                  setMessages(prev => [optimisticImageMessage, ...prev]);

                  const formData = new FormData();
                  const filename = uri.split('/').pop();
                  const match = /\.(\w+)$/.exec(filename || '');
                  const type = match ? `image/${match[1]}` : `image/jpeg`;
                  
                  const safeName = filename || `image_${Date.now()}.jpg`;
                  
                  const filePayload: PhotoUploadPayload = { 
                      uri, 
                      name: safeName, 
                      type 
                  };

                  const response = await authApi.sendFileInChat(roomId!, filePayload);
                  if (response.code === 200 && response.data) {
                      const imageUrl = response.data;
                      
                      // Update the optimistic message with the server URL
                      setMessages(prev => prev.map(msg => 
                          msg.id === tempImageId 
                              ? { ...msg, message: imageUrl }
                              : msg
                      ));
                      
                      const payload = { 
                          sender: user.userId, 
                          senderRole: "architect", 
                          content: imageUrl, 
                          type: "IMAGE",
                          sentAt: sentAt
                      };
                      ws.current.send(JSON.stringify(payload));
                  } else {
                      // Remove the failed message from UI
                      setMessages(prev => prev.filter(msg => msg.id !== tempImageId));
                      throw new Error(response.error || 'Failed to upload image.');
                  }
              } catch (error: any) {
                  console.error('Error sending image:', error);
                  Alert.alert('Upload Failed', error.message);
              }
          }
      }
  };

  const handleBack = () => router.back();

  // 3. UPDATE the formatDate function to be more explicit about local time:
  const formatDate = (timestamp: string) => {
    const date = parseTimestamp(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Compare dates using local time components directly
    const isSameDay = (date1: Date, date2: Date) => {
      return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };
    
    if (isSameDay(date, today)) return 'Hari ini';
    if (isSameDay(date, yesterday)) return 'Kemarin';
    
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const groupMessagesByDate = (msgs: Message[]): GroupedMessage[] => {
    if (!msgs || msgs.length === 0) return [];
    
    const grouped: GroupedMessage[] = [];
    let currentDate = '';
    let previousMessage: MessageWithDate | null = null;
    
    const sortedMessages = [...msgs].sort((a, b) => parseTimestamp(a.timestamp).getTime() - parseTimestamp(b.timestamp).getTime());
    
    sortedMessages.forEach((message) => {
      const messageDate = parseTimestamp(message.timestamp).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        grouped.push({ id: `date-${messageDate}`, type: 'date', date: formatDate(message.timestamp) });
        previousMessage = null;
      }
      
      const messageWithDate: MessageWithDate = { ...message, date: messageDate };
      const isFirstMessageFromSender = !previousMessage || previousMessage.isFromUser !== message.isFromUser;
      
      grouped.push({ id: message.id, type: 'message', message: messageWithDate, isFirstMessageFromSender });
      previousMessage = messageWithDate;
    });
    
    return grouped.reverse();
  };

  // 4. UPDATE the renderChatItem timestamp formatting:
  const renderChatItem = ({ item }: { item: GroupedMessage }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      );
    }
    if (item.message) {
      const timestampDate = parseTimestamp(item.message.timestamp);
      // Use local time components directly for display
      const hours = String(timestampDate.getHours()).padStart(2, '0');
      const minutes = String(timestampDate.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      return (
        <ChatMessage
          id={item.message.id}
          message={item.message.message}
          timestamp={timeString}
          isFromUser={item.message.isFromUser}
          senderName={item.message.senderName}
          senderAvatar={item.message.senderAvatar}
          isFirstMessageFromSender={item.isFirstMessageFromSender}
          type={item.message.type}
        />
      );
    }
    return null;
  };

  const getAvatarSource = (avatarUrl?: string) => {
    // Always use blank profile for now
    return require('@/assets/images/blank-profile.png');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={theme.colors.customOlive[50]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading Chat...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.customGreen[300]}/>
          <Text style={{ marginTop: 10 }}>Memuat konsultasi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!consultation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.customOlive[50]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text>Gagal memuat detail konsultasi.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const hasHistory = messages.length > 0;
  
  const now = new Date();
  const consultationEnd = parseTimestamp(consultation.endDate);
  const isSessionOver = chatStatus === 'ended' || now > consultationEnd;
  
  // 6. UPDATE the main render section where consultation times are formatted:
  // Replace these lines in your main render:
  const formattedDate = parseTimestamp(consultation.startDate).toLocaleDateString('id-ID', {
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  });

  const startTime = parseTimestamp(consultation.startDate);
  const endTime = parseTimestamp(consultation.endDate);

  const formattedTime = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')} - ${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
  
  const waitingMessageText = consultation.type === 'online'
      ? `Jadwal Konsultasi Chat akan dimulai pada ${formattedDate}, pukul ${formattedTime}.`
      : 'Konsultasi tatap muka akan dimulai sesuai jadwal yang telah ditentukan.';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25} // Adjust this offset as needed
      >
        {/* Header is always visible */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.customOlive[50]} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Image source={getAvatarSource(consultation.userAvatar)} style={styles.userAvatar} />
            <Text style={styles.userName}>{consultation.userName}</Text>
          </View>
        </View>

        {/* --- MAIN CONTENT AREA --- */}
        {hasHistory ? (
          // Case 1: Chat has history, show the message list
          <View style={styles.chatContainer}>
            {consultation.type === 'offline' && consultation.location && (
              <LocationCard
                date={formattedDate}
                time={formattedTime}
                location={consultation.location}
                locationDescription={consultation.locationDescription || undefined}
              />
            )}
            <FlatList
              ref={flatListRef}
              data={groupedMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderChatItem}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContainer}
              inverted
            />
          </View>
        ) : (
          // Case 2: No chat history, show full-screen status messages
          <>
            {chatStatus === 'waiting' && (
              <WaitingMessage 
                consultationType={consultation.type}
                consultationDate={formattedDate}
                consultationTime={formattedTime}
              />
            )}
            {isSessionOver && (
              <View style={styles.fullScreenStatusContainer}>
                <MaterialIcons 
                    name="check-circle-outline" 
                    size={64} 
                    color={theme.colors.customGray[200]} 
                    style={styles.fullScreenStatusIcon}
                />
                <Text style={styles.fullScreenStatusTitle}>
                    Sesi konsultasi telah berakhir.
                </Text>
                <Text style={styles.fullScreenStatusText}>
                    Terima kasih telah memberikan konsultasi.
                </Text>
              </View>
            )}
            {/* Render an empty flexible view if chat is active but has no history, pushing input to bottom */}
            {chatStatus === 'active' && <View style={styles.chatContainer} />}
          </>
        )}

        {/* --- BOTTOM ACTION/STATUS AREA --- */}
        {chatStatus === 'active' && (
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={false}
          />
        )}
        
        {isSessionOver && hasHistory && (
          <View style={styles.sessionEndedFooter}>
            <Text style={styles.sessionEndedText}>
              Sesi konsultasi telah berakhir. Terima kasih telah memberikan konsultasi.
            </Text>
          </View>
        )}

        {chatStatus === 'waiting' && hasHistory && (
          <View style={styles.bottomBanner}>
            <Text style={styles.bottomBannerText}>
                {waitingMessageText}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.customWhite[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.customGray[50],
    backgroundColor: theme.colors.customWhite[50],
    marginTop: 32,
  },
  backButton: {
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: theme.colors.customGray[50], // Placeholder color
  },
  userName: {
    ...theme.typography.subtitle1,
    color: theme.colors.customOlive[100],
  },
  headerTitle: {
    ...theme.typography.subtitle1,
    color: theme.colors.customOlive[50],
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.customGray[200],
    backgroundColor: theme.colors.customWhite[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionEndedFooter: {
    backgroundColor: theme.colors.customWhite[50],
    borderTopWidth: 1,
    borderTopColor: theme.colors.customGray[50],
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  sessionEndedText: {
    ...theme.typography.body2,
    color: theme.colors.customGray[200],
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New Styles
  fullScreenStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullScreenStatusIcon: {
    marginBottom: 16,
  },
  fullScreenStatusTitle: {
    ...theme.typography.body1,
    color: theme.colors.customGray[200],
    textAlign: 'center',
    marginBottom: 8,
  },
  fullScreenStatusText: {
    ...theme.typography.body1,
    color: theme.colors.customOlive[50],
    textAlign: 'center',
  },
  bottomBanner: {
    backgroundColor: theme.colors.customWhite[100],
    borderTopWidth: 1,
    borderTopColor: theme.colors.customGray[50],
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  bottomBannerText: {
    ...theme.typography.body2,
    color: theme.colors.customOlive[50],
    textAlign: 'center',
  },
});