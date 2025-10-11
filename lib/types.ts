export type ChatMessage = {
	id: number | string;
	roomId: string;
	chatDocId?: string;
	type: 'text' | 'image' | 'gif' | 'file' | 'audio' | 'video';
	chatInfo: string;
	fileName?: string;
	isMsgEdited?: boolean;
	isMsgSaved?: boolean;
	isAIMessage?: boolean;
	reactions?: Array<{
		id: string;
		reactors: Array<{ uid: string; name: string }>;
	}>;
	userUid: string;
	userName: string;
	userPhoto: string;
	time: any; //TODO: fix
	isUserInfoDisplayed?: boolean;
	isConsecutiveMessage?: boolean;
	isDate?: boolean;
};

export type ChatDate = {
	id?: undefined;
	roomId?: undefined;
	chatDocId?: undefined
	type?: undefined;
	chatInfo?: undefined;
	fileName?: undefined;
	isMsgEdited?: undefined;
	isMsgSaved?: undefined;
	isAIMessage?: undefined;
	userUid?: undefined;
	userName?: undefined;
	userPhoto?: undefined;
	time: string;
	isUserInfoDisplayed?: undefined,
	isConsecutiveMessage?: undefined,
	isDate?: boolean
}

export type TUser = {
	name: string,
	email: string,
	photo_url: string,
	uid: string
}

export type TAuthUser = {
	email: string,
	name: string,
	photo_url: string,
	received_friend_requests: TUser[],
	friend_list: TUser[],
	sent_friend_requests: TUser[],
	uid: string,
	rooms: TRoomData[],
}

export type TRoomData = {
	is_group: boolean;
	roomId: string;
	messages: (ChatMessage | ChatDate)[];
	name: string;
	photo_url: string;
	currentChatDocId?: string;
	hasMoreMessages?: boolean;
	isLoadingMore?: boolean;
	is_ai_room?: boolean;
}

// AI Assistant types
export type AIResponse = {
	success: boolean;
	response?: string;
	messageId?: string;
	error?: string;
}

export type AISummaryResponse = {
	success: boolean;
	summary?: string;
	timestamp?: string;
	error?: string;
}

export type AISentimentResponse = {
	success: boolean;
	sentiment?: 'positive' | 'negative' | 'neutral';
	timestamp?: string;
	error?: string;
}

export type AISmartRepliesResponse = {
	success: boolean;
	replies?: string[];
	timestamp?: string;
	error?: string;
}

export type AIRoomData = {
	success: boolean;
	roomId?: string;
	message?: string;
	room?: TRoomData;
	error?: string;
}