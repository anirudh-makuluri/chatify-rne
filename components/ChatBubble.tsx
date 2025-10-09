import React, { useState } from 'react'
import { View, Pressable } from 'react-native';
import { Avatar, Text, Menu, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { useUser } from '~/app/providers';
import { ChatDate, ChatMessage } from '~/lib/types';
import { useAppDispatch } from '~/redux/store';
import { editMessage, deleteMessage } from '~/redux/socketSlice';
import { editMessageInChat, deleteMessageFromChat } from '~/redux/chatSlice';

export default function ChatBubble({ message, isGroup, roomId }: { message: ChatMessage | ChatDate, isGroup: boolean, roomId: string }) {
	const user = useUser()?.user;
	const dispatch = useAppDispatch();

	const [menuVisible, setMenuVisible] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [editText, setEditText] = useState('');

	if (message.isDate) {
		return (
			<View className='flex flex-row justify-center self-center sticky top-0 w-1/3 border border-black rounded-md my-2'>
				<Text>{message.time}</Text>
			</View>
		)
	}

	const isSelf = message.userUid == user?.uid;

	const time = new Date(message.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

	const openMenu = () => setMenuVisible(true);
	const closeMenu = () => setMenuVisible(false);

	const handleEditPress = () => {
		setEditText(message.chatInfo || '');
		setEditDialogVisible(true);
		closeMenu();
	};

	const handleDeletePress = () => {
		setDeleteDialogVisible(true);
		closeMenu();
	};

	const confirmEdit = () => {
		if (editText.trim() && message.chatDocId) {
			// Emit to server
			console.log('Editing message:', message);
			dispatch(editMessage({
				id: String(message.id),
				chatDocId: message.chatDocId,
				roomId: roomId,
				newText: editText
			}));

			// Update locally
			dispatch(editMessageInChat({
				roomId: roomId,
				id: String(message.id),
				chatDocId: message.chatDocId,
				newText: editText
			}));
		}
		setEditDialogVisible(false);
		setEditText('');
	};

	const confirmDelete = () => {
		if (message.chatDocId) {
			// Emit to server
			dispatch(deleteMessage({
				id: String(message.id),
				chatDocId: message.chatDocId,
				roomId: roomId
			}));

			// Update locally
			dispatch(deleteMessageFromChat({
				roomId: roomId,
				id: String(message.id),
				chatDocId: message.chatDocId
			}));
		}
		setDeleteDialogVisible(false);
	};

	return (
		<>
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
					<Menu
						visible={menuVisible}
						onDismiss={closeMenu}
						anchor={
							<Pressable 
								onLongPress={isSelf ? openMenu : undefined}
								delayLongPress={500}
							>
								<View className={(isSelf
									? (message.isConsecutiveMessage
										? 'bg-primary mr-5' :
										'bg-primary mr-5 rounded-tr-none') :
									(message.isConsecutiveMessage
										? 'bg-slate-200 ml-5' :
										'bg-slate-200 ml-5 rounded-tl-none'))
									+ " py-2 px-4 rounded-md"}>
									<Text>{message.chatInfo}</Text>
									<View className='flex flex-row items-center gap-1'>
										<Text className='opacity-65 text-[10px]'>{time}</Text>
										{message.isMsgEdited && <Text className='opacity-65 text-[10px]'>(edited)</Text>}
									</View>
								</View>
							</Pressable>
						}
					>
						<Menu.Item onPress={handleEditPress} title="Edit" leadingIcon="pencil" />
						<Menu.Item onPress={handleDeletePress} title="Delete" leadingIcon="delete" />
					</Menu>
				</View>
			</View>

			{/* Edit Dialog */}
			<Portal>
				<Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
					<Dialog.Title>Edit Message</Dialog.Title>
					<Dialog.Content>
						<TextInput
							mode="outlined"
							value={editText}
							onChangeText={setEditText}
							multiline
							autoFocus
						/>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
						<Button onPress={confirmEdit}>Save</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			{/* Delete Confirmation Dialog */}
			<Portal>
				<Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
					<Dialog.Title>Delete Message</Dialog.Title>
					<Dialog.Content>
						<Text>Are you sure you want to delete this message?</Text>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
						<Button onPress={confirmDelete} textColor="red">Delete</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</>
	)
}
