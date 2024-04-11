import React from 'react'
import { FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import RoomDisplayItem from '../RoomDisplayItem'
import { useUser } from '~/app/providers'

export default function RoomList() {
	const { user } = useUser();

	return (
		<SafeAreaView>
			<FlatList
				data={user?.rooms}
				renderItem={({ item, index }) => <RoomDisplayItem roomData={item} key={index} />}
			/>
		</SafeAreaView>
	)
}
