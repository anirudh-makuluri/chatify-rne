import React from 'react'
import { View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { useUser } from '~/app/providers';
import { ChatDate, ChatMessage } from '~/lib/types'

export default function ChatBubble({ message, isGroup }: { message: ChatMessage | ChatDate, isGroup: boolean }) {
	const user = useUser()?.user;

	if (message.isDate) {
		return (
			<View className='flex flex-row justify-center self-center sticky top-0 w-1/3 border border-black rounded-md my-2'>
				<Text>{message.time}</Text>
			</View>
			
		)
	}

	const isSelf = message.userUid == user?.uid;

	const time = new Date(message.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

	return (
		<View className={(isSelf ? 'justify-end' : 'justify-start') + " flex my-2 flex-row w-full"}>
			<View className='flex flex-col gap-1 w-[40%]'>
				{
					(!message.isConsecutiveMessage && isGroup) && (
						<View className={(isSelf ? 'flex-row-reverse' : "flex-row") + ' flex gap-2 items-center'}>
							<Avatar.Image size={28} source={{ uri: message.userPhoto }} />
							<Text className='text-secondary-foreground'>{message.userName}</Text>
						</View>
					)
				}
				<View className={(isSelf
					? (message.isConsecutiveMessage
						? 'bg-primary mr-5' :
						'bg-primary mr-5 rounded-tr-none') :
					(message.isConsecutiveMessage
						? 'bg-slate-200 ml-5' :
						'bg-slate-200 ml-5 rounded-tl-none'))
					+ " py-2 px-4 rounded-md"}>
					<Text>{message.chatInfo}</Text>
					<Text className='opacity-65 text-[10px]'>{time}</Text>
				</View>
			</View>
		</View>
	)
}
