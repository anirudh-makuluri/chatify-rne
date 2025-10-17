import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from '@reduxjs/toolkit'
import io, { Socket } from 'socket.io-client';
import { AppThunk } from "./store";
import { ChatMessage, TAuthUser, TUser, AIResponse, AISummaryResponse, AISentimentResponse, AISmartRepliesResponse, PresenceUpdate } from "../lib/types";
import { globals } from "../globals";
import { sendAIChatRequest, requestConversationSummary, analyzeMessageSentiment, getSmartReplies } from "../lib/utils";

interface SocketState {
	socket: Socket | null
}

const initialState: SocketState = {
	socket: null
}

const socketSlice = createSlice({
	name: 'socket',
	initialState,
	reducers: {
		initSocket: (state, action : PayloadAction<TUser>) => {
			if (state.socket == null) {

				console.log("initing socket");
				const backendUrl = globals.BACKEND_URL;
				const socket = io(backendUrl, {
					transports: ['websocket'],
					// upgrade: false,
					// autoConnect: false,
					query: {
						...action.payload
					},
					closeOnBeforeunload: false
				})

				socket.auth = {
					uid: action.payload.uid,
					name: action.payload.name
				}
				
				return { ...state, socket };
			}
			return state;
		},
		joinSocketRoom: (state, action: PayloadAction<string>) => {
			if (state.socket) {
				state.socket?.emit('join_room', action.payload);
			}
		}
	}
})

export const { initSocket, joinSocketRoom } = socketSlice.actions;
export const socketReducer = socketSlice.reducer

export const initAndJoinSocketRooms = (rooms: string[], user: TUser): AppThunk => dispatch => {
	dispatch(initSocket(user));
	rooms.forEach(roomId => {
		dispatch(joinSocketRoom(roomId));
	});
}

export const sendMessageToServer = (message: ChatMessage): AppThunk => (dispatch, getState) => {
	const { socket } = getState().socket;
	if (socket) {
		// Map chatId to id for backend compatibility
		const backendMessage = {
			id: message.id,
			roomId: message.roomId,
			userUid: message.userUid,
			userName: message.userName,
			userPhoto: message.userPhoto,
			type: message.type,
			chatInfo: message.chatInfo,
			fileName: message.fileName || '',
			isMsgEdited: message.isMsgEdited || false,
			isMsgSaved: message.isMsgSaved || false
		};
		socket.emit('chat_event_client_to_server', backendMessage);
	}
};

export const loadChatHistory = (roomId: string, currentChatDocId?: string): AppThunk => (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	socket.emit('load_chat_doc_from_db', {
		roomId,
		curChatDocId: currentChatDocId
	}, (response: any) => {
		if (response.success && response.chat_history) {
			// Backend sends 'id', which we use directly
			const messages = response.chat_history.map((msg: any) => ({
				...msg,
				id: msg.id
			}));
			const hasMore = messages.length > 0;
			
			// Import the action from chatSlice
			const { addOlderMessages } = require('./chatSlice');
			dispatch(addOlderMessages({ roomId, messages, hasMore }));
		} else {
			// No more messages
			const { addOlderMessages } = require('./chatSlice');
			dispatch(addOlderMessages({ roomId, messages: [], hasMore: false }));
		}
	});
};

export const editMessage = (params: {
	id: string;
	chatDocId: string;
	roomId: string;
	newText: string;
}): AppThunk => (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	console.log('Editing message:', params);

	socket.emit('chat_edit_client_to_server', params, (response: any) => {
		if (response.success) {
			console.log('Message edited successfully:', response);
		} else {
			console.error('Failed to edit message:', response);
		}
	});
};

export const deleteMessage = (params: {
	id: string;
	chatDocId: string;
	roomId: string;
}): AppThunk => (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	socket.emit('chat_delete_client_to_server', params, (response: any) => {
		if (response.success) {
			console.log('Message deleted successfully:', response);
		} else {
			console.error('Failed to delete message:', response);
		}
	});
};

export const addReaction = (params: {
	reactionId: string;
	id: string;
	chatDocId: string;
	roomId: string;
	userUid: string;
	userName: string;
}): AppThunk => (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	socket.emit('chat_reaction_client_to_server', params, (response: any) => {
		if (response.success) {
			console.log('Reaction added/removed successfully:', response);
		} else {
			console.error('Failed to add/remove reaction:', response);
		}
	});
};

// AI Assistant WebSocket actions
export const sendAIChatRequestAction = (message: string, roomId: string): AppThunk => async (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	try {
		const response = await sendAIChatRequest(socket, message, roomId);
		console.log('AI Chat Request successful:', response);
	} catch (error) {
		console.error('AI Chat Request failed:', error);
	}
};

export const requestConversationSummaryAction = (roomId: string): AppThunk => async (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	try {
		const response = await requestConversationSummary(socket, roomId);
		console.log('Conversation Summary:', response);
		return response;
	} catch (error) {
		console.error('Conversation Summary failed:', error);
		throw error;
	}
};

export const analyzeMessageSentimentAction = (message: string): AppThunk => async (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	try {
		const response = await analyzeMessageSentiment(socket, message);
		console.log('Sentiment Analysis:', response);
		return response;
	} catch (error) {
		console.error('Sentiment Analysis failed:', error);
		throw error;
	}
};

export const getSmartRepliesAction = (message: string, roomId?: string): AppThunk => async (dispatch, getState) => {
	const { socket } = getState().socket;
	if (!socket) return;

	try {
		const response = await getSmartReplies(socket, message, roomId);
		console.log('Smart Replies:', response);
		return response;
	} catch (error) {
		console.error('Smart Replies failed:', error);
		throw error;
	}
};