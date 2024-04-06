import React, { useEffect, useState } from 'react'
import { LogBox, View } from 'react-native';
import {
	Text,
	Button,
	TextInput,
	Snackbar
} from 'react-native-paper'
import { useUser } from './providers';
import { router } from 'expo-router'
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { config } from '~/lib/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customFetch } from '~/lib/utils';

const app = initializeApp(config.firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" })

LogBox.ignoreLogs(['You are initializing Firebase Auth for React Native without providing AsyncStorage'])

export default function Page() {
	const { user, isLoading, login } = useUser();
	const [isSignIn, setSignIn] = useState(true);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [snackbarMsg, setSnackbarMsg] = useState("");

	useEffect(() => {
		if (user && !isLoading) {
			router.replace('/home');
			return;
		}

		customFetch({
			pathName: ''
		}).then(res => {
			console.log(res);
		})
	}, [user, isLoading]);

	async function authWithEmailAndPassword() {
		if (email == null || email.trim() == "" || password == null || password.trim() == "") {
			setSnackbarMsg("Email or Password not given");
			return;
		}

		try {
			if (isSignIn) {
				const { user } = await signInWithEmailAndPassword(auth, email, password)
				setSession(user);
			} else {
				const { user } = await createUserWithEmailAndPassword(auth, email, password);
				setSession(user);
			}
		} catch (error: any) {
			const errorCode = error.code;
			let errorMessage = error.message;

			switch (errorCode) {
				case "auth/email-already-in-use":
					errorMessage = "The email address is already in use by another account.";
					break;
				case "auth/invalid-email":
					errorMessage = "The email address is invalid.";
					break;
				case "auth/weak-password":
					errorMessage = "The password is too weak.";
					break;
				case "auth/invalid-credential":
					errorMessage = "Account not found";
					break;
				default:

					break;
			}

			setSnackbarMsg(errorMessage)
		}
	}

	async function authWithGoogle() {
		try {
			const { user } = await signInWithRedirect(auth, provider);
			setSession(user);
		} catch (error) {
			console.warn(error);
			setSnackbarMsg("Error occured while trying to authenticate using google");
		}
	}

	async function setSession(user: User | null) {
		if (!user) throw "User not found";

		console.log(user);

		const idToken = await user?.getIdToken();

		customFetch({
			pathName: 'session',
			method: 'POST',
			body: { idToken }
		}).then(res => {
			auth.signOut();
			login();
		})
	}



	return (
		<SafeAreaView>
			<View className='h-full flex flex-col justify-center items-center gap-4'>
				{/* <Button className='w-1/2' onPress={authWithGoogle} mode='contained'>{isSignIn ? "Sign In" : "Sign Up"} With Google</Button>
				<View className='flex flex-row items-center justify-center gap-2'>
					<View className='bg-primary h-[1px] w-1/3'></View>
					<Text>OR</Text>
					<View className='bg-primary h-[1px] w-1/3'></View>
				</View> */}
				<TextInput
					label="Email"
					value={email}
					mode='outlined'
					className='w-[70vw]'
					onChangeText={text => setEmail(text.toLowerCase())}
				/>
				<TextInput
					label="Password"
					value={password}
					className='w-[70vw] '
					onChangeText={text => setPassword(text)}
					mode='outlined'
				/>
				<Button onPress={authWithEmailAndPassword} mode='contained'>{isSignIn ? "Sign In" : "Sign Up"}</Button>
				<View className='flex flex-row items-center'>
					<Text>{isSignIn ? "Don't have an account?" : "Already have an account?"}</Text>
					<Button onPress={() => setSignIn(prevState => !prevState)}>{isSignIn ? "Create account" : "Sign in"}</Button>
				</View>
				<Snackbar
					visible={snackbarMsg.length > 0}
					duration={5000}
					onDismiss={() => setSnackbarMsg("")}>
					{snackbarMsg}
				</Snackbar>
			</View>
		</SafeAreaView>
	)
}
