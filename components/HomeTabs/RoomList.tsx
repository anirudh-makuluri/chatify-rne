import React, { useState, useMemo } from 'react'
import { FlatList, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Icon, Searchbar, IconButton } from 'react-native-paper'
import RoomDisplayItem from '../RoomDisplayItem'
import { useUser } from '~/app/providers'

export default function RoomList() {
	const { user } = useUser();
	const [searchQuery, setSearchQuery] = useState('');

	const filteredRooms = useMemo(() => {
		if (!user?.rooms) return [];
		if (!searchQuery.trim()) return user.rooms;
		
		return user.rooms.filter(room => 
			room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			room.messages.some(msg => 
				!msg.isDate && 
				msg.type === 'text' && 
				msg.chatInfo && 
				msg.chatInfo.toLowerCase().includes(searchQuery.toLowerCase())
			)
		);
	}, [user?.rooms, searchQuery]);

	const renderEmptyState = () => (
		<View className="justify-center items-center px-8 py-16 mt-10">
			<View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
				<Icon source="chat" size={48} color="#3b82f6" />
			</View>
			<Text className="text-xl font-bold text-center mb-2">
				No Chats Yet
			</Text>
			<Text className="text-gray-500 text-center mb-6">
				Start a conversation by adding friends or creating a group chat
			</Text>
			<View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
				<Text className="text-blue-700 text-center font-medium">
					💡 Go to Friends tab to add new friends and start chatting!
				</Text>
			</View>
		</View>
	);

	return (
		<SafeAreaView className="flex-1 bg-gray-50">
			<View className="px-4 py-4 bg-white border-b border-gray-200">
				<View className="flex-row items-center justify-between mb-4">
					<Text className="text-2xl font-bold text-gray-900">
						Chats
					</Text>
				</View>
				
				<View className="flex-row items-center gap-3 mb-2">
					<View className="flex-1 bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
						<Searchbar 
							placeholder="Search conversations..." 
							value={searchQuery} 
							onChangeText={setSearchQuery}
							style={{ backgroundColor: 'transparent', elevation: 0 }}
							placeholderTextColor="#9ca3af"
						/>
					</View>
					{searchQuery.length > 0 && (
						<IconButton
							icon="close"
							size={20}
							iconColor="#6b7280"
							onPress={() => setSearchQuery('')}
							style={{ backgroundColor: '#f3f4f6' }}
						/>
					)}
				</View>
				
				<Text className="text-gray-500">
					{searchQuery ? `${filteredRooms.length} results` : `${user?.rooms?.length || 0} conversations`}
				</Text>
			</View>
			
			{(() => {
				const roomsToShow = searchQuery.length > 0 ? filteredRooms : (user?.rooms || []);
				
				// Debug: Show test room if no rooms
				if (roomsToShow.length === 0 && !searchQuery) {
					console.log('No rooms found, showing empty state');
					return renderEmptyState();
				}
				
				if (roomsToShow.length === 0 && searchQuery) {
					return (
						<View className="flex-1 justify-center items-center px-8 py-16">
							<View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
								<Icon source="magnify" size={40} color="#9ca3af" />
							</View>
							<Text className="text-lg font-semibold text-gray-600 text-center mb-2">
								No Results Found
							</Text>
							<Text className="text-gray-500 text-center">
								Try searching with different keywords
							</Text>
						</View>
					);
				}
				
				return (
					<FlatList
						data={roomsToShow}
						renderItem={({ item, index }) => <RoomDisplayItem roomData={item} key={index} />}
						className=""
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingVertical: 8 }}
						keyExtractor={(item, index) => item.roomId || index.toString()}
					/>
				);
			})()}
		</SafeAreaView>
	)
}
