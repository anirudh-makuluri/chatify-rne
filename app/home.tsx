import React, { useEffect, useState } from 'react'
import { View } from 'react-native';
import { Appbar } from 'react-native-paper'
import { useUser } from './providers';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import { initAndJoinSocketRooms, joinSocketRoom, syncPendingMessages } from '~/redux/socketSlice';
import { addMessage, clearRoomData, joinChatRoom, editMessageInChat, deleteMessageFromChat, toggleReaction, updateUserPresence, setOfflineMode } from '~/redux/chatSlice';
import { useDispatch } from 'react-redux';
import { ChatMessage, TUser, TRoomData } from '~/lib/types';
import { genRoomId } from '~/lib/utils';
import RoomList from '~/components/HomeTabs/RoomList';
import Settings from '~/components/HomeTabs/Settings';
import Friends from '~/components/HomeTabs/Friends';
import HamburgerMenu from '~/components/HamburgerMenu';
import GroupChat from '~/components/GroupChat';


export default function Page() {
	const { user, isLoading, updateUser, logout, isOffline } = useUser();
	const socket = useAppSelector(state => state.socket.socket);
	const activeChatRoomId = useAppSelector(state => state.chat.activeChatRoomId);
	const dispatch = useAppDispatch();
	const reduxDispatch = useDispatch();
	const [currentView, setCurrentView] = useState<'home' | 'friends' | 'profile'>('home');
	const [showGroupModal, setShowGroupModal] = useState(false);

	const renderCurrentView = () => {
		switch (currentView) {
			case 'friends':
				return <Friends />;
			case 'profile':
				return <Settings />;
			default:
				return <RoomList />;
		}
	};

	const handleLogout = () => {
		reduxDispatch(clearRoomData());
		logout();
	};


	useEffect(() => {
		if (!isLoading && !user) {
			router.replace('/auth');
			return;
		}

		if (!user) return;

		// Update offline mode in Redux
		dispatch(setOfflineMode(isOffline || false));

		// Only initialize socket if online
		if (!isOffline) {
			const roomIds: string[] = Array.isArray(user.rooms) ? user.rooms.map(u => u.roomId) : [];

			dispatch(initAndJoinSocketRooms(roomIds, {
				email: user.email,
				name: user.name,
				photo_url: user.photo_url,
				uid: user.uid
			}));

			// Sync pending messages when coming back online
			dispatch(syncPendingMessages());
		}

		if (Array.isArray(user.rooms)) {
			user.rooms.forEach((roomData) => {
				dispatch(joinChatRoom(roomData));
			});
		}

	}, [user, isLoading, isOffline]);

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

	// Presence update listener
	socket.on('presence_update', (presenceData: any) => {
		console.log('User presence changed:', presenceData);
		dispatch(updateUserPresence(presenceData));
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
		<View style={{ flex: 1 }}>
			<Appbar.Header style={{ backgroundColor: '#ffffff', elevation: 2 }}>
				<HamburgerMenu 
					onHomePress={() => setCurrentView('home')}
					onFriendsPress={() => setCurrentView('friends')}
					onUserProfilePress={() => setCurrentView('profile')}
					onCreateGroupPress={() => setShowGroupModal(true)}
					onLogoutPress={handleLogout}
				/>
				<Appbar.Content title="Chatify" titleStyle={{ color: '#111827', fontWeight: 'bold' }} />
			</Appbar.Header>
			{renderCurrentView()}
			
			{/* Group Creation Modal */}
			{showGroupModal && (
				<GroupChat 
					onClose={() => setShowGroupModal(false)}
				/>
			)}
		</View>
	)
}
