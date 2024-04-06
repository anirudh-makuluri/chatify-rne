import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { customFetch } from '../lib/utils';
import { TAuthUser } from '../lib/types';
import ReduxProvider from '../redux/redux-provider';
import { MD3LightTheme as DefaultTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';


type TUserContext = {
	user: TAuthUser | null,
	isLoading: boolean,
	login: Function,
	logout: Function,
	updateUser: Function
}

const UserContext = createContext<TUserContext>({
	user: null,
	isLoading: true,
	login: () => { },
	logout: () => { },
	updateUser: () => { }
});

const theme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: '#16A34A',
		secondary: '#F4F4F5',
	},
};

export function Providers({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<TAuthUser | null>(null);
	const [isLoading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		if (!user) {
			login();
		}
	}, []);

	function login() {
		setLoading(true);
		customFetch({ pathName: 'session' })
			.then((data) => {
				if (data.success) {
					setUser(data.user)
				}
			})
			.catch(error => {
				console.warn('Error fetching user data:', error);
			}).finally(() => {
				setLoading(false);
			})
	}

	function updateUser(newData: Partial<TAuthUser>) {
		if (!user) return;

		const newUserData: TAuthUser = {
			email: newData.email !== undefined ? newData.email : user.email,
			name: newData.name !== undefined ? newData.name : user.name,
			photo_url: newData.photo_url !== undefined ? newData.photo_url : user.photo_url,
			received_friend_requests: newData.received_friend_requests !== undefined ? newData.received_friend_requests : user.received_friend_requests,
			friend_list: newData.friend_list !== undefined ? newData.friend_list : user.friend_list,
			sent_friend_requests: newData.sent_friend_requests !== undefined ? newData.sent_friend_requests : user.sent_friend_requests,
			uid: newData.uid !== undefined ? newData.uid : user.uid,
			rooms: newData.rooms !== undefined ? newData.rooms : user.rooms,
		};

		setUser(newUserData);
	}

	function logout() {
		customFetch({
			pathName: 'session',
			method: 'DELETE'
		}).then(res => {
			setUser(null);
			//TODO: Go to auth screen
		})
	}

	return (
		<SafeAreaProvider>
			<UserContext.Provider value={{ user, login, logout, isLoading, updateUser }}>
				<ReduxProvider>
					<PaperProvider theme={theme}>
						{children}
					</PaperProvider>
				</ReduxProvider>
			</UserContext.Provider>
		</SafeAreaProvider>
	)

}


export function useUser() {
	return useContext(UserContext);
}