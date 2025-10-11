import React, { useState } from 'react'
import { View } from 'react-native';
import { Avatar, Button, Snackbar, Text } from 'react-native-paper';
import { useUser } from '~/app/providers'
import { TUser } from '~/lib/types';
import { useAppSelector } from '~/redux/store';

export default function FetchedUser({ fetchedUser, closeModal }: { fetchedUser: TUser, closeModal: () => void }) {
	const { user } = useUser();
	const socket = useAppSelector(state => state.socket.socket);
	const [snackbarMsg, setSnackbarMsg] = useState("");

	function handleAddFriend() {
		if (!user || !socket) return;

		socket.emit('send_friend_request_client_to_server', { senderUid: user.uid, receiverUid: fetchedUser.uid }, (res: any) => {
			console.log(res);
			setSnackbarMsg(JSON.stringify(res));

			closeModal();
		})
	}

	return (
		<View className='bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100'>
			<View className='flex flex-row justify-between items-center'>
				<View className='flex flex-row gap-3 flex-1'>
					<Avatar.Image 
						size={48} 
						source={{ uri: fetchedUser.photo_url }}
						style={{ borderWidth: 2, borderColor: '#e5e7eb' }}
					/>
					<View className='flex flex-col gap-1 flex-1'>
						<Text className="text-lg font-semibold text-gray-900">{fetchedUser.name}</Text>
						<Text className="text-sm text-gray-500">{fetchedUser.email}</Text>
						<View className="flex-row items-center gap-2 mt-1">
							<View className="w-2 h-2 bg-blue-500 rounded-full"></View>
							<Text className="text-xs text-blue-600 font-medium">Available to add</Text>
						</View>
					</View>
				</View>
				<Button 
					mode='contained' 
					onPress={handleAddFriend}
					buttonColor="#3b82f6"
					textColor="white"
					compact
					style={{ borderRadius: 20 }}
				>
					Add Friend
				</Button>
			</View>

			<Snackbar
				visible={snackbarMsg.length > 0}
				duration={5000}
				onDismiss={() => setSnackbarMsg("")}
				style={{ backgroundColor: '#10b981' }}
			>
				{snackbarMsg}
			</Snackbar>
		</View>
	)
}
