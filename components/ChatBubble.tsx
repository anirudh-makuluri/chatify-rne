import React from 'react'
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useUser } from '~/app/providers';
import { ChatDate, ChatMessage } from '~/lib/types'

export default function ChatBubble({ message, isGroup }: { message: ChatMessage | ChatDate, isGroup: boolean }) {
	const user = useUser()?.user;

	if(message.isDate) {
		return (
			<View>
				<Text>{message.time}</Text>
			</View>
		)
	}

	const isSelf = message.userUid == user?.uid;

	const time = new Date(message.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

	return (
		<View>
			<Text>{message.chatInfo}</Text>
		</View>
	)
}
