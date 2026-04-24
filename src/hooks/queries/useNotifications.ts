import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, getUnreadNotificationCount, markAllNotificationsAsRead } from '../../api/notifications';

export function useMyNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 60000, // Poll every minute
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
