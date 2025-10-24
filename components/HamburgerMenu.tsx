import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Animated } from 'react-native';
import { Text, IconButton, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '~/app/providers';
import { useTheme } from '~/lib/themeContext';

interface HamburgerMenuProps {
  onHomePress: () => void;
  onFriendsPress: () => void;
  onUserProfilePress: () => void;
  onCreateGroupPress: () => void;
  onLogoutPress: () => void;
}

export default function HamburgerMenu({ onHomePress, onFriendsPress, onUserProfilePress, onCreateGroupPress, onLogoutPress }: HamburgerMenuProps) {
  const { user } = useUser();
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  const openMenu = () => {
    setIsOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const handleHomePress = () => {
    closeMenu();
    onHomePress();
  };

  const handleFriendsPress = () => {
    closeMenu();
    onFriendsPress();
  };

  const handleUserProfilePress = () => {
    closeMenu();
    onUserProfilePress();
  };

  const handleCreateGroupPress = () => {
    closeMenu();
    onCreateGroupPress();
  };

  const handleLogoutPress = () => {
    closeMenu();
    onLogoutPress();
  };


  return (
    <>
      <IconButton
        icon="menu"
        size={24}
        iconColor={colors.text}
        onPress={openMenu}
        style={{ marginLeft: 8 }}
      />
      
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 300,
              backgroundColor: colors.surface,
              transform: [{ translateX: slideAnim }],
            }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Header */}
              <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: colors.text }}>
                    Menu
                  </Text>
                  <IconButton
                    icon="close"
                    size={20}
                    iconColor={colors.textSecondary}
                    onPress={closeMenu}
                  />
                </View>
              </View>

              {/* User Profile Section */}
              {user && (
                <TouchableOpacity 
                  style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  onPress={handleUserProfilePress}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar.Image 
                      size={60} 
                      source={{ uri: user.photo_url }}
                      style={{ marginRight: 16 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={{ fontWeight: '600', color: colors.text }}>
                        {user.name}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 2 }}>
                        {user.email}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Menu Items */}
              <View style={{ flex: 1, paddingTop: 20 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                  }}
                  onPress={handleHomePress}
                >
                  <IconButton
                    icon="home"
                    size={24}
                    iconColor="#3b82f6"
                    style={{ margin: 0, marginRight: 12 }}
                  />
                  <Text variant="titleMedium" style={{ color: colors.text, fontWeight: '500' }}>
                    Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                  }}
                  onPress={handleFriendsPress}
                >
                  <IconButton
                    icon="account-multiple"
                    size={24}
                    iconColor="#3b82f6"
                    style={{ margin: 0, marginRight: 12 }}
                  />
                  <Text variant="titleMedium" style={{ color: colors.text, fontWeight: '500' }}>
                    Friends
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                  }}
                  onPress={handleCreateGroupPress}
                >
                  <IconButton
                    icon="account-group"
                    size={24}
                    iconColor="#3b82f6"
                    style={{ margin: 0, marginRight: 12 }}
                  />
                  <Text variant="titleMedium" style={{ color: colors.text, fontWeight: '500' }}>
                    Create Group
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                  }}
                  onPress={handleLogoutPress}
                >
                  <IconButton
                    icon="logout"
                    size={24}
                    iconColor="#ef4444"
                    style={{ margin: 0, marginRight: 12 }}
                  />
                  <Text variant="titleMedium" style={{ color: '#ef4444', fontWeight: '500' }}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
