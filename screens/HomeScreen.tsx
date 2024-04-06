import React from 'react'
import { View, Text, Button } from 'react-native'
import { HomeScreenProps } from '../types'
import { useAppDispatch, useAppSelector } from '../redux/store';

export default function Home({ navigation } : HomeScreenProps) {


	function navToAuthScreen() {
		navigation.navigate('Auth');
	}

	return (
		<View>
			<Text>Home Screen </Text>
			<Button title='Move' onPress={navToAuthScreen}/>
		</View>
	)
}
