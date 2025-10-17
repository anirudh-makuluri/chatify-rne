import React, { useEffect, useRef, useState } from 'react'
import { FlatList, Image, View, Alert, ScrollView } from 'react-native'
import { Avatar, Button, Card, Text, TextInput, useTheme, Icon, ActivityIndicator, IconButton, Menu, Portal, Dialog, ProgressBar, Chip } from 'react-native-paper'
import { useUser } from '~/app/providers';
import { ChatMessage } from '~/lib/types';
import { setActiveRoomId, setLoadingMore } from '~/redux/chatSlice';
import { sendMessageToServer, loadChatHistory, requestConversationSummaryAction, analyzeMessageSentimentAction, getSmartRepliesAction, sendAIChatRequestAction } from '~/redux/socketSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import ChatBubble from '../components/ChatBubble';
import GroupChat from '../components/GroupChat';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '~/lib/utils';

export default function Room() {
	const activeChatRoomId = useAppSelector(state => state.chat.activeChatRoomId);
	const activeRoom = useAppSelector(state => state.chat.rooms[activeChatRoomId]);
	const userPresence = useAppSelector(state => state.chat.userPresence);
	const textInputRef = useRef<any>(null); //Fix this

	const dispatch = useAppDispatch();

	const user = useUser()?.user;

	const [input, setInput] = useState<string>("");
	const [attachMenuVisible, setAttachMenuVisible] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [aiMenuVisible, setAiMenuVisible] = useState(false);
	const [summaryDialogVisible, setSummaryDialogVisible] = useState(false);
	const [summary, setSummary] = useState<string>("");
	const [sentimentDialogVisible, setSentimentDialogVisible] = useState(false);
	const [sentiment, setSentiment] = useState<string>("");
	const [smartRepliesDialogVisible, setSmartRepliesDialogVisible] = useState(false);
	const [smartReplies, setSmartReplies] = useState<string[]>([]);
	const [testMessage, setTestMessage] = useState("");
	const [showSmartReplies, setShowSmartReplies] = useState(false);
	const [showGroupManagement, setShowGroupManagement] = useState(false);
	const [showGroupMembers, setShowGroupMembers] = useState(false);

	if(activeChatRoomId == '' || activeRoom == null) {
		return null;
	}

	const generateId = () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	};

	// Helper functions for presence and group management
	const getUserPresence = () => {
		if(!user) return '';
		if(!activeRoom) return '';
		if(activeRoom.is_group) return ''
		const otherUid = (activeRoom.members || []).find((m: any) => m.uid !== user.uid);
		if(!otherUid) return '';
		if (userPresence[otherUid]?.is_online) return 'Online';
		console.log(userPresence[otherUid]);
		return `Last seen ${formatLastSeen(userPresence[otherUid]?.last_seen || null)}`;
	};

	const getMemberName = (uid: string) => {
		const friend = user?.friend_list?.find(f => f.uid === uid);
		return friend?.name || 'Unknown User';
	};

	const getMemberPhoto = (uid: string) => {
		const friend = user?.friend_list?.find(f => f.uid === uid);
		return friend?.photo_url || '';
	};

	const formatLastSeen = (input: string | number | null) => {		
		if (!input) return '';
		
		const date = new Date(input);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes} min ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
		const days = Math.floor(hours / 24);
		return `${days} day${days > 1 ? 's' : ''} ago`;
	};

	const sendMessage = () => {
		if (input.trim() == "" || input == null) return;

		if (!user || activeChatRoomId == '') {
			//Show snack message
			return;
		}

		const chatMessage: ChatMessage = {
			id: generateId(),
			roomId: activeChatRoomId,
			type: 'text',
			chatInfo: input,
			userUid: user.uid,
			userName: user.name,
			userPhoto: user.photo_url,
			time: new Date(),
			isMsgEdited: false,
			isMsgSaved: false,
			fileName: ''
		}

		dispatch(sendMessageToServer(chatMessage))
		setInput("");
		setShowSmartReplies(false); // Clear smart replies when message is sent
		if(textInputRef.current) textInputRef.current.blur();
	}

	function handleBackButton() {
		router.back();
		dispatch(setActiveRoomId(''));
	}

	const handleLoadMore = () => {
		if (!activeRoom.hasMoreMessages || activeRoom.isLoadingMore) return;
		
		dispatch(setLoadingMore({ roomId: activeChatRoomId, isLoading: true }));
		dispatch(loadChatHistory(activeChatRoomId, activeRoom.currentChatDocId));
	};

	// AI Functions
	const handleSummarizeConversation = async () => {
		try {
			const response = await dispatch(requestConversationSummaryAction(activeChatRoomId)) as any;
			if (response.success && response.summary) {
				setSummary(response.summary);
				setSummaryDialogVisible(true);
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to generate conversation summary');
		}
		setAiMenuVisible(false);
	};

	const handleAnalyzeSentiment = () => {
		// Get the previous message for sentiment analysis
		const messages = activeRoom.messages;
		const textMessages = messages.filter(msg => !msg.isDate && msg.type === 'text');
		
		if (textMessages.length === 0) {
			Alert.alert('No Messages', 'No text messages found to analyze');
			setAiMenuVisible(false);
			return;
		}

		// Get the last text message
		const lastMessage = textMessages[textMessages.length - 1];
		setTestMessage(lastMessage.chatInfo || '');
		handleSentimentAnalysis();
		setAiMenuVisible(false);
	};

	const handleGetSmartReplies = () => {
		// Get the latest message that's not from the current user
		const messages = activeRoom.messages;
		const otherUserMessages = messages.filter(msg => 
			!msg.isDate && 
			msg.type === 'text' && 
			msg.userUid !== user?.uid
		);
		
		if (otherUserMessages.length === 0) {
			Alert.alert('No Messages', 'No messages from other users found to generate smart replies');
			setAiMenuVisible(false);
			return;
		}

		// Get the latest message from other users
		const latestOtherMessage = otherUserMessages[otherUserMessages.length - 1];
		setTestMessage(latestOtherMessage.chatInfo || '');
		handleSmartRepliesRequestInline();
		setAiMenuVisible(false);
	};

	const handleSendAIMessage = () => {
		if (!testMessage.trim()) return;
		dispatch(sendAIChatRequestAction(testMessage, activeChatRoomId));
		setTestMessage('');
		setAiMenuVisible(false);
	};

	const handleSentimentAnalysis = async () => {
		if (!testMessage.trim()) {
			Alert.alert('Error', 'Please enter a message to analyze');
			return;
		}

		// Show the dialog immediately
		setSentimentDialogVisible(true);
		setSentiment(''); // Reset sentiment

		try {
			const response = await dispatch(analyzeMessageSentimentAction(testMessage)) as any;
			if (response.success && response.sentiment) {
				setSentiment(response.sentiment);
			} else {
				Alert.alert('Error', 'Failed to analyze message sentiment');
				setSentimentDialogVisible(false);
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to analyze message sentiment');
			setSentimentDialogVisible(false);
		}
	};

	const handleSmartRepliesRequestInline = async () => {
		if (!testMessage.trim()) {
			Alert.alert('Error', 'Please enter a message to get smart replies');
			return;
		}

		// Show smart replies above text box
		setShowSmartReplies(true);
		setSmartReplies([]); // Reset smart replies

		try {
			const response = await dispatch(getSmartRepliesAction(testMessage, activeChatRoomId)) as any;
			if (response.success && response.replies) {
				setSmartReplies(response.replies);
			} else {
				Alert.alert('Error', 'Failed to get smart replies');
				setShowSmartReplies(false);
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to get smart replies');
			setShowSmartReplies(false);
		}
	};

	const pickImage = async () => {
		setAttachMenuVisible(false);
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission needed', 'Please grant camera roll permissions');
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			quality: 0.8,
			allowsEditing: false,
		});
		if (!result.canceled && result.assets[0]) {
			handleFileUpload(result.assets[0].uri, result.assets[0].fileName || 'image.jpg', 'image');
		}
	};

	const takePhoto = async () => {
		setAttachMenuVisible(false);
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission needed', 'Please grant camera permissions');
			return;
		}
		const result = await ImagePicker.launchCameraAsync({
			quality: 0.8,
			allowsEditing: false,
		});
		if (!result.canceled && result.assets[0]) {
			handleFileUpload(result.assets[0].uri, 'photo.jpg', 'image');
		}
	};

	const pickDocument = async () => {
		setAttachMenuVisible(false);
	
		const result = await DocumentPicker.getDocumentAsync({
			type: '*/*',
			copyToCacheDirectory: true,
		});
		if (!result.canceled && result.assets[0]) {
			const file = result.assets[0];
			handleFileUpload(file.uri, file.name, 'file');
		}
	};

	const handleFileUpload = async (uri: string, fileName: string, type: 'image' | 'file') => {
		if (!user) return;

		setUploading(true);
		setUploadProgress(0);

		try {
			// Simulate progress (you can implement real progress tracking if needed)
			const progressInterval = setInterval(() => {
				setUploadProgress(prev => Math.min(prev + 0.1, 0.9));
			}, 100);

			const downloadUrl = await uploadFile(user.uid, uri, fileName, type === 'image' ? 'image/jpeg' : 'application/octet-stream');

			clearInterval(progressInterval);
			setUploadProgress(1);

			// Send message with file
			const chatMessage: ChatMessage = {
				id: generateId(),
				roomId: activeChatRoomId,
				type: type === 'image' ? 'image' : 'file',
				chatInfo: downloadUrl,
				fileName: fileName,
				userUid: user.uid,
				userName: user.name,
				userPhoto: user.photo_url,
				time: new Date(),
				isMsgEdited: false,
				isMsgSaved: false
			};

			dispatch(sendMessageToServer(chatMessage));
		} catch (error) {
			console.error('Upload error:', error);
			Alert.alert('Upload failed', 'Failed to upload file. Please try again.');
		} finally {
			setUploading(false);
			setUploadProgress(0);
		}
	};

	const renderListHeader = () => {
		if (!activeRoom.hasMoreMessages) return null;
		
		return (
			<View className='py-4 flex items-center justify-center'>
				{activeRoom.isLoadingMore ? (
					<ActivityIndicator size="small" />
				) : (
					<Button mode="text" onPress={handleLoadMore}>
						Load More Messages
					</Button>
				)}
			</View>
		);
	};

	return (
		<SafeAreaView>
			<View className='w-full h-full'>
				<View className='px-2 py-4 bg-slate-200 flex flex-row justify-between items-center'>
					<View className='flex flex-row items-center flex-1'>
						<Button onPress={handleBackButton} mode='text' className='flex flex-row justify-center items-center'>
							<Icon source={'chevron-left'} size={28} />
						</Button>
						<View className='flex-row items-center flex-1'>
							<Avatar.Image size={48} className='mr-2' source={{ uri: activeRoom?.photo_url }} />
							<View className='flex-1'>
								<Text className='font-semibold'>{activeRoom.name}</Text>
								{activeRoom.is_group ? (
									<Text className='text-sm text-gray-600'>
										{activeRoom.members?.length || 0} members
									</Text>
								) : (
									<View className='flex-row items-center'>
										<Text className='text-sm text-gray-600'>
											{getUserPresence()}
										</Text>
									</View>
								)}
							</View>
						</View>
					</View>
					
					<View className='flex-row items-center'>
						{activeRoom.is_group && (
							<IconButton
								icon="account-multiple"
								size={24}
								onPress={() => setShowGroupMembers(true)}
							/>
						)}
						<Menu
							visible={aiMenuVisible}
							onDismiss={() => setAiMenuVisible(false)}
							anchor={
								<IconButton
									icon="robot"
									size={24}
									onPress={() => setAiMenuVisible(true)}
								/>
							}
						>
							<Menu.Item onPress={handleSummarizeConversation} title="Summarize" leadingIcon="text-box-outline" />
							<Menu.Item onPress={handleAnalyzeSentiment} title="Sentiment" leadingIcon="emoticon-outline" />
							<Menu.Item onPress={handleGetSmartReplies} title="Smart Replies" leadingIcon="lightbulb-outline" />
							<Menu.Item onPress={handleSendAIMessage} title="Ask AI" leadingIcon="chat" />
						</Menu>
					</View>
				</View>
			<FlatList
				data={activeRoom.messages}
				renderItem={({ item }) => <ChatBubble message={item} isGroup={activeRoom.is_group} roomId={activeChatRoomId}/>}
				ListHeaderComponent={renderListHeader}
				inverted={false}
			/>
			
			{/* Upload Progress */}
			{uploading && (
				<View className='px-4 py-2 bg-slate-100'>
					<Text className='text-sm mb-1'>Uploading...</Text>
					<ProgressBar progress={uploadProgress} />
				</View>
			)}

			{/* Smart Replies */}
			{showSmartReplies && (
				<View className='px-4 py-2 bg-blue-50 border-t border-blue-200'>
					<View className='flex-row items-center justify-between mb-2'>
						<Text variant='bodySmall' className='text-blue-700'>
							Smart replies for: "{testMessage}"
						</Text>
						<IconButton
							icon="close"
							size={16}
							onPress={() => setShowSmartReplies(false)}
						/>
					</View>
					{smartReplies.length > 0 ? (
						<View className='flex-row flex-wrap gap-2'>
							{smartReplies.map((reply, index) => (
								<Button
									key={index}
									mode="outlined"
									compact
									onPress={() => {
										setInput(reply);
										setShowSmartReplies(false);
									}}
									style={{ marginBottom: 4 }}
								>
									{reply}
								</Button>
							))}
						</View>
					) : (
						<View className='flex-row items-center gap-2'>
							<ActivityIndicator size="small" />
							<Text variant='bodySmall' className='text-blue-600'>
								Generating smart replies...
							</Text>
						</View>
					)}
				</View>
			)}
			
			<View className='flex flex-row items-center w-full gap-2 p-2'>
				<Menu
					visible={attachMenuVisible}
					onDismiss={() => setAttachMenuVisible(false)}
					anchor={
						<IconButton
							icon="attachment"
							size={24}
							onPress={() => setAttachMenuVisible(true)}
							disabled={uploading}
						/>
					}
				>
					<Menu.Item onPress={takePhoto} title="Take Photo" leadingIcon="camera" />
					<Menu.Item onPress={pickImage} title="Photo & Video" leadingIcon="image" />
					<Menu.Item onPress={pickDocument} title="Document" leadingIcon="file" />
				</Menu>
				
				<TextInput
					ref={textInputRef}
					value={input}
					onChangeText={(e) => {
						setInput(e);
						// Clear smart replies when user starts typing
						if (e.length > 0 && showSmartReplies) {
							setShowSmartReplies(false);
						}
					}}
					placeholder="Type a message..."
					style={{ flex: 1 }}
					disabled={uploading}
				/>
				
				<IconButton
					icon="send"
					size={24}
					onPress={sendMessage}
					disabled={uploading || !input.trim()}
				/>
			</View>

			</View>

			{/* AI Dialogs */}
			<Portal>
				{/* Summary Dialog */}
				<Dialog visible={summaryDialogVisible} onDismiss={() => setSummaryDialogVisible(false)}>
					<Dialog.Title>Conversation Summary</Dialog.Title>
					<Dialog.Content>
						<Text>{summary}</Text>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setSummaryDialogVisible(false)}>Close</Button>
					</Dialog.Actions>
				</Dialog>

				{/* Sentiment Analysis Dialog */}
				<Dialog visible={sentimentDialogVisible} onDismiss={() => setSentimentDialogVisible(false)}>
					<Dialog.Title>Sentiment Analysis</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyMedium" className="mb-3">
							Analyzing: "{testMessage}"
						</Text>
						{sentiment ? (
							<View className="flex-row items-center gap-2 p-3 bg-gray-100 rounded">
								<Icon 
									source={sentiment === 'positive' ? 'emoticon-happy' : sentiment === 'negative' ? 'emoticon-sad' : 'emoticon-neutral'}
									size={24}
								/>
								<Text variant="titleMedium">
									{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
								</Text>
							</View>
						) : (
							<View className="flex-row items-center gap-2 p-3">
								<ActivityIndicator size="small" />
								<Text>Analyzing sentiment...</Text>
							</View>
						)}
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setSentimentDialogVisible(false)}>Close</Button>
					</Dialog.Actions>
				</Dialog>

				{/* Smart Replies Dialog */}
				<Dialog visible={smartRepliesDialogVisible} onDismiss={() => setSmartRepliesDialogVisible(false)}>
					<Dialog.Title>Smart Reply Suggestions</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyMedium" className="mb-3">
							Replying to: "{testMessage}"
						</Text>
						{smartReplies.length > 0 ? (
							<View className="gap-2">
								{smartReplies.map((reply, index) => (
									<Button
										key={index}
										mode="outlined"
										onPress={() => {
											setInput(reply);
											setSmartRepliesDialogVisible(false);
										}}
										className="mb-1"
									>
										{reply}
									</Button>
								))}
							</View>
						) : (
							<View className="flex-row items-center gap-2 p-3">
								<ActivityIndicator size="small" />
								<Text>Generating smart replies...</Text>
							</View>
						)}
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setSmartRepliesDialogVisible(false)}>Close</Button>
					</Dialog.Actions>
				</Dialog>

				{/* Group Members Dialog */}
				<Dialog visible={showGroupMembers} onDismiss={() => setShowGroupMembers(false)}>
					<Dialog.Title>Group Members</Dialog.Title>
					<Dialog.Content>
						<ScrollView showsVerticalScrollIndicator={false}>
							{activeRoom.members?.map(uid => {
								// const presence = getUserPresence();
								return (
									<Card key={uid} className="mb-2">
										<View className="flex-row items-center p-3">
											{/* <Avatar.Image 
												size={40} 
												source={{ uri: getMemberPhoto(uid) }} 
											/> */}
											<View className="flex-1 ml-3">
												<Text variant="titleMedium">{getMemberName(uid)}</Text>
												<View className="flex-row items-center">
													{/* <View className={`w-2 h-2 rounded-full mr-1 ${
														presence?.is_online ? 'bg-green-500' : 'bg-gray-400'
													}`} />
													<Text variant="bodySmall" className="text-gray-500">
														{presence?.is_online 
															? 'Online' 
															: `Last seen ${formatLastSeen(presence?.last_seen || null)}`
														}
													</Text> */}
												</View>
											</View>
										</View>
									</Card>
								);
							})}
						</ScrollView>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setShowGroupMembers(false)}>Close</Button>
						<Button onPress={() => {
							setShowGroupMembers(false);
							setShowGroupManagement(true);
						}}>Manage Group</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			{/* Group Management Modal */}
			{showGroupManagement && (
				<GroupChat
					roomId={activeChatRoomId}
					onClose={() => setShowGroupManagement(false)}
				/>
			)}
		</SafeAreaView>
	)
}
