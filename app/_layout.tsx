import { Slot } from "expo-router";
import { Providers } from './providers'

// Import your global CSS file
import "../global.css"

export default function HomeLayout() {
	return (
		<Providers>
			<Slot/>
		</Providers>
	)
}
