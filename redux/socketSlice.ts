import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from '@reduxjs/toolkit'
import io, { Socket } from 'socket.io-client';
import { AppThunk } from "./store";
import { ChatMessage, TAuthUser, TUser } from "../lib/types";
import { globals } from "../globals";

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
			id: message.chatId,
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
			// Map backend's 'id' to frontend's 'chatId'
			const messages = response.chat_history.map((msg: any) => ({
				...msg,
				chatId: msg.id || msg.chatId
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