import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: () => subscriptionService.getNotifications(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => subscriptionService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    ...query,
    notifications,
    unreadCount,
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};
