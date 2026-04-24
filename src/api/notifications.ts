import apiClient from "./axios";

export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function getMyNotifications(): Promise<NotificationDto[]> {
  const response = await apiClient.get<NotificationDto[]>("/api/v1/notifications");
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiClient.get<number>("/api/v1/notifications/unread-count");
  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put("/api/v1/notifications/mark-all-read");
}
