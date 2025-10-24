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
import { initializeAuth, GoogleAuthProvider, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, getReactNativePersistence } from "firebase/auth";
import { config } from '~/lib/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customFetch } from '~/lib/utils';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineStorage } from '~/lib/offlineStorage';
import { useTheme } from '~/lib/themeContext';

const app = initializeApp(config.firebaseConfig);
const auth = initializeAuth(app, {
	persistence: getReactNativePersistence(AsyncStorage)
});
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" })


export default function Page() {
	const { user, isLoading, isLoggingOut, login, loginOffline } = useUser();
	const { colors } = useTheme();
	const [isSignIn, setSignIn] = useState(true);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [snackbarMsg, setSnackbarMsg] = useState("");
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [hasOfflineData, setHasOfflineData] = useState(false);

	useEffect(() => {
		GoogleSignin.configure({
			webClientId: '1068380641937-tthsla89okh6stfi2epcjquqfm4b94tl.apps.googleusercontent.com'
		});
	}, []);

	useEffect(() => {
		// Only redirect if user exists, not loading, and not in the process of logging out
		if (user && !isLoading && !isLoggingOut) {
			router.replace('/home');
			return;
		}

		// Check for offline data only if not logging out
		if (!isLoggingOut) {
			checkOfflineData();
		}
	}, [user, isLoading, isLoggingOut]);

	const checkOfflineData = async () => {
		try {
			const offlineUserData = await offlineStorage.getUserData();
			setHasOfflineData(!!offlineUserData);
		} catch (error) {
			console.error('Failed to check offline data:', error);
		}
	};

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

	async function handleOfflineLogin() {
		setIsAuthenticating(true);
		try {
			await loginOffline();
			setSnackbarMsg("Logged in offline with cached data");
		} catch (error) {
			setSnackbarMsg("Failed to login offline");
		} finally {
			setIsAuthenticating(false);
		}
	}



	return (
		<SafeAreaView style={{ backgroundColor: colors.background }}>
			<View style={{ 
				height: '100%', 
				flexDirection: 'column', 
				justifyContent: 'center', 
				alignItems: 'center', 
				gap: 16,
				backgroundColor: colors.background
			}}>
				{isLoggingOut ? (
					<Card style={{ 
						width: '80%', 
						paddingVertical: 40, 
						paddingHorizontal: 24, 
						alignItems: 'center',
						backgroundColor: colors.surface
					}}>
						<ActivityIndicator size="large" color="#16A34A" />
						<Text style={{ 
							fontSize: 16, 
							fontWeight: '500', 
							marginTop: 16, 
							textAlign: 'center',
							color: colors.text
						}}>
							Logging out...
						</Text>
						<Text style={{ 
							fontSize: 12, 
							marginTop: 8, 
							textAlign: 'center',
							color: colors.textSecondary
						}}>
							Please wait while we sign you out
						</Text>
					</Card>
				) : isAuthenticating ? (
					<Card style={{ 
						width: '80%', 
						paddingVertical: 40, 
						paddingHorizontal: 24, 
						alignItems: 'center',
						backgroundColor: colors.surface
					}}>
						<ActivityIndicator size="large" color="#16A34A" />
						<Text style={{ 
							fontSize: 16, 
							fontWeight: '500', 
							marginTop: 16, 
							textAlign: 'center',
							color: colors.text
						}}>
							{isSignIn ? "Signing you in..." : "Creating your account..."}
						</Text>
						<Text style={{ 
							fontSize: 12, 
							marginTop: 8, 
							textAlign: 'center',
							color: colors.textSecondary
						}}>
							Please wait while we authenticate with the server
						</Text>
					</Card>
				) : (
					<>
						{hasOfflineData && (
							<>
								<Button 
									style={{ width: '50%', marginBottom: 16 }} 
									onPress={handleOfflineLogin} 
									mode='outlined'
									disabled={isAuthenticating}
									icon="wifi-off"
								>
									Continue Offline
								</Button>
								<View style={{ 
									flexDirection: 'row', 
									alignItems: 'center', 
									justifyContent: 'center', 
									gap: 8, 
									marginBottom: 16 
								}}>
									<View style={{ 
										backgroundColor: '#3b82f6', 
										height: 1, 
										width: '33%' 
									}}></View>
									<Text style={{ color: colors.textSecondary }}>OR</Text>
									<View style={{ 
										backgroundColor: '#3b82f6', 
										height: 1, 
										width: '33%' 
									}}></View>
								</View>
							</>
						)}
						<Button 
							style={{ width: '50%' }} 
							onPress={authWithGoogle} 
							mode='contained'
							disabled={isAuthenticating}
						>
							{isSignIn ? "Sign In" : "Sign Up"} With Google
						</Button>
						<View style={{ 
							flexDirection: 'row', 
							alignItems: 'center', 
							justifyContent: 'center', 
							gap: 8 
						}}>
							<View style={{ 
								backgroundColor: '#3b82f6', 
								height: 1, 
								width: '33%' 
							}}></View>
							<Text style={{ color: colors.textSecondary }}>OR</Text>
							<View style={{ 
								backgroundColor: '#3b82f6', 
								height: 1, 
								width: '33%' 
							}}></View>
						</View>
						<TextInput
							label="Email"
							value={email}
							mode='outlined'
							style={{ width: '70%' }}
							onChangeText={text => setEmail(text.toLowerCase())}
							disabled={isAuthenticating}
						/>
						<TextInput
							label="Password"
							value={password}
							style={{ width: '70%' }}
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
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<Text style={{ color: colors.text }}>
								{isSignIn ? "Don't have an account?" : "Already have an account?"}
							</Text>
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
