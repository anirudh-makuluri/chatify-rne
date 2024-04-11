import React, { useState } from 'react'
import { View, FlatList } from 'react-native'
import { Button, Icon, Modal, Snackbar, Text, TextInput, Portal, Searchbar } from 'react-native-paper'
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

	return (
		<View>
			<SafeAreaView>
				<View className='flex flex-row w-full items-center px-2'>
					<Searchbar style={{ width: '80%' }} placeholder='Search for a friend' value={searchUser} onChangeText={setSearchUser} />
					<Button onPress={handleSubmitSearch} className='flex flex-row items-center justify-center'>
						<Icon size={24} source={'magnify'} />
					</Button>
				</View>
				{
					user?.received_friend_requests?.length == 0 ?
						<View className='w-full flex justify-center items-center h-full'>
							<Text>No Friend Requests Found</Text>
						</View>
						:
						<View>
							<FlatList
								data={user?.received_friend_requests}
								renderItem={({ item, index }) => (
									<FriendRequest
										invitedUser={item}
										key={index}
									/>
								)}
							/>
						</View>
				}
				<Portal>
					<Modal
						contentContainerStyle={{ backgroundColor: 'white', padding: 20 }}
						visible={openFetchedUsersModal}
						onDismiss={closeModal}>
						<Text variant='bodyLarge'>Fetched Users</Text>
						<Text variant='bodyMedium'>We've found the following users according to your search</Text>
						<View className='mt-4'>
							<FlatList
								data={fetchedUsers}
								renderItem={({ item, index }) => <FetchedUser closeModal={closeModal} fetchedUser={item} key={index} />}
							/>
						</View>
					</Modal>
				</Portal>


			</SafeAreaView>
			<CustomSnackbar setSnackbarMsg={setSnackbarMsg} snackbarMsg={snackbarMsg}/>
		</View>
	)
}
