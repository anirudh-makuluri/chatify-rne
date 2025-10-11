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
		<View className='mx-4 my-2 bg-white rounded-xl shadow-sm border border-gray-100'>
			<View className='flex flex-row items-center justify-between p-4'>
				<View className='flex flex-row gap-3 flex-1'>
					<Avatar.Image 
						size={48} 
						source={{ uri: invitedUser.photo_url }}
						style={{ borderWidth: 2, borderColor: '#e5e7eb' }}
					/>
					<View className='flex flex-col gap-1 flex-1'>
						<Text className="text-lg font-semibold text-gray-900">{invitedUser.name}</Text>
						<Text className="text-sm text-gray-500">{invitedUser.email}</Text>
						<View className="flex-row items-center gap-2 mt-1">
							<View className="w-2 h-2 bg-green-500 rounded-full"></View>
							<Text className="text-xs text-green-600 font-medium">Wants to be friends</Text>
						</View>
					</View>
				</View>
				<View className='flex flex-row gap-2'>
					<Button 
						mode='contained' 
						onPress={() => respondToRequest(true)}
						buttonColor="#10b981"
						textColor="white"
						compact
						style={{ borderRadius: 20 }}
					>
						Accept
					</Button>
					<Button 
						mode='outlined' 
						onPress={() => respondToRequest(false)}
						textColor="#ef4444"
						compact
						style={{ borderRadius: 20 }}
					>
						Decline
					</Button>
				</View>
			</View>
		</View>
	)
}
