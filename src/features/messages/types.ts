export const THREAD_STATUSES = ["ABERTO", "ENCERRADO"] as const;
export type ThreadStatus = (typeof THREAD_STATUSES)[number];

export const MESSAGES_UPDATED_EVENT = "rco:messages-updated";

export interface MessageThreadSummary {
  id: string;
  subject: string;
  status: ThreadStatus;
  studentId: string;
  studentName: string;
  classroomName: string;
  classroomSubject: string;
  guardianId: string;
  guardianName: string;
  staffId: string | null;
  staffName: string | null;
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface DirectMessageItem {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface ThreadDetailPayload {
  thread: {
    id: string;
    subject: string;
    status: ThreadStatus;
    studentId: string;
    studentName: string;
    classroomName: string;
    classroomSubject: string;
    guardianId: string;
    guardianName: string;
    staffId: string | null;
    staffName: string | null;
    createdAt: string;
    updatedAt: string;
  };
  messages: DirectMessageItem[];
}

export interface ThreadStudentOption {
  studentId: string;
  studentName: string;
  classroomName: string;
  classroomSubject: string;
  guardians: Array<{ id: string; name: string; relationship: string }>;
}
