import React, { useState } from 'react';
import { View, Alert, Platform } from 'react-native';
import { 
  Dialog, 
  Portal, 
  Text, 
  TextInput, 
  Button, 
  Card, 
  RadioButton, 
  Chip,
  IconButton,
  useTheme
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import { scheduleMessage } from '~/redux/socketSlice';
import { CreateScheduledMessageRequest } from '~/lib/types';
import { useUser } from '~/app/providers';

interface ScheduleMessageDialogProps {
  visible: boolean;
  onDismiss: () => void;
  roomId: string;
  initialMessage?: string;
}

export default function ScheduleMessageDialog({ 
  visible, 
  onDismiss, 
  roomId, 
  initialMessage = '' 
}: ScheduleMessageDialogProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { user } = useUser();
  
  const [message, setMessage] = useState(initialMessage);
  const [scheduledDateTime, setScheduledDateTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // Default to 1 hour from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    const now = new Date();
    if (scheduledDateTime <= now) {
      Alert.alert('Error', 'Scheduled time must be in the future');
      return;
    }

    try {
      setIsLoading(true);

      const request: CreateScheduledMessageRequest = {
        roomId,
        userUid: user.uid,
        message: message.trim(),
        messageType: 'text',
        scheduledTime: scheduledDateTime.toISOString(),
        recurring: isRecurring,
        recurringPattern: isRecurring ? recurringPattern : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      dispatch(scheduleMessage(request));
      
      Alert.alert('Success', 'Message scheduled successfully!');
      handleClose();
    } catch (error) {
      console.error('Error scheduling message:', error);
      Alert.alert('Error', 'Failed to schedule message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setScheduledDateTime(new Date(Date.now() + 60 * 60 * 1000));
    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsRecurring(false);
    setRecurringPattern('daily');
    onDismiss();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newDateTime = new Date(scheduledDateTime);
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      setScheduledDateTime(newDateTime);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newDateTime = new Date(scheduledDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setScheduledDateTime(newDateTime);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose} style={{ maxHeight: '80%' }}>
        <Dialog.Title>Schedule Message</Dialog.Title>
        <Dialog.ScrollArea>
          <View style={{ padding: 20, gap: 16 }}>
            {/* Message Input */}
            <TextInput
              label="Message"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              placeholder="Enter your message..."
            />

            {/* Date and Time Selection */}
            <View style={{ gap: 12 }}>
              <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                Scheduled Date & Time
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    icon="calendar"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {scheduledDateTime.toLocaleDateString()}
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowTimePicker(true)}
                    icon="clock"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {scheduledDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Button>
                </View>
              </View>
            </View>

            {/* Recurring Options */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <RadioButton
                  value="recurring"
                  status={isRecurring ? 'checked' : 'unchecked'}
                  onPress={() => setIsRecurring(!isRecurring)}
                />
                <Text variant="bodyLarge" style={{ marginLeft: 8 }}>
                  Recurring Message
                </Text>
              </View>

              {isRecurring && (
                <View style={{ marginLeft: 24, gap: 8 }}>
                  <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                    Repeat every:
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {['daily', 'weekly', 'monthly'].map((pattern) => (
                      <Chip
                        key={pattern}
                        selected={recurringPattern === pattern}
                        onPress={() => setRecurringPattern(pattern as any)}
                        style={{ marginBottom: 4 }}
                      >
                        {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </Card>

            {/* Preview */}
            <Card style={{ padding: 16, backgroundColor: theme.colors.surfaceVariant }}>
              <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                Preview:
              </Text>
              <Text variant="bodySmall" style={{ marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>Message:</Text> {message || 'No message'}
              </Text>
              <Text variant="bodySmall" style={{ marginBottom: 4 }}>
                <Text style={{ fontWeight: 'bold' }}>Scheduled for:</Text> {formatDateTime(scheduledDateTime)}
              </Text>
              {isRecurring && (
                <Text variant="bodySmall">
                  <Text style={{ fontWeight: 'bold' }}>Recurring:</Text> {recurringPattern}
                </Text>
              )}
            </Card>
          </View>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSchedule}
            loading={isLoading}
            disabled={!message.trim()}
          >
            Schedule
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={scheduledDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={scheduledDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </Portal>
  );
}

