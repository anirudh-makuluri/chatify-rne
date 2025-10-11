import React, { useState } from 'react'
import { View, FlatList, ScrollView } from 'react-native'
import { Button, Icon, Modal, Snackbar, Text, TextInput, Portal, Searchbar, IconButton, Card, Avatar, Chip } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TUser } from '~/lib/types';
import { customFetch } from '~/lib/utils';
import FetchedUser from '../FetchedUser';
import { useUser } from '~/app/providers';
import FriendRequest from '../FriendRequest';
import CustomSnackbar from '../CustomSnackbar';

export default function Friends() {
	const { user } = useUser();

	const [searchUser, setSearchUser] = useState<string>("");
	const [fetchedUsers, setFetchedUsers] = useState<TUser[]>([]);
	const [openFetchedUsersModal, setOpenFetchedUsersModal] = useState(false);
	const [snackbarMsg, setSnackbarMsg] = useState("");

	function handleSubmitSearch() {
		if (searchUser.trim().length == 0) return;

		customFetch({
			pathName: 'users/search-user?searchuser=' + searchUser
		}).then(res => {
			if (res.requiredUsers) {
				setFetchedUsers(res.requiredUsers);
				if (res.requiredUsers.length > 0) setOpenFetchedUsersModal(true);
				else setSnackbarMsg("No users found")
			}
		})
	}

	function closeModal() {
		setOpenFetchedUsersModal(false);
	}

	const renderEmptyState = () => (
		<View className="justify-center items-center px-8 py-16">
			<View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
				<Icon source="account-group" size={48} color="#10b981" />
			</View>
			<Text className="text-xl font-bold text-gray-900 text-center mb-2">
				No Friend Requests
			</Text>
			<Text className="text-gray-500 text-center mb-6">
				When someone sends you a friend request, it will appear here
			</Text>
			<View className="bg-green-50 rounded-xl p-4 border border-green-200">
				<Text className="text-green-700 text-center font-medium">
					💡 Use the search bar above to find and add new friends!
				</Text>
			</View>
		</View>
	);

	return (
		<View className="flex-1 bg-gray-50">
			<SafeAreaView className="flex-1">
				{/* Header */}
				<View className="px-4 py-4 bg-white border-b border-gray-200">
					<Text variant="headlineSmall" className="text-gray-900 font-bold mb-4">
						Friends
					</Text>
					
					{/* Search Section */}
					<View className="flex-row items-center gap-3 mb-4">
						<View className="flex-1 bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
							<Searchbar 
								placeholder='Search for a friend' 
								value={searchUser} 
								onChangeText={setSearchUser}
								style={{ backgroundColor: 'transparent', elevation: 0 }}
								placeholderTextColor="#9ca3af"
							/>
						</View>
						<IconButton
							icon="magnify"
							mode='contained'
							size={24}
							iconColor="#fff"
							onPress={handleSubmitSearch}
							style={{ backgroundColor: '#3b82f6' }}
						/>
					</View>

					{/* Stats */}
					<View className="flex-row items-center gap-6">
						<View className="flex-row items-center gap-2">
							<View className="w-2 h-2 bg-green-500 rounded-full"></View>
							<Text className="text-sm text-gray-500">
								{user?.friend_list?.length || 0} friends
							</Text>
						</View>
						<View className="flex-row items-center gap-2">
							<View className="w-2 h-2 bg-blue-500 rounded-full"></View>
							<Text className="text-sm text-gray-500">
								{user?.received_friend_requests?.length || 0} requests
							</Text>
						</View>
					</View>
				</View>

				{/* Friend Requests */}
				{user?.received_friend_requests?.length === 0 ? (
					renderEmptyState()
				) : (
					<View className="flex-1">
						<View className="px-4 py-3 bg-white border-b border-gray-100">
							<Text variant="titleSmall" className="text-gray-700 font-semibold">
								Friend Requests ({user?.received_friend_requests?.length})
							</Text>
						</View>
						<FlatList
							data={user?.received_friend_requests}
							renderItem={({ item, index }) => (
								<FriendRequest
									invitedUser={item}
									key={index}
								/>
							)}
							className=""
							showsVerticalScrollIndicator={false}
						/>
					</View>
				)}

				{/* Search Results Modal */}
				<Portal>
					<Modal
						contentContainerStyle={{ 
							backgroundColor: 'white', 
							padding: 20, 
							margin: 20,
							borderRadius: 16,
							maxHeight: '80%'
						}}
						visible={openFetchedUsersModal}
						onDismiss={closeModal}
					>
						<View className="flex-row items-center justify-between mb-4">
							<View>
								<Text variant='headlineSmall' className="font-bold text-gray-900">
									Search Results
								</Text>
								<Text variant='bodyMedium' className="text-gray-500">
									Found {fetchedUsers.length} users
								</Text>
							</View>
							<IconButton
								icon="close"
								onPress={closeModal}
								iconColor="#6b7280"
							/>
						</View>
						
						<ScrollView showsVerticalScrollIndicator={false}>
							{fetchedUsers.map((user, index) => (
								<FetchedUser 
									closeModal={closeModal} 
									fetchedUser={user} 
									key={index} 
								/>
							))}
						</ScrollView>
					</Modal>
				</Portal>
			</SafeAreaView>
			<CustomSnackbar setSnackbarMsg={setSnackbarMsg} snackbarMsg={snackbarMsg}/>
		</View>
	)
}
