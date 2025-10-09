import React, { useRef, useState } from 'react'
import { FlatList, Image, View } from 'react-native'
import { Avatar, Button, Card, Text, TextInput, useTheme, Icon, ActivityIndicator } from 'react-native-paper'
import { useUser } from '~/app/providers';
import { ChatMessage } from '~/lib/types';
import { setActiveRoomId, setLoadingMore } from '~/redux/chatSlice';
import { sendMessageToServer, loadChatHistory } from '~/redux/socketSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import ChatBubble from '../components/ChatBubble';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Room() {
	const activeChatRoomId = useAppSelector(state => state.chat.activeChatRoomId);
	const activeRoom = useAppSelector(state => state.chat.rooms[activeChatRoomId]);
	const textInputRef = useRef<any>(null); //Fix this

	const dispatch = useAppDispatch();

	const user = useUser()?.user;

	const [input, setInput] = useState<string>("");

	const sendMessage = () => {
		if (input.trim() == "" || input == null) return;

		if (!user) {
			//Show snack message
			return;
		}

		// Generate UUID v4-like ID
		const generateId = () => {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		};

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
				<View className='flex flex-col w-full gap-4'>
					<TextInput ref={textInputRef} value={input} onChangeText={(e) => setInput(e)} />
					<View className='flex flex-row justify-end'>
						<Button onPress={sendMessage}>
							<Avatar.Icon size={28} icon={'send'} />
						</Button>
					</View>
				</View>

			</View>
		</SafeAreaView>
	)
}
