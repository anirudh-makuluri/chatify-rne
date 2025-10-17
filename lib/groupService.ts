import { AppThunk } from '../redux/store';
import { createGroup, addMembersToGroup, removeMemberFromGroup, updateGroupInfo, deleteGroup } from './utils';
import { addGroupRoom, updateGroupMembers, updateGroupInfo as updateGroupInfoAction, removeGroupRoom } from '../redux/chatSlice';
import { TAuthUser } from './types';

// Group management service functions
export const createGroupService = (user: TAuthUser, groupData: { name: string; photoUrl?: string; memberUids: string[] }): AppThunk => async (dispatch, getState) => {
	if (!user) return;

	try {
		const response = await createGroup(user.uid, groupData);
		if (response.success) {
			dispatch(addGroupRoom(response.room));
		}
		return response;
	} catch (error) {
		console.error('Create group failed:', error);
		throw error;
	}
};

export const addMembersToGroupService = (user: TAuthUser, roomId: string, memberUids: string[]): AppThunk => async (dispatch, getState) => {
	if (!user) return;

	try {
		const response = await addMembersToGroup(user.uid, roomId, { memberUids });
		if (response.success) {
			// Get current members and add new ones
			const currentRoom = getState().chat.rooms[roomId];
			const updatedMembers = [...(currentRoom?.members || []), ...response.added];
			dispatch(updateGroupMembers({ roomId, members: updatedMembers }));
		}
		return response;
	} catch (error) {
		console.error('Add members failed:', error);
		throw error;
	}
};

export const removeMemberFromGroupService = (user: TAuthUser, roomId: string, memberUid: string): AppThunk => async (dispatch, getState) => {
	if (!user) return;

	try {
		const response = await removeMemberFromGroup(user.uid, roomId, memberUid);
		if (response.success) {
			const currentRoom = getState().chat.rooms[roomId];
			const updatedMembers = (currentRoom?.members || []).filter(uid => uid !== memberUid);
			dispatch(updateGroupMembers({ roomId, members: updatedMembers }));
		}
		return response;
	} catch (error) {
		console.error('Remove member failed:', error);
		throw error;
	}
};

export const updateGroupInfoService = (user: TAuthUser, roomId: string, updateData: { name?: string; photoUrl?: string }): AppThunk => async (dispatch, getState) => {
	if (!user) return;

	try {
		const response = await updateGroupInfo(user.uid, roomId, updateData);
		if (response.success) {
			dispatch(updateGroupInfoAction({ 
				roomId, 
				name: updateData.name, 
				photo_url: updateData.photoUrl 
			}));
		}
		return response;
	} catch (error) {
		console.error('Update group info failed:', error);
		throw error;
	}
};

export const deleteGroupService = (user: TAuthUser, roomId: string): AppThunk => async (dispatch, getState) => {
	if (!user) return;

	try {
		const response = await deleteGroup(user.uid, roomId);
		if (response.success) {
			dispatch(removeGroupRoom(roomId));
		}
		return response;
	} catch (error) {
		console.error('Delete group failed:', error);
		throw error;
	}
};
