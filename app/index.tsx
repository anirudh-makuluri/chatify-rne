import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
	Text,
	Button,
	useTheme,
} from 'react-native-paper';
import { useUser } from './providers';
import { router, SplashScreen } from 'expo-router';


SplashScreen.preventAutoHideAsync();

export default function Index() {
	const { user, isLoading } = useUser();

	useEffect(() => {
		if(isLoading) return;

		if (user) {
			router.replace('/home')
		} else {
			router.replace('/auth')
		}

		SplashScreen.hideAsync();

	}, [user, isLoading]);
	
	function navigateToNextPage() {
		if (user) {
			console.log("home")
		} else {
			router.push('/auth')
		}
	}

	if(isLoading) return null;

	

	return (
		<View className='flex items-center justify-center min-h-screen flex-col gap-6 bg-gradient-to-r from-blue-500 to-purple-500'>
			<Text variant='headlineLarge'>Welcome to Chatify!</Text>
			<Text variant='bodyMedium'>Connect, collaborate, and chat effortlessly with Chatify.</Text>
			<Button onPress={navigateToNextPage} mode='contained'>
				<Text>Welcome</Text>
			</Button>
		</View>
	)
}
