import { ChatMessage, ChatDate } from "./types"
import { globals } from "../globals"
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const customFetch = async ({ pathName, method = 'GET', body }: {
	pathName: string,
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
	body?: Object
}): Promise<any> => {
	return new Promise(async (resolve, reject) => {
		const requestObj: RequestInit = {
			method,
			credentials: 'include',
			cache: 'no-store'
		}

	if (method == 'POST' || method == 'PUT' || method == 'PATCH') {
		requestObj.body = JSON.stringify(body);
		requestObj.headers = {
			"Content-Type": "application/json",
		}
	}

		try {
			console.log(`${globals.BACKEND_URL}/${pathName}`);
			const response = await fetch(`${globals.BACKEND_URL}/${pathName}`, requestObj);

			if (!response.ok) {
				return reject(response);
			}

			const data = await response.json();
			resolve(data);

		} catch (error) {
			reject(error)
		}
	})
}

export function genRoomId(uid1: string, uid2: string): string {
	const sortedUids = [uid1, uid2].sort();


	const roomId = sortedUids.join('_');

	return roomId;
}

export function formatChatMessages(messages: (ChatDate | ChatMessage)[]) {
	const formattedMessages: (ChatDate | ChatMessage)[] = [];

	let lastDate: null | string = null;
	messages.forEach((chatEvent, index) => {
		let lastMessage = messages[index - 1];
		if(lastMessage == null) {
			chatEvent.isConsecutiveMessage = false;
		} else {
			if(lastMessage.isDate) lastMessage = messages[index - 2];

			chatEvent.isConsecutiveMessage = false;
			if(chatEvent.userUid == lastMessage.userUid) {
				chatEvent.isConsecutiveMessage = true;
			}
		}

		chatEvent.time = new Date(chatEvent.time?._seconds * 1000);
		
		const day = String(chatEvent.time.getDate()).padStart(2, '0');
		const month = String(chatEvent.time.getMonth() + 1).padStart(2, '0');
		const year = chatEvent.time.getFullYear();

		if (lastDate == null || lastDate != `${day}-${month}-${year}`) {
			lastDate = `${day}-${month}-${year}`;
			if (lastDate) {
				formattedMessages.push({
					time: formatDateForChat(chatEvent.time),
					isDate: true,
				})
			}
		}

		formattedMessages.push(chatEvent);
	})


	return formattedMessages;
}


function formatDateForChat(date: Date) {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	const isToday = date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear();

	const isYesterday = date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear();

	if (isToday) {
		return 'Today';
	} else if (isYesterday) {
		return 'Yesterday';
	} else {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}-${month}-${year}`;
	}
}

export const uploadFile = async (
	userUid: string,
	fileUri: string,
	fileName: string,
	fileType: string
): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		try {
			// Create form data
			const formData = new FormData();
			
			// Generate storage path
			const timestamp = Date.now();
			const storagePath = `chat-files/${userUid}/${timestamp}_${fileName}`;
			
			// Append file
			formData.append('file', {
				uri: fileUri,
				name: fileName,
				type: fileType
			} as any);

			// Upload file
			const response = await fetch(
				`${globals.BACKEND_URL}/users/${userUid}/files?storagePath=${encodeURIComponent(storagePath)}`,
				{
					method: 'POST',
					credentials: 'include',
					body: formData
				}
			);

			if (!response.ok) {
				throw new Error('File upload failed');
			}

			const data = await response.json();
			resolve(data.downloadUrl);
		} catch (error) {
			reject(error);
		}
	});
};

// AI Assistant API functions
export const createAIAssistantRoom = async (userUid: string): Promise<any> => {
	return customFetch({
		pathName: `users/${userUid}/ai-assistant/room`,
		method: 'POST'
	});
};

export const sendAIChatRequest = (socket: any, message: string, roomId: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		if (!socket) {
			reject(new Error('Socket not connected'));
			return;
		}

		socket.emit('ai_chat_request', {
			message,
			roomId
		}, (response: any) => {
			if (response.success) {
				resolve(response);
			} else {
				reject(new Error(response.error || 'AI request failed'));
			}
		});
	});
};

export const requestConversationSummary = (socket: any, roomId: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		if (!socket) {
			reject(new Error('Socket not connected'));
			return;
		}

		socket.emit('ai_summarize_conversation', {
			roomId
		}, (response: any) => {
			if (response.success) {
				resolve(response);
			} else {
				reject(new Error(response.error || 'Summary request failed'));
			}
		});
	});
};

export const analyzeMessageSentiment = (socket: any, message: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		if (!socket) {
			reject(new Error('Socket not connected'));
			return;
		}

		socket.emit('ai_analyze_sentiment', {
			message
		}, (response: any) => {
			if (response.success) {
				resolve(response);
			} else {
				reject(new Error(response.error || 'Sentiment analysis failed'));
			}
		});
	});
};

export const getSmartReplies = (socket: any, message: string, roomId?: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		if (!socket) {
			reject(new Error('Socket not connected'));
			return;
		}

		socket.emit('ai_smart_replies', {
			message,
			roomId
		}, (response: any) => {
			if (response.success) {
				resolve(response);
			} else {
				reject(new Error(response.error || 'Smart replies request failed'));
			}
		});
	});
};