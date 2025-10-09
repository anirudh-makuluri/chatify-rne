import { ChatDate, ChatMessage, TRoomData } from "../lib/types";
import { formatChatMessages } from "../lib/utils";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from '@reduxjs/toolkit'

export interface IChatState {
	activeChatRoomId: string,
	rooms: {
		[roomId: string]: TRoomData
	}
}

const initialState: IChatState = {
	activeChatRoomId: '',
	rooms: {}
}

export const chatSlice = createSlice({
	name: 'chat',
	initialState,
	reducers: {
		joinChatRoom: (state, action: PayloadAction<TRoomData>) => {
			const roomData = action.payload
			state.rooms[roomData.roomId] = {
				is_group: roomData.is_group,
				messages: formatChatMessages(roomData.messages),
				name: roomData.name,
				photo_url: roomData.photo_url,
				roomId: roomData.roomId,
				currentChatDocId: roomData.messages[0]?.chatDocId,
				hasMoreMessages: true,
				isLoadingMore: false,
			}
		},
		setActiveRoomId: (state, action: PayloadAction<string>) => {
			state.activeChatRoomId = action.payload
		},
	addMessage: (state, action: PayloadAction<ChatMessage>) => {
		const chatMessages = state.rooms[action.payload.roomId].messages;

		// Check for duplicates using id
		if(chatMessages.findIndex(msg => !msg.isDate && msg.id == action.payload.id) != -1) return state;

			let lastMessage = chatMessages[chatMessages.length - 1];

			const newChatDate: ChatDate = {
				time: 'Today',
				isDate: true,
			}

			if (lastMessage == null) {
				action.payload.isConsecutiveMessage = false;
				chatMessages.push(newChatDate);
			} else {
				if (lastMessage.isDate) lastMessage = chatMessages[chatMessages.length - 2];

				action.payload.isConsecutiveMessage = false;
				if (lastMessage.userUid == action.payload.userUid) {
					action.payload.isConsecutiveMessage = true;
				}


				const newMessageDate = new Date(action.payload.time);
				const lastMessageDate = new Date(lastMessage.time);

				const isToday = newMessageDate.getDate() === lastMessageDate.getDate() &&
					newMessageDate.getMonth() === lastMessageDate.getMonth() &&
					newMessageDate.getFullYear() === lastMessageDate.getFullYear();

				if (!isToday) {
					chatMessages.push(newChatDate);
				}
			}

			state.rooms[action.payload.roomId].messages = [...chatMessages, action.payload]
		},
		addChatDoc: (state, action: PayloadAction<{ messages: ChatMessage[], roomId: string }>) => {
			const formattedMessages = formatChatMessages(action.payload.messages);
			const currentMessages = state.rooms[action.payload.roomId].messages

			const curChatDocFirstMsg = currentMessages[1];
			const newChatDocLastMsg = formattedMessages[formattedMessages.length - 1];
			
			const firstMsgDate = new Date(curChatDocFirstMsg.time);
			const lastMsgDate = new Date(newChatDocLastMsg.time);

			const isSameDay = firstMsgDate.getDate() === lastMsgDate.getDate() &&
			firstMsgDate.getMonth() === lastMsgDate.getMonth() &&
			firstMsgDate.getFullYear() === lastMsgDate.getFullYear();

			if(isSameDay) {
				currentMessages.shift();
			}

			state.rooms[action.payload.roomId].messages = [...formattedMessages, ...currentMessages];
		},
		setLoadingMore: (state, action: PayloadAction<{ roomId: string, isLoading: boolean }>) => {
			if (state.rooms[action.payload.roomId]) {
				state.rooms[action.payload.roomId].isLoadingMore = action.payload.isLoading;
			}
		},
		addOlderMessages: (state, action: PayloadAction<{ roomId: string, messages: ChatMessage[], hasMore: boolean }>) => {
			const { roomId, messages, hasMore } = action.payload;
			
			if (!state.rooms[roomId] || messages.length === 0) {
				if (state.rooms[roomId]) {
					state.rooms[roomId].hasMoreMessages = false;
					state.rooms[roomId].isLoadingMore = false;
				}
				return;
			}

			const formattedMessages = formatChatMessages(messages);
			const currentMessages = state.rooms[roomId].messages;

			// Check if first current message and last new message are on same day
			if (currentMessages.length > 0 && formattedMessages.length > 0) {
				const firstCurrentMsg = currentMessages[0]?.isDate ? currentMessages[1] : currentMessages[0];
				const lastNewMsg = formattedMessages[formattedMessages.length - 1];
				
				if (firstCurrentMsg && lastNewMsg && !lastNewMsg.isDate) {
					const firstMsgDate = new Date(firstCurrentMsg.time);
					const lastMsgDate = new Date(lastNewMsg.time);

					const isSameDay = firstMsgDate.getDate() === lastMsgDate.getDate() &&
						firstMsgDate.getMonth() === lastMsgDate.getMonth() &&
						firstMsgDate.getFullYear() === lastMsgDate.getFullYear();

					if (isSameDay && currentMessages[0]?.isDate) {
						currentMessages.shift();
					}
				}
			}

			// Prepend older messages
			state.rooms[roomId].messages = [...formattedMessages, ...currentMessages];
			
			// Update pagination state
			if (messages.length > 0) {
				state.rooms[roomId].currentChatDocId = messages[0].chatDocId;
			}
			state.rooms[roomId].hasMoreMessages = hasMore;
			state.rooms[roomId].isLoadingMore = false;
		},
		clearRoomData: (state) => {
			state = initialState;
		},
	editMessageInChat: (state, action: PayloadAction<{ roomId: string; id: string; chatDocId: string; newText: string }>) => {
		const { roomId, id, newText } = action.payload;
		
		if (!state.rooms[roomId]) return;
		
		const messages = state.rooms[roomId].messages;
		// Search by id
		const messageIndex = messages.findIndex(msg => !msg.isDate && String(msg.id) === String(id));
		
		if (messageIndex !== -1 && !messages[messageIndex].isDate) {
			const message = messages[messageIndex];
			if (!message.isDate) {
				message.chatInfo = newText;
				message.isMsgEdited = true;
			}
		}
	},
	deleteMessageFromChat: (state, action: PayloadAction<{ roomId: string; id: string; chatDocId: string }>) => {
		const { roomId, id } = action.payload;
		
		if (!state.rooms[roomId]) return;
		
		const messages = state.rooms[roomId].messages;
		// Search by id
		const messageIndex = messages.findIndex(msg => !msg.isDate && String(msg.id) === String(id));
		
		if (messageIndex !== -1) {
			// Remove the message
			messages.splice(messageIndex, 1);
			
			// Check if we need to remove orphaned date separator
			if (messageIndex > 0 && messages[messageIndex - 1]?.isDate) {
				// If the next message is also a date or doesn't exist, remove the date separator
				if (!messages[messageIndex] || messages[messageIndex]?.isDate) {
					messages.splice(messageIndex - 1, 1);
				}
			}
		}
	}
	}
})

export const { setActiveRoomId, addMessage, joinChatRoom, clearRoomData, addChatDoc, setLoadingMore, addOlderMessages, editMessageInChat, deleteMessageFromChat } = chatSlice.actions
export const chatReducer = chatSlice.reducer