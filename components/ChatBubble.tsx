import React, { useState } from 'react'
import { View, Pressable, ScrollView } from 'react-native';
import { Avatar, Text, Menu, Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import { useUser } from '~/app/providers';
import { ChatDate, ChatMessage } from '~/lib/types';
import { useAppDispatch } from '~/redux/store';
import { editMessage, deleteMessage, addReaction } from '~/redux/socketSlice';
import { editMessageInChat, deleteMessageFromChat, toggleReaction } from '~/redux/chatSlice';

export default function ChatBubble({ message, isGroup, roomId }: { message: ChatMessage | ChatDate, isGroup: boolean, roomId: string }) {
	const user = useUser()?.user;
	const dispatch = useAppDispatch();

	const [menuVisible, setMenuVisible] = useState(false);
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
	const [editText, setEditText] = useState('');

	// Common emojis for quick reactions
	const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'];

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

	const handleReactPress = () => {
		setEmojiPickerVisible(true);
		closeMenu();
	};

	const handleEmojiSelect = (emoji: string) => {
		if (!user || !message.chatDocId) return;

		// Only emit to server - server will broadcast back to everyone including us
		dispatch(addReaction({
			reactionId: emoji,
			id: String(message.id),
			chatDocId: message.chatDocId,
			roomId: roomId,
			userUid: user.uid,
			userName: user.name
		}));

		setEmojiPickerVisible(false);
	};

	const handleReactionClick = (emoji: string) => {
		if (!user || !message.chatDocId) return;

		// Emit to server
		dispatch(addReaction({
			reactionId: emoji,
			id: String(message.id),
			chatDocId: message.chatDocId,
			roomId: roomId,
			userUid: user.uid,
			userName: user.name
		}));
	};

	const confirmEdit = () => {
		if (editText.trim() && message.chatDocId) {
			// Only emit to server - server will broadcast back to everyone including us
			dispatch(editMessage({
				id: String(message.id),
				chatDocId: message.chatDocId,
				roomId: roomId,
				newText: editText
			}));
		}
		setEditDialogVisible(false);
		setEditText('');
	};

	const confirmDelete = () => {
		if (message.chatDocId) {
			// Only emit to server - server will broadcast back to everyone including us
			dispatch(deleteMessage({
				id: String(message.id),
				chatDocId: message.chatDocId,
				roomId: roomId
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
								onLongPress={openMenu}
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
						<Menu.Item onPress={handleReactPress} title="React" leadingIcon="emoticon-happy-outline" />
						{isSelf && <Menu.Item onPress={handleEditPress} title="Edit" leadingIcon="pencil" />}
						{isSelf && <Menu.Item onPress={handleDeletePress} title="Delete" leadingIcon="delete" />}
					</Menu>
					
					{/* Display reactions */}
					{!message.isDate && (message as ChatMessage).reactions && (message as ChatMessage).reactions!.length > 0 && (
						<View className='flex flex-row flex-wrap gap-1 mt-1 ml-5'>
							{(message as ChatMessage).reactions!.map((reaction: any, index: number) => {
								const hasUserReacted = reaction.reactors.some((r: any) => r.uid === user?.uid);
								return (
									<Pressable key={index} onPress={() => handleReactionClick(reaction.id)}>
										<Chip
											mode={hasUserReacted ? 'flat' : 'outlined'}
											compact
											style={{ height: 28 }}
										>
											{reaction.id} {reaction.reactors.length}
										</Chip>
									</Pressable>
								);
							})}
						</View>
					)}
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

			{/* Emoji Picker Dialog */}
			<Portal>
				<Dialog visible={emojiPickerVisible} onDismiss={() => setEmojiPickerVisible(false)}>
					<Dialog.Title>React with Emoji</Dialog.Title>
					<Dialog.Content>
						<View className='flex flex-row flex-wrap gap-2 justify-center'>
							{commonEmojis.map((emoji, index) => (
								<Pressable key={index} onPress={() => handleEmojiSelect(emoji)}>
									<View className='p-3 bg-slate-100 rounded-lg'>
										<Text style={{ fontSize: 32 }}>{emoji}</Text>
									</View>
								</Pressable>
							))}
						</View>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setEmojiPickerVisible(false)}>Cancel</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</>
	)
}
