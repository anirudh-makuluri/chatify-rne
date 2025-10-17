import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { 
	Button, 
	Text, 
	TextInput, 
	Modal, 
	Portal, 
	Card, 
	Avatar, 
	IconButton, 
	Chip, 
	ActivityIndicator,
	Searchbar,
	Icon
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TUser } from '~/lib/types';
import { useUser } from '~/app/providers';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import { createGroupService, addMembersToGroupService, removeMemberFromGroupService, updateGroupInfoService, deleteGroupService } from '~/lib/groupService';
import { updateGroupMembers, updateGroupInfo, removeGroupRoom, setActiveRoomId } from '~/redux/chatSlice';
import { router } from 'expo-router';

interface GroupChatProps {
	roomId?: string;
	onClose: () => void;
}

export default function GroupChat({ roomId, onClose }: GroupChatProps) {
	const { user, updateUser } = useUser();
	const dispatch = useAppDispatch();
	const activeRoom = useAppSelector(state => state.chat.rooms[roomId || '']);
	
	const [groupName, setGroupName] = useState(activeRoom?.name || '');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [showMemberSearch, setShowMemberSearch] = useState(false);
	const [searchResults, setSearchResults] = useState<TUser[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	const isEditMode = !!roomId;
	const groupMembers = activeRoom?.members || [];

	// Filter friends for member selection
	const availableFriends = user?.friend_list?.filter(friend => 
		!selectedMembers.includes(friend.uid) && 
		!groupMembers.includes(friend.uid)
	) || [];

	const handleCreateGroup = async () => {
		if (!user) {
			Alert.alert('Error', 'User not found');
			return;
		}

		if (!groupName.trim()) {
			Alert.alert('Error', 'Please enter a group name');
			return;
		}

		if (selectedMembers.length === 0) {
			Alert.alert('Error', 'Please select at least one member');
			return;
		}

		setIsCreating(true);
		try {
		const response = await dispatch(createGroupService(user, {
			name: groupName,
			memberUids: selectedMembers
		})) as any;

			if (response.success) {
				Alert.alert('Success', 'Group created successfully!', [
					{ text: 'OK', onPress: () => {
						onClose();
						dispatch(setActiveRoomId(response.roomId));
						router.push('/room');
					}}
				]);
			} else {
				Alert.alert('Error', 'Failed to create group');
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to create group');
		} finally {
			setIsCreating(false);
		}
	};

	const handleUpdateGroup = async () => {
		if (!user) {
			Alert.alert('Error', 'User not found');
			return;
		}

		if (!roomId || !groupName.trim()) {
			Alert.alert('Error', 'Please enter a group name');
			return;
		}

		setIsUpdating(true);
		try {
			const response = await dispatch(updateGroupInfoService(user, roomId, {
				name: groupName
			})) as any;

			if (response.success) {
				Alert.alert('Success', 'Group updated successfully!');
			} else {
				Alert.alert('Error', 'Failed to update group');
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to update group');
		} finally {
			setIsUpdating(false);
		}
	};

	const handleAddMembers = async () => {
		if (!user) {
			Alert.alert('Error', 'User not found');
			return;
		}

		if (!roomId || selectedMembers.length === 0) return;

		try {
			const response = await dispatch(addMembersToGroupService(user, roomId, selectedMembers)) as any;
			if (response.success) {
				Alert.alert('Success', 'Members added successfully!');
				setSelectedMembers([]);
				setShowMemberSearch(false);
			} else {
				Alert.alert('Error', 'Failed to add members');
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to add members');
		}
	};

	const handleRemoveMember = async (memberUid: string) => {
		if (!user) {
			Alert.alert('Error', 'User not found');
			return;
		}

		if (!roomId) return;

		Alert.alert(
			'Remove Member',
			'Are you sure you want to remove this member from the group?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						try {
							const response = await dispatch(removeMemberFromGroupService(user, roomId, memberUid)) as any;
							if (response.success) {
								Alert.alert('Success', 'Member removed successfully!');
							} else {
								Alert.alert('Error', 'Failed to remove member');
							}
						} catch (error) {
							Alert.alert('Error', 'Failed to remove member');
						}
					}
				}
			]
		);
	};

	const handleDeleteGroup = async () => {
		if (!user) {
			Alert.alert('Error', 'User not found');
			return;
		}

		if (!roomId) return;

		Alert.alert(
			'Delete Group',
			'Are you sure you want to delete this group? This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							router.back();
							const response = await dispatch(deleteGroupService(user, roomId)) as any;
							if (response.success) {
								// Update user context to remove the room immediately
								try {
									if (user && Array.isArray(user.rooms)) {
										const nextRooms = user.rooms.filter(r => r.roomId !== roomId);
										updateUser({ rooms: nextRooms });
									}
								} catch {}
								Alert.alert('Success', 'Group deleted successfully!', [
									{ text: 'OK', onPress: () => {
										onClose();
									}}
								]);
							} else {
								Alert.alert('Error', 'Failed to delete group');
							}
						} catch (error) {
							Alert.alert('Error', 'Failed to delete group');
						}
					}
				}
			]
		);
	};

	const searchUsers = async () => {
		if (!searchQuery.trim()) return;

		setIsSearching(true);
		try {
			// This would typically call your search API
			// For now, we'll use the friend list
			const results = user?.friend_list?.filter(friend => 
				friend.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!selectedMembers.includes(friend.uid) &&
				!groupMembers.includes(friend.uid)
			) || [];
			setSearchResults(results);
		} catch (error) {
			Alert.alert('Error', 'Failed to search users');
		} finally {
			setIsSearching(false);
		}
	};

	const toggleMemberSelection = (uid: string) => {
		setSelectedMembers(prev => 
			prev.includes(uid) 
				? prev.filter(id => id !== uid)
				: [...prev, uid]
		);
	};

	const getMemberName = (uid: string) => {
		const friend = user?.friend_list?.find(f => f.uid == uid);
		return friend?.name || 'Unknown User';
	};

	const getMemberPhoto = (uid: string) => {
		const friend = user?.friend_list?.find(f => f.uid == uid);
		return friend?.photo_url || '';
	};

	return (
		<Portal>
			<Modal
				visible={true}
				onDismiss={onClose}
				contentContainerStyle={{
					backgroundColor: 'white',
					margin: 20,
					borderRadius: 16,
					maxHeight: '90%',
					flex: 1
				}}
			>
				<SafeAreaView style={{ flex: 1 }}>
					<View className="flex-row items-center justify-between p-4 border-b border-gray-200">
						<Text variant="headlineSmall" className="font-bold">
							{isEditMode ? 'Edit Group' : 'Create Group'}
						</Text>
						<IconButton
							icon="close"
							onPress={onClose}
							iconColor="#6b7280"
						/>
					</View>

					<ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
						{/* Group Name */}
						<View className="mb-6">
							<Text variant="titleMedium" className="mb-2 font-semibold">
								Group Name
							</Text>
							<TextInput
								value={groupName}
								onChangeText={setGroupName}
								placeholder="Enter group name"
								mode="outlined"
								disabled={isCreating || isUpdating}
							/>
						</View>

						{/* Group Members (Edit Mode) */}
						{isEditMode && (
							<View className="mb-6">
								<View className="flex-row items-center justify-between mb-3">
									<Text variant="titleMedium" className="font-semibold">
										Group Members ({groupMembers.length})
									</Text>
									<Button
										mode="outlined"
										onPress={() => setShowMemberSearch(true)}
										icon="account-plus"
										compact
									>
										Add
									</Button>
								</View>

								<View className="flex-row flex-wrap gap-2">
									{groupMembers.map(uid => (
										<Card key={uid} className="p-2 mb-2">
											<View className="flex-row items-center gap-2">
												<Avatar.Image 
													size={32} 
													source={{ uri: getMemberPhoto(uid) }} 
												/>
												<Text className="flex-1">{getMemberName(uid)}</Text>
												<IconButton
													icon="close"
													size={16}
													onPress={() => handleRemoveMember(uid)}
													iconColor="#ef4444"
												/>
											</View>
										</Card>
									))}
								</View>
							</View>
						)}

						{/* Selected Members (Create Mode) */}
						{!isEditMode && (
							<View className="mb-6">
								<View className="flex-row items-center justify-between mb-3">
									<Text variant="titleMedium" className="font-semibold">
										Selected Members ({selectedMembers.length})
									</Text>
									<Button
										mode="outlined"
										onPress={() => setShowMemberSearch(true)}
										icon="account-plus"
										compact
									>
										Add
									</Button>
								</View>

								<View className="flex-row flex-wrap gap-2">
									{selectedMembers.map(uid => (
										<Chip
											key={uid}
											onClose={() => toggleMemberSelection(uid)}
											avatar={<Avatar.Image size={24} source={{ uri: getMemberPhoto(uid) }} />}
										>
											{getMemberName(uid)}
										</Chip>
									))}
								</View>
							</View>
						)}

						{/* Action Buttons */}
						<View className="gap-3">
							{isEditMode ? (
								<>
									<Button
										mode="contained"
										onPress={handleUpdateGroup}
										loading={isUpdating}
										disabled={isUpdating}
									>
										Update Group
									</Button>
									<Button
										mode="outlined"
										onPress={handleDeleteGroup}
										buttonColor="#fef2f2"
										textColor="#dc2626"
									>
										Delete Group
									</Button>
								</>
							) : (
								<Button
									mode="contained"
									onPress={handleCreateGroup}
									loading={isCreating}
									disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
								>
									Create Group
								</Button>
							)}
						</View>
					</ScrollView>
				</SafeAreaView>

				{/* Member Search Modal */}
				<Portal>
					<Modal
						visible={showMemberSearch}
						onDismiss={() => setShowMemberSearch(false)}
						contentContainerStyle={{
							backgroundColor: 'white',
							margin: 20,
							borderRadius: 16,
							maxHeight: '80%'
						}}
					>
						<View className="p-4">
							<View className="flex-row items-center justify-between mb-4">
								<Text variant="headlineSmall" className="font-bold">
									Add Members
								</Text>
								<IconButton
									icon="close"
									onPress={() => setShowMemberSearch(false)}
									iconColor="#6b7280"
								/>
							</View>

							<Searchbar
								placeholder="Search friends..."
								value={searchQuery}
								onChangeText={setSearchQuery}
								onSubmitEditing={searchUsers}
								className="mb-4"
							/>

							<ScrollView showsVerticalScrollIndicator={false}>
								{availableFriends.map(friend => (
									<Card
										key={friend.uid}
										className="mb-2"
										onPress={() => toggleMemberSelection(friend.uid)}
									>
										<View className="flex-row items-center p-3">
											<Avatar.Image 
												size={40} 
												source={{ uri: friend.photo_url }} 
											/>
											<View className="flex-1 ml-3">
												<Text variant="titleMedium">{friend.name}</Text>
												<Text variant="bodySmall" className="text-gray-500">
													{friend.email}
												</Text>
											</View>
											{selectedMembers.includes(friend.uid) && (
												<Icon source="check" size={24} color="#10b981" />
											)}
										</View>
									</Card>
								))}
							</ScrollView>

							<View className="flex-row gap-3 mt-4">
								<Button
									mode="outlined"
									onPress={() => setShowMemberSearch(false)}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									mode="contained"
									onPress={isEditMode ? handleAddMembers : () => setShowMemberSearch(false)}
									disabled={selectedMembers.length === 0}
									className="flex-1"
								>
									{isEditMode ? 'Add Members' : 'Done'}
								</Button>
							</View>
						</View>
					</Modal>
				</Portal>
			</Modal>
		</Portal>
	);
}
