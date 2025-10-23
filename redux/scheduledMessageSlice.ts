import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from '@reduxjs/toolkit';
import { ScheduledMessage } from "../lib/types";

export interface IScheduledMessageState {
	scheduledMessages: {
		[roomId: string]: ScheduledMessage[];
	};
	isLoading: boolean;
	error: string | null;
}

const initialState: IScheduledMessageState = {
	scheduledMessages: {},
	isLoading: false,
	error: null,
};

export const scheduledMessageSlice = createSlice({
	name: 'scheduledMessages',
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		setScheduledMessages: (state, action: PayloadAction<{ roomId: string; messages: ScheduledMessage[] }>) => {
			const { roomId, messages } = action.payload;
			state.scheduledMessages[roomId] = messages;
		},
		addScheduledMessage: (state, action: PayloadAction<ScheduledMessage>) => {
			const message = action.payload;
			if (!state.scheduledMessages[message.roomId]) {
				state.scheduledMessages[message.roomId] = [];
			}
			state.scheduledMessages[message.roomId].push(message);
		},
		updateScheduledMessage: (state, action: PayloadAction<ScheduledMessage>) => {
			const updatedMessage = action.payload;
			const roomMessages = state.scheduledMessages[updatedMessage.roomId];
			if (roomMessages) {
				const index = roomMessages.findIndex(msg => msg.id === updatedMessage.id);
				if (index !== -1) {
					roomMessages[index] = updatedMessage;
				}
			}
		},
		removeScheduledMessage: (state, action: PayloadAction<{ roomId: string; messageId: string }>) => {
			const { roomId, messageId } = action.payload;
			const roomMessages = state.scheduledMessages[roomId];
			if (roomMessages) {
				state.scheduledMessages[roomId] = roomMessages.filter(msg => msg.id !== messageId);
			}
		},
		clearScheduledMessages: (state, action: PayloadAction<string>) => {
			const roomId = action.payload;
			delete state.scheduledMessages[roomId];
		},
		clearAllScheduledMessages: (state) => {
			state.scheduledMessages = {};
		},
	},
});

export const {
	setLoading,
	setError,
	setScheduledMessages,
	addScheduledMessage,
	updateScheduledMessage,
	removeScheduledMessage,
	clearScheduledMessages,
	clearAllScheduledMessages,
} = scheduledMessageSlice.actions;

export const scheduledMessageReducer = scheduledMessageSlice.reducer;

