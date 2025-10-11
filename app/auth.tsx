import React, { useEffect, useState } from 'react'
import { LogBox, View } from 'react-native';
import {
	Text,
	Button,
	TextInput,
	Snackbar,
	ActivityIndicator,
	Card
} from 'react-native-paper'
import { useUser } from './providers';
import { router } from 'expo-router'
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential } from "firebase/auth";
import { config } from '~/lib/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customFetch } from '~/lib/utils';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	useEffect(() => {
		GoogleSignin.configure({
			webClientId: '1068380641937-tthsla89okh6stfi2epcjquqfm4b94tl.apps.googleusercontent.com'
		});
	}, []);

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

		setIsAuthenticating(true);
		setSnackbarMsg("");

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

			setSnackbarMsg(errorMessage);
			setIsAuthenticating(false);
		}
	}

	async function authWithGoogle() {
		setIsAuthenticating(true);
		setSnackbarMsg("");

		try {
			await GoogleSignin.hasPlayServices();
			const { idToken } =  await GoogleSignin.signIn();
			const googleCredential = GoogleAuthProvider.credential(idToken);
			const userCredentials = await signInWithCredential(auth, googleCredential);
			const user = userCredentials.user;
			setSession(user);
			await GoogleSignin.revokeAccess();
			await GoogleSignin.signOut();		
			
		} catch (error : any) {
			console.warn('Google Sign-In error:', { code: error.code, message: error.message, native: error });
			setSnackbarMsg("Error occured while trying to authenticate using google");
			setIsAuthenticating(false);
		}
	}

	async function setSession(user: User | null) {
		if (!user) throw "User not found";

		console.log(user);

		const idToken = await user?.getIdToken(true);

		customFetch({
				pathName: 'session',
				method: 'POST',
				body: { idToken }
		}).then(res => {
			auth.signOut();
			login();
		}).catch(error => {
			console.error('Session creation failed:', error);
			setSnackbarMsg("Authentication failed. Please try again.");
			setIsAuthenticating(false);
		})
	}



	return (
		<SafeAreaView>
			<View className='h-full flex flex-col justify-center items-center gap-4'>
				{isAuthenticating ? (
					<Card className='w-[80vw] py-10 px-6 items-center'>
						<ActivityIndicator size="large" color="#16A34A" />
						<Text variant='titleMedium' className='mt-4 text-center'>
							{isSignIn ? "Signing you in..." : "Creating your account..."}
						</Text>
						<Text variant='bodySmall' className='mt-2 text-center text-gray-600'>
							Please wait while we authenticate with the server
						</Text>
					</Card>
				) : (
					<>
						<Button 
							className='w-1/2' 
							onPress={authWithGoogle} 
							mode='contained'
							disabled={isAuthenticating}
						>
							{isSignIn ? "Sign In" : "Sign Up"} With Google
						</Button>
						<View className='flex flex-row items-center justify-center gap-2'>
							<View className='bg-primary h-[1px] w-1/3'></View>
							<Text>OR</Text>
							<View className='bg-primary h-[1px] w-1/3'></View>
						</View>
						<TextInput
							label="Email"
							value={email}
							mode='outlined'
							className='w-[70vw]'
							onChangeText={text => setEmail(text.toLowerCase())}
							disabled={isAuthenticating}
						/>
						<TextInput
							label="Password"
							value={password}
							className='w-[70vw] '
							onChangeText={text => setPassword(text)}
							mode='outlined'
							disabled={isAuthenticating}
						/>
						<Button 
							onPress={authWithEmailAndPassword} 
							mode='contained'
							disabled={isAuthenticating}
						>
							{isSignIn ? "Sign In" : "Sign Up"}
						</Button>
						<View className='flex flex-row items-center'>
							<Text>{isSignIn ? "Don't have an account?" : "Already have an account?"}</Text>
							<Button 
								onPress={() => setSignIn(prevState => !prevState)}
								disabled={isAuthenticating}
							>
								{isSignIn ? "Create account" : "Sign in"}
							</Button>
						</View>
					</>
				)}
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
