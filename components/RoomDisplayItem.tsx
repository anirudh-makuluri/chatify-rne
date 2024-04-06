import React from 'react'
import { View } from 'react-native'
import { Avatar, Card, Text } from 'react-native-paper'
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
	}

	function getLastMessage() {
		if(!user || rooms[roomData.roomId] == null) return "Start a conversation"

		const currentMessages = rooms[roomData.roomId].messages;
		if(currentMessages.length == 0) return "Start a conversation";

		const lastMesage = currentMessages[currentMessages.length - 1];

		return `${lastMesage.userUid == user.uid ? "You" : lastMesage.userName} : ${lastMesage.chatInfo}`
	}

	if(!user) {
		return;
	}

	return (
		<Card onPress={changeActiveRoom}>
			<Card.Content className='flex flex-row items-center gap-4'>
				<Avatar.Image size={48} source={{ uri: roomData.photo_url }}/>
				<View>
					<Text variant='bodyLarge'>{roomData.name}</Text>
					<Text variant='bodyMedium'>{getLastMessage()}</Text>
				</View>
			</Card.Content>
		</Card>
	)
}
