import React from 'react'
import { View } from 'react-native';
import { Avatar, Button, Text } from 'react-native-paper';
import { useUser } from '~/app/providers';
import { TRoomData, TUser } from '~/lib/types';
import { genRoomId } from '~/lib/utils';
import { joinChatRoom } from '~/redux/chatSlice';
import { joinSocketRoom } from '~/redux/socketSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';

export default function FriendRequest({ invitedUser } : { invitedUser: TUser }) {
	const { user, updateUser } = useUser();
	const socket = useAppSelector(state => state.socket.socket);
	const dispatch = useAppDispatch();

	function respondToRequest(accepted: boolean) {
		if (!user || !socket) return;

		socket.emit('respond_friend_request_client_to_server', {
			uid: user.uid,
			requestUid: invitedUser.uid,
			isAccepted: accepted
		}, (response: any) => {
			if (response.success) {
				const receivedReqs = user.received_friend_requests;
				const reqIdx = receivedReqs.findIndex(user => user.uid == invitedUser.uid);
				if (reqIdx != -1) {
					receivedReqs.splice(reqIdx, 1);
				}

				const friendList = user.friend_list;
				const rooms = user.rooms;

				if (accepted) {
					friendList.push(invitedUser);

					const newRoomId: string = genRoomId(invitedUser.uid, user.uid)
					const newRoomData: TRoomData = {
						is_group: false,
						messages: [],
						name: invitedUser.name,
						photo_url: invitedUser.photo_url,
						roomId: newRoomId
					}
					rooms.push(newRoomData);

					dispatch(joinSocketRoom(newRoomId))
					dispatch(joinChatRoom(newRoomData))
				}

				updateUser({
					received_friend_requests: receivedReqs,
					friend_list: friendList,
					rooms
				})				
			} else {
				console.warn(response.error);
			}
		})
	}

	return (
		<View className='flex flex-row items-center justify-between'>
			<View className='flex flex-row items-center gap-2'>
				<Avatar.Image size={44} source={{ uri: invitedUser.photo_url }}/>
				<Text>{invitedUser.name}</Text>
			</View>
			<View className='flex flex-row gap-2'>
				<Button onPress={() => respondToRequest(true)} mode='contained'>Accept</Button>
				<Button onPress={() => respondToRequest(false)} mode={'outlined'}>Decline</Button>
			</View>
		</View>
	)
}
