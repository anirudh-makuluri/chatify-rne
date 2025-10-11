import React, { useState } from 'react'
import { View, Pressable, ScrollView, Image, Linking } from 'react-native';
import { Avatar, Text, Menu, Portal, Dialog, Button, TextInput, Chip, Card } from 'react-native-paper';
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
	const isAIMessage = message.isAIMessage || message.userUid === 'ai-assistant';

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
						(!message.isConsecutiveMessage && (isGroup || isAIMessage)) && (
							<View className={(isSelf ? 'flex-row-reverse' : "flex-row") + ' flex gap-2 items-center'}>
								<Avatar.Image 
									size={28} 
									source={{ uri: isAIMessage ? 'https://ui-avatars.com/api/?name=AI&background=6366f1&color=ffffff' : message.userPhoto }} 
								/>
								<Text className='text-secondary-foreground'>
									{isAIMessage ? 'Chatify AI' : message.userName}
								</Text>
								{isAIMessage && (
									<Chip icon="robot" compact style={{ height: 20 }}>
										AI
									</Chip>
								)}
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
									isAIMessage
										? (message.isConsecutiveMessage
											? 'bg-purple-100 ml-5 border border-purple-200' :
											'bg-purple-100 ml-5 rounded-tl-none border border-purple-200')
										: (message.isConsecutiveMessage
											? 'bg-slate-200 ml-5' :
											'bg-slate-200 ml-5 rounded-tl-none'))
									+ " py-2 px-4 rounded-md"}>
									
									{/* Image */}
									{message.type === 'image' && (
										<Image 
											source={{ uri: message.chatInfo }}
											style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 4 }}
											resizeMode="cover"
										/>
									)}
									
									{/* File attachment */}
									{message.type === 'file' && (
										<Pressable onPress={() => Linking.openURL(message.chatInfo)}>
											<View className='flex flex-row items-center gap-2 p-2 bg-white/20 rounded'>
												<Avatar.Icon size={36} icon="file-document" />
												<View className='flex-1'>
													<Text className='font-medium'>{message.fileName || 'Document'}</Text>
													<Text className='text-xs opacity-70'>Tap to open</Text>
												</View>
											</View>
										</Pressable>
									)}
									
									{/* Text message */}
									{message.type === 'text' && <Text>{message.chatInfo}</Text>}
									
									<View className='flex flex-row items-center gap-1'>
										<Text className='opacity-65 text-[10px]'>{time}</Text>
										{message.isMsgEdited && <Text className='opacity-65 text-[10px]'>(edited)</Text>}
									</View>
								</View>
							</Pressable>
						}
					>
						<Menu.Item onPress={handleReactPress} title="React" leadingIcon="emoticon-happy-outline" />
						{isSelf && !isAIMessage && <Menu.Item onPress={handleEditPress} title="Edit" leadingIcon="pencil" />}
						{isSelf && !isAIMessage && <Menu.Item onPress={handleDeletePress} title="Delete" leadingIcon="delete" />}
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
