import React, { useEffect, useState } from 'react'
import { FlatList, View } from 'react-native';
import {
	BottomNavigation
} from 'react-native-paper'
import { useUser } from './providers';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import { initAndJoinSocketRooms, joinSocketRoom } from '~/redux/socketSlice';
import { addMessage, clearRoomData, joinChatRoom } from '~/redux/chatSlice';
import { ChatMessage, TRoomData, TUser } from '~/lib/types';
import { genRoomId } from '~/lib/utils';
import RoomList from '~/components/RoomList';
import Settings from '~/components/Settings';


export default function Page() {
	const { user, isLoading, updateUser, logout } = useUser();
	const socket = useAppSelector(state => state.socket.socket);
	const activeChatRoomId = useAppSelector(state => state.chat.activeChatRoomId);
	const dispatch = useAppDispatch();
	const [routes] = useState([
		{ key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
		{ key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' }
	]);
	const [index, setIndex] = useState(0);

	const renderScene = BottomNavigation.SceneMap({
		home: RoomList,
		settings: Settings,
	});


	useEffect(() => {
		if (!isLoading && !user) {
			router.replace('/auth');
			return;
		}

		if (!user) return;

		const roomIds: string[] = user.rooms.map(u => u.roomId);

		dispatch(initAndJoinSocketRooms(roomIds, {
			email: user.email,
			name: user.name,
			photo_url: user.photo_url,
			uid: user.uid
		}));

		user.rooms.forEach((roomData) => {
			dispatch(joinChatRoom(roomData));
		});

	}, [user, isLoading]);

	useEffect(() => {
		if (!socket) return;

		socket.on('chat_event_server_to_client', (msg: ChatMessage) => {
			dispatch(addMessage(msg))
		})

		socket.on('send_friend_request_server_to_client', (data: TUser) => {
			console.log("Received friend request from " + data.name);
			const receivedFriendRequests = user?.received_friend_requests || [];
			receivedFriendRequests.push(data);
			updateUser({ received_friend_requests: receivedFriendRequests });
		})

		socket.on('respond_friend_request_server_to_client', (data: TUser) => {
			if (!user) return;

			//For now, socket is emitted only when the request is accepted. Might have to handle the other case in the future.

			const friendList = user.friend_list;
			const rooms = user.rooms;

			friendList.push(data);

			const newRoomId: string = genRoomId(data.uid, user.uid)
			const newRoomData: TRoomData = {
				is_group: false,
				messages: [],
				name: data.name,
				photo_url: data.photo_url,
				roomId: newRoomId
			}
			rooms.push(newRoomData);

			dispatch(joinSocketRoom(newRoomId))
			dispatch(joinChatRoom(newRoomData))

			updateUser({
				friend_list: friendList,
				rooms
			})
		})

		return () => {
			if(activeChatRoomId != '') return;

			// console.log("Turning off socket listeners");
			// socket.off("chat_event_server_to_client");
			// socket.off("send_friend_request_server_to_client")
			// socket.off('respond_friend_request_server_to_client');
		}

	}, [socket]);

	return (
		<BottomNavigation
			navigationState={{ index, routes }}
			onIndexChange={setIndex}
			renderScene={renderScene}
		/>
	)
}
