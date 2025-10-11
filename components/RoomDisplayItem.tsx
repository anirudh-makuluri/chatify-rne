import { router } from 'expo-router';
import React from 'react'
import { View } from 'react-native'
import { Avatar, Card, Text, Chip } from 'react-native-paper'
import { useUser } from '~/app/providers';
import { TRoomData } from '~/lib/types'
import { setActiveRoomId } from '~/redux/chatSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';

export default function RoomDisplayItem({ roomData }: { roomData: TRoomData }) {
	const dispatch = useAppDispatch();
	const {	user } = useUser();
	const rooms = useAppSelector(state => state.chat.rooms);

	function changeActiveRoom() {
		if(!user) return;

		dispatch(setActiveRoomId(roomData.roomId));
		router.push('/room')
	}

	function getLastMessage() {
		if(!user || rooms[roomData.roomId] == null) return "Start a conversation"

		const currentMessages = rooms[roomData.roomId].messages;
		if(currentMessages.length == 0) return "Start a conversation";

		const lastMesage = currentMessages[currentMessages.length - 1];
		const isAIMessage = lastMesage.isAIMessage || lastMesage.userUid === 'ai-assistant';

		return `${lastMesage.userUid == user.uid ? "You" : (isAIMessage ? "AI" : lastMesage.userName)} : ${lastMesage.chatInfo}`
	}

	const isAIRoom = roomData.is_ai_room || roomData.roomId.startsWith('ai-assistant-');

	if(!user) {
		return;
	}

	return (
		<Card 
			onPress={changeActiveRoom}
			style={isAIRoom ? { backgroundColor: '#f3f4f6', borderLeftWidth: 4, borderLeftColor: '#6366f1' } : {}}
		>
			<Card.Content className='flex flex-row items-center gap-4'>
				<Avatar.Image 
					size={48} 
					source={{ 
						uri: isAIRoom 
							? 'https://ui-avatars.com/api/?name=AI&background=6366f1&color=ffffff' 
							: roomData.photo_url 
					}}
				/>
				<View className="flex-1">
					<View className="flex-row items-center gap-2">
						<Text variant='bodyLarge'>{roomData.name}</Text>
						{isAIRoom && (
							<Chip icon="robot" compact style={{ height: 20 }}>
								AI
							</Chip>
						)}
					</View>
					<Text variant='bodyMedium'>{getLastMessage()}</Text>
				</View>
			</Card.Content>
		</Card>
	)
}
