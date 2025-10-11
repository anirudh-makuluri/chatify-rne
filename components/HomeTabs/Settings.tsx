import React from 'react'
import { View, ScrollView } from 'react-native';
import { Avatar, Button, Text, useTheme, Card, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux';
import { useUser } from '~/app/providers'
import { clearRoomData } from '~/redux/chatSlice';
export default function Settings() {
	const { user, logout } = useUser();
	const dispatch = useDispatch();
	const theme = useTheme();

	function handleLogoutBtnPress() {
		dispatch(clearRoomData());
		logout();
	}

	return (
		<SafeAreaView>
			<View className='flex items-center w-full h-full'>
				{
					user && (
						<View className='flex flex-col items-center gap-4'>
							<Avatar.Image source={{ uri: user.photo_url }}/>
							<Text variant='headlineLarge'>{user.name}</Text>
						</View>
					)
				}
				<Button 
					className='absolute bottom-4' 
					buttonColor={theme.colors.error} 
					onPress={handleLogoutBtnPress} 
					mode='contained'
				>
					Log Out
				</Button>
			</View>
		</SafeAreaView>
	)
}

