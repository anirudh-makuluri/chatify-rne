import React, { useRef, useState } from 'react'
import { FlatList, Image, View, Alert } from 'react-native'
import { Avatar, Button, Card, Text, TextInput, useTheme, Icon, ActivityIndicator, IconButton, Menu, Portal, Dialog, ProgressBar } from 'react-native-paper'
import { useUser } from '~/app/providers';
import { ChatMessage } from '~/lib/types';
import { setActiveRoomId, setLoadingMore } from '~/redux/chatSlice';
import { sendMessageToServer, loadChatHistory } from '~/redux/socketSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import ChatBubble from '../components/ChatBubble';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '~/lib/utils';

export default function Room() {
	const activeChatRoomId = useAppSelector(state => state.chat.activeChatRoomId);
	const activeRoom = useAppSelector(state => state.chat.rooms[activeChatRoomId]);
	const textInputRef = useRef<any>(null); //Fix this

	const dispatch = useAppDispatch();

	const user = useUser()?.user;

	const [input, setInput] = useState<string>("");
	const [attachMenuVisible, setAttachMenuVisible] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const generateId = () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	};

	const sendMessage = () => {
		if (input.trim() == "" || input == null) return;

		if (!user) {
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
				<View className='px-2 py-4 bg-slate-200 flex flex-row justify-start items-center'>
					<Button onPress={handleBackButton} mode='text' className='flex flex-row justify-center items-center'>
						<Icon source={'chevron-left'} size={28} />
					</Button>
					<Avatar.Image size={48} className='mr-2' source={{ uri: activeRoom.photo_url }} />
					<Text>{activeRoom.name} </Text>
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
					onChangeText={(e) => setInput(e)}
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
		</SafeAreaView>
	)
}
