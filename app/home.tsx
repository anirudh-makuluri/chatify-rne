import React, { useEffect, useState } from 'react'
import { FlatList, View } from 'react-native';
import {
	BottomNavigation
} from 'react-native-paper'
import { useUser } from './providers';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import { initAndJoinSocketRooms, joinSocketRoom } from '~/redux/socketSlice';
import { addMessage, clearRoomData, joinChatRoom, editMessageInChat, deleteMessageFromChat, toggleReaction } from '~/redux/chatSlice';
import { ChatMessage, TUser, TRoomData } from '~/lib/types';
import { genRoomId } from '~/lib/utils';
import RoomList from '~/components/HomeTabs/RoomList';
import Settings from '~/components/HomeTabs/Settings';
import Friends from '~/components/HomeTabs/Friends';


export default function Page() {
	const { user, isLoading, updateUser, logout } = useUser();
	const socket = useAppSelector(state => state.socket.socket);
	const activeChatRoomId = useAppSelector(state => state.chat.activeChatRoomId);
	const dispatch = useAppDispatch();
	const [routes] = useState([
		{ key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
		{ key: 'friends', title: 'Friends', focusedIcon: 'account-multiple-plus', unfocusedIcon: 'account-multiple-plus-outline'  },
		{ key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
		
	]);
	const [index, setIndex] = useState(0);

	const renderScene = BottomNavigation.SceneMap({
		home: RoomList,
		friends: Friends,
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

	socket.on('chat_event_server_to_client', (msg: any) => {
		// Backend sends 'id', which we use directly
		const mappedMessage: ChatMessage = {
			...msg,
			id: msg.id
		};
		dispatch(addMessage(mappedMessage))
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

		socket.on('chat_edit_server_to_client', (data: any) => {
			console.log('Message edited by another user:', data);
			dispatch(editMessageInChat({
				roomId: data.roomId,
				id: data.id,
				chatDocId: data.chatDocId,
				newText: data.newText
			}));
		})

	socket.on('chat_delete_server_to_client', (data: any) => {
		console.log('Message deleted by another user:', data);
		dispatch(deleteMessageFromChat({
			roomId: data.roomId,
			id: data.id,
			chatDocId: data.chatDocId
		}));
	})

	socket.on('chat_reaction_server_to_client', (data: any) => {
		console.log('Reaction added/removed by another user:', data);
		dispatch(toggleReaction({
			roomId: data.roomId,
			id: data.id,
			reactionId: data.reactionId,
			userUid: data.userUid,
			userName: data.userName
		}));
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
			activeColor="#3b82f6"
			inactiveColor="#6b7280"
			barStyle={{ 
				backgroundColor: '#ffffff',
				borderTopWidth: 1,
				borderTopColor: '#e5e7eb',
				paddingBottom: 8,
				paddingTop: 8
			}}
		/>
	)
}
