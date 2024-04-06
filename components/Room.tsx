import React, { useState } from 'react'
import { FlatList, Image, View } from 'react-native'
import { Avatar, Button, Card, Text, TextInput, useTheme } from 'react-native-paper'
import { useUser } from '~/app/providers';
import { ChatMessage } from '~/lib/types';
import { setActiveRoomId } from '~/redux/chatSlice';
import { sendMessageToServer } from '~/redux/socketSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import ChatBubble from './ChatBubble';

export default function Room() {
	const theme = useTheme();
	const activeChatRoomId = useAppSelector(state => state.chat.activeChatRoomId);
	const activeRoom = useAppSelector(state => state.chat.rooms[activeChatRoomId]);
	const socket = useAppSelector(state => state.socket.socket);

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
	}

	function handleBackButton() {
		dispatch(setActiveRoomId(''));
	}

	return (
		<View className='w-full h-full'>
			<View className='px-2 py-4 bg-slate-200 flex flex-row justify-start items-center'>
				<Button onPress={handleBackButton}>
					<Avatar.Icon size={28} icon={'arrow-left'} />
				</Button>
				<Avatar.Image size={28} source={{ uri: activeRoom.photo_url }} />
				<Text>{activeRoom.name} </Text>
				<Image source={{ uri: activeRoom.photo_url }} />
			</View>
			<FlatList
				data={activeRoom.messages}
				renderItem={({ item }) => <ChatBubble message={item} isGroup={activeRoom.is_group} />}

			/>
			<View className='flex flex-col w-full gap-4'>
				<TextInput value={input} onChangeText={(e) => setInput(e)} />
				<View className='flex flex-row justify-end'>
					<Button onPress={sendMessage}>
						<Avatar.Icon size={28} icon={'send'} />
					</Button>
				</View>
			</View>

		</View>
	)
}
