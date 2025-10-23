import { globals } from '~/globals';
import { 
  CreateScheduledMessageRequest, 
  UpdateScheduledMessageRequest, 
  ScheduledMessageResponse, 
  ScheduledMessagesListResponse 
} from './types';


export class ScheduledMessageAPI {
  /**
   * Create a new scheduled message
   */
  static async createScheduledMessage(
    request: CreateScheduledMessageRequest,
    sessionCookie?: string
  ): Promise<ScheduledMessageResponse> {
    try {
      const response = await fetch(`${globals.BACKEND_URL}/api/scheduled-messages/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionCookie && { 'Cookie': `session=${sessionCookie}` }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating scheduled message:', error);
      return {
        success: false,
        error: 'Failed to create scheduled message',
      };
    }
  }

  /**
   * Get scheduled messages for a user
   */
  static async getScheduledMessages(
    userUid: string,
    roomId?: string,
    sessionCookie?: string
  ): Promise<ScheduledMessagesListResponse> {
    try {
      const url = roomId 
        ? `${globals.BACKEND_URL}/api/scheduled-messages/user/${userUid}?roomId=${roomId}`
        : `${globals.BACKEND_URL}/api/scheduled-messages/user/${userUid}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(sessionCookie && { 'Cookie': `session=${sessionCookie}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting scheduled messages:', error);
      return {
        success: false,
        error: 'Failed to get scheduled messages',
      };
    }
  }

  /**
   * Update a scheduled message
   */
  static async updateScheduledMessage(
    scheduledMessageId: string,
    updates: UpdateScheduledMessageRequest,
    sessionCookie?: string
  ): Promise<ScheduledMessageResponse> {
    try {
      const response = await fetch(`${globals.BACKEND_URL}/api/scheduled-messages/${scheduledMessageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionCookie && { 'Cookie': `session=${sessionCookie}` }),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating scheduled message:', error);
      return {
        success: false,
        error: 'Failed to update scheduled message',
      };
    }
  }

  /**
   * Delete a scheduled message
   */
  static async deleteScheduledMessage(
    scheduledMessageId: string,
    sessionCookie?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${globals.BACKEND_URL}/api/scheduled-messages/${scheduledMessageId}`, {
        method: 'DELETE',
        headers: {
          ...(sessionCookie && { 'Cookie': `session=${sessionCookie}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
      return {
        success: false,
        error: 'Failed to delete scheduled message',
      };
    }
  }

  /**
   * Get scheduled messages for a specific room
   */
  static async getRoomScheduledMessages(
    roomId: string,
    sessionCookie?: string
  ): Promise<ScheduledMessagesListResponse> {
    try {
      const response = await fetch(`${globals.BACKEND_URL}/api/scheduled-messages/room/${roomId}`, {
        method: 'GET',
        headers: {
          ...(sessionCookie && { 'Cookie': `session=${sessionCookie}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting room scheduled messages:', error);
      return {
        success: false,
        error: 'Failed to get room scheduled messages',
      };
    }
  }
}

