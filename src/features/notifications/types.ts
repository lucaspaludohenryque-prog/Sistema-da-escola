export const NOTIFICATION_TYPES = ["FALTA", "OCORRENCIA", "COMUNICADO"] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationItem {
  id: string;
  recipientId: string;
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceKey: string | null;
  readAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    registration: string;
    classroom: {
      id: string;
      name: string;
      subject: string;
    };
  };
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unacknowledgedCount: number;
}
