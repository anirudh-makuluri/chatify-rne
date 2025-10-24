import React, { useState } from 'react'
import { View, Pressable, ScrollView, Image, Linking } from 'react-native';
import { Avatar, Text, Menu, Portal, Dialog, Button, TextInput, Chip, Card } from 'react-native-paper';
import { useUser } from '~/app/providers';
import { ChatDate, ChatMessage } from '~/lib/types';
import { useAppDispatch } from '~/redux/store';
import { editMessage, deleteMessage, addReaction } from '~/redux/socketSlice';
import { editMessageInChat, deleteMessageFromChat, toggleReaction } from '~/redux/chatSlice';
import { useTheme } from '~/lib/themeContext';

export default function ChatBubble({ message, isGroup, roomId }: { message: ChatMessage | ChatDate, isGroup: boolean, roomId: string }) {
	const user = useUser()?.user;
	const { colors } = useTheme();
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
			<View style={{ 
				flexDirection: 'row', 
				justifyContent: 'center', 
				alignSelf: 'center', 

				top: 0, 
				width: '33%', 
				borderWidth: 1, 
				borderColor: colors.border, 
				borderRadius: 6, 
				marginVertical: 8,
				backgroundColor: colors.surface,
				padding: 8
			}}>
				<Text style={{ color: colors.text }}>{message.time}</Text>
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
			<View style={{ 
				justifyContent: isSelf ? 'flex-end' : 'flex-start', 
				flexDirection: 'row', 
				marginVertical: 8, 
				width: '100%' 
			}}>
				<View style={{ flexDirection: 'column', gap: 4, width: '40%' }}>
					{
						(!message.isConsecutiveMessage && (isGroup || isAIMessage)) && (
							<View style={{ 
								flexDirection: isSelf ? 'row-reverse' : 'row', 
								flex: 1, 
								gap: 8, 
								alignItems: 'center' 
							}}>
								<Avatar.Image 
									size={28} 
									source={{ uri: isAIMessage ? 'https://ui-avatars.com/api/?name=AI&background=6366f1&color=ffffff' : message.userPhoto }} 
								/>
								<Text style={{ color: colors.textSecondary }}>
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
								<View style={{
									backgroundColor: isSelf
										? '#3b82f6' // Primary blue for self messages
										: isAIMessage
											? '#f3f4f6' // Light gray for AI messages
											: colors.surface, // Theme surface for other messages
									marginRight: isSelf ? 20 : 0,
									marginLeft: isSelf ? 0 : 20,
									borderTopRightRadius: isSelf && !message.isConsecutiveMessage ? 0 : 6,
									borderTopLeftRadius: !isSelf && !message.isConsecutiveMessage ? 0 : 6,
									borderRadius: 6,
									paddingVertical: 8,
									paddingHorizontal: 16,
									borderWidth: isAIMessage ? 1 : 0,
									borderColor: isAIMessage ? colors.border : 'transparent'
								}}>
									
									{/* Image */}
									{message.type === 'image' && (
										<Image 
											source={{ uri: message.chatInfo }}
											style={{ 
												width: '100%', 
												maxWidth: 250, 
												height: 200, 
												borderRadius: 8, 
												marginBottom: 4 
											}}
											resizeMode="cover"
										/>
									)}
									
									{/* File attachment */}
									{message.type === 'file' && (
										<Pressable onPress={() => Linking.openURL(message.chatInfo)}>
											<View style={{ 
												flexDirection: 'row', 
												alignItems: 'center', 
												gap: 8, 
												padding: 8, 
												backgroundColor: isSelf ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', 
												borderRadius: 6 
											}}>
												<Avatar.Icon size={36} icon="file-document" />
												<View style={{ flex: 1 }}>
													<Text style={{ 
														fontWeight: '500', 
														color: isSelf ? 'white' : colors.text 
													}}>{message.fileName || 'Document'}</Text>
													<Text style={{ 
														fontSize: 10, 
														opacity: 0.7, 
														color: isSelf ? 'white' : colors.textSecondary 
													}}>Tap to open</Text>
												</View>
											</View>
										</Pressable>
									)}
									
									{/* Text message */}
									{message.type === 'text' && (
										<Text style={{ 
											color: isSelf ? 'white' : colors.text 
										}}>{message.chatInfo}</Text>
									)}
									
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
										<Text style={{ 
											opacity: 0.65, 
											fontSize: 10, 
											color: isSelf ? 'white' : colors.textSecondary 
										}}>{time}</Text>
										{message.isMsgEdited && (
											<Text style={{ 
												opacity: 0.65, 
												fontSize: 10, 
												color: isSelf ? 'white' : colors.textSecondary 
											}}>(edited)</Text>
										)}
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
						<View style={{ 
							flexDirection: 'row', 
							flexWrap: 'wrap', 
							gap: 4, 
							marginTop: 4, 
							marginLeft: 20 
						}}>
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
						<View style={{ 
							flexDirection: 'row', 
							flexWrap: 'wrap', 
							gap: 8, 
							justifyContent: 'center' 
						}}>
							{commonEmojis.map((emoji, index) => (
								<Pressable key={index} onPress={() => handleEmojiSelect(emoji)}>
									<View style={{ 
										padding: 12, 
										backgroundColor: colors.surface, 
										borderRadius: 8 
									}}>
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
