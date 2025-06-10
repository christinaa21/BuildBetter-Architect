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
  ActivityIndicator
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
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadChatRoom();

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        console.log('Closing WebSocket connection...');
        ws.current.close();
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
          timestamp: msg.createdAt,
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

  const determineChatStatus = (consult: ConsultationDetails): 'waiting' | 'active' | 'ended' => {
      if (!consult) return 'waiting';

      const now = new Date();
      const consultationStart = new Date(consult.startDate);
      const consultationEnd = new Date(consult.endDate);

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

    if (ws.current) ws.current.close();
    
    const wsUrl = `wss://build-better.site/ws/chat/${currentRoomId}?token=${token}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => { console.log('WebSocket connection established.'); };

    newWs.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      if (!user) return;

      try {
        const receivedMsg: ApiChatMessage = JSON.parse(event.data);
        const newMessage: Message = {
          id: receivedMsg.id || Date.now().toString(),
          message: receivedMsg.content,
          timestamp: receivedMsg.createdAt || new Date().toISOString(),
          isFromUser: receivedMsg.sender === user.userId, // For architect: isFromUser means "is from architect"
          senderName: receivedMsg.sender === user.userId ? (user.username || 'You') : consultation!.userName,
          type: receivedMsg.type,
          senderAvatar: receivedMsg.sender !== user.userId ? undefined : undefined, // Always blank profile
        };
        setMessages(prev => [newMessage, ...prev]);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      Alert.alert('Connection Error', 'Lost connection to the chat server.');
      setChatStatus('ended');
    };

    newWs.onclose = (event) => { console.log('WebSocket connection closed:', event.code, event.reason); };

    ws.current = newWs;
  };

  const handleSendMessage = async (message: string, images?: string[]) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !user) {
          Alert.alert('Not Connected', 'You are not connected to the chat.');
          return;
      }

      if (images && images.length > 0) {
          for (const uri of images) {
              try {
                  const formData = new FormData();
                  const filename = uri.split('/').pop();
                  const match = /\.(\w+)$/.exec(filename || '');
                  const type = match ? `image/${match[1]}` : `image/jpeg`; // Default to jpeg if no extension found
                  
                  // Ensure filename is never undefined
                  const safeName = filename || `image_${Date.now()}.jpg`;
                  
                  const filePayload: PhotoUploadPayload = { 
                      uri, 
                      name: safeName, 
                      type 
                  };

                  const response = await authApi.sendFileInChat(roomId!, filePayload);
                  if (response.code === 200 && response.data) {
                      const imageUrl = response.data;
                      const payload = { sender: user.userId, sender_role: "architect", content: imageUrl, type: "IMAGE" };
                      ws.current.send(JSON.stringify(payload));
                  } else {
                      throw new Error(response.error || 'Failed to upload image.');
                  }
              } catch (error: any) {
                  console.error('Error sending image:', error);
                  Alert.alert('Upload Failed', error.message);
              }
          }
      }

      if (message.trim()) {
          const payload = { sender: user.userId, sender_role: "architect", content: message.trim(), type: "TEXT" };
          ws.current.send(JSON.stringify(payload));
      }
  };

  const handleBack = () => router.back();

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hari ini';
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const groupMessagesByDate = (msgs: Message[]): GroupedMessage[] => {
    if (!msgs || msgs.length === 0) return [];
    
    const grouped: GroupedMessage[] = [];
    let currentDate = '';
    let previousMessage: MessageWithDate | null = null;
    
    const sortedMessages = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toDateString();
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

  const renderChatItem = ({ item }: { item: GroupedMessage }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      );
    }
    if (item.message) {
      return (
        <ChatMessage
          id={item.message.id}
          message={item.message.message}
          timestamp={new Date(item.message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
  const consultationEnd = new Date(consultation.endDate);
  const isSessionOver = chatStatus === 'ended' || now > consultationEnd;
  
  const formattedDate = new Date(consultation.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
  const formattedTime = `${new Date(consultation.startDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} - ${new Date(consultation.endDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}`;
  
  const waitingMessageText = consultation.type === 'online'
      ? `Jadwal Konsultasi Chat akan dimulai pada ${formattedDate}, pukul ${formattedTime}.`
      : 'Konsultasi tatap muka akan dimulai sesuai jadwal yang telah ditentukan.';

  return (
    <SafeAreaView style={styles.container}>
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