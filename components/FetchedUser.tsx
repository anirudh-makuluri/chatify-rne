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
		<View className='flex flex-row justify-between items-center gap-6'>
			<View className='flex flex-row gap-2'>
				<Avatar.Image size={32} source={{ uri: fetchedUser.photo_url }}/>
				<View className='flex flex-col gap-2'>
					<Text>{fetchedUser.name}</Text>
					<Text>{fetchedUser.email}</Text>
				</View>
			</View>
			<Button mode='contained' onPress={handleAddFriend}>Add Friend</Button>

			<Snackbar
				visible={snackbarMsg.length > 0}
				duration={5000}
				onDismiss={() => setSnackbarMsg("")}>
				{snackbarMsg}
			</Snackbar>
		</View>
	)
}
