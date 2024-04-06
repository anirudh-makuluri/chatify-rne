import '~/globals.css';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform } from 'react-native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './screens/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import { RootStackParamList } from './types';
import ReduxProvider from './redux/redux-provider';

const LIGHT_THEME: Theme = {
	dark: false,
	colors: NAV_THEME.light,
  };
  const DARK_THEME: Theme = {
	dark: true,
	colors: NAV_THEME.dark,
  };

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
	return (
		<ReduxProvider>
			<NavigationContainer>
				<Stack.Navigator initialRouteName='Auth' screenOptions={{ 
					headerShown: false
				 }}>
					<Stack.Screen name="Auth" component={AuthScreen} />
					<Stack.Screen name="Home" component={HomeScreen} />					
				</Stack.Navigator>
			</NavigationContainer>
		</ReduxProvider>
	);
}
