import React, { useState } from 'react'
import { View, ScrollView, Alert } from 'react-native';
import { Avatar, Button, Text, useTheme, Card, IconButton, TextInput, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser } from '~/app/providers'
import { useAppSelector } from '~/redux/store';
import { updateUserName, updateUserProfilePicture, uploadProfilePicture } from '~/lib/utils';
import * as ImagePicker from 'expo-image-picker';
export default function Settings() {
	const { user, updateUser } = useUser();
	const theme = useTheme();
	const socket = useAppSelector(state => state.socket.socket);

	const [isEditingName, setIsEditingName] = useState(false);
	const [newName, setNewName] = useState(user?.name || '');
	const [isUploading, setIsUploading] = useState(false);

	const handleNameUpdate = async () => {
		if (!user || !socket || newName.trim() === '') return;

		try {
			await updateUserName(socket, user.uid, newName.trim());
			updateUser({ name: newName.trim() });
			setIsEditingName(false);
			Alert.alert('Success', 'Name updated successfully');
		} catch (error) {
			Alert.alert('Error', 'Failed to update name');
		}
	};

	const handleImagePicker = async () => {
		if (!user) return;

		try {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission required', 'Please grant photo library access');
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled && result.assets[0]) {
				setIsUploading(true);
				
				// Upload the image
				const downloadUrl = await uploadProfilePicture(user.uid, result.assets[0].uri);
				
				// Update user profile picture
				await updateUserProfilePicture(socket, user.uid, downloadUrl);
				updateUser({ photo_url: downloadUrl });
				
				Alert.alert('Success', 'Profile picture updated successfully');
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to update profile picture');
		} finally {
			setIsUploading(false);
		}
	};


	return (
		<SafeAreaView className="flex-1 bg-gray-50">
			<View className='px-6 py-8'>
				{user && (
					<View className='flex flex-col items-center gap-6 mb-8'>
						<View className="relative">
							<Avatar.Image 
								size={120} 
								source={{ uri: user.photo_url }}
								style={{ borderWidth: 4, borderColor: '#e5e7eb' }}
							/>
							<IconButton
								icon="camera"
								size={20}
								onPress={handleImagePicker}
								disabled={isUploading}
								iconColor='#3b82f6'
								style={{ 
									position: 'absolute', 
									bottom: 0, 
									right: 0,
									backgroundColor: '#fff'
								}}
							/>
							{isUploading && (
								<View className="absolute inset-0 bg-black bg-opacity-50 rounded-full items-center justify-center">
									<ActivityIndicator size="small" color="white" />
								</View>
							)}
						</View>
						
						<View className="items-center">
							{isEditingName ? (
								<View className="flex-row items-center gap-2">
									<TextInput
										value={newName}
										onChangeText={setNewName}
										style={{ width: 200 }}
										mode="outlined"
										placeholder="Enter new name"
									/>
									<IconButton
										icon="check"
										onPress={handleNameUpdate}
										iconColor="#10b981"
									/>
									<IconButton
										icon="close"
										onPress={() => {
											setIsEditingName(false);
											setNewName(user.name);
										}}
										iconColor="#ef4444"
									/>
								</View>
							) : (
								<View className="flex-row items-center gap-2">
									<Text variant='headlineMedium' className="text-gray-900 font-bold">
										{user.name}
									</Text>
									<IconButton
										icon="pencil"
										size={20}
										onPress={() => setIsEditingName(true)}
									/>
								</View>
							)}
							<Text variant='bodyLarge' className="text-gray-500">
								{user.email}
							</Text>
						</View>
					</View>
				)}
			</View>
		</SafeAreaView>
	)
}

