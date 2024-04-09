import React, { useRef, useState } from 'react'
import { FlatList, Image, View } from 'react-native'
import { Avatar, Button, Card, Text, TextInput, useTheme, Icon } from 'react-native-paper'
import { useUser } from '~/app/providers';
import { ChatMessage } from '~/lib/types';
import { setActiveRoomId } from '~/redux/chatSlice';
import { sendMessageToServer } from '~/redux/socketSlice';
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

		const chatMessage: ChatMessage = {
			chatId: (Date.now() * Math.floor(Math.random() * 1000)),
			roomId: activeChatRoomId,
			type: 'text',
			chatInfo: input,
			userUid: user.uid,
			userName: user.name,
			userPhoto: user.photo_url,
			time: new Date()
		}

		dispatch(sendMessageToServer(chatMessage))
		setInput("");
		if(textInputRef.current) textInputRef.current.blur();
	}

	function handleBackButton() {
		router.back();
		dispatch(setActiveRoomId(''));
	}

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
					renderItem={({ item }) => <ChatBubble message={item} isGroup={activeRoom.is_group} />}

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
