export type UserRole = "supervisor" | "artist" | "super_admin";
export type AssignmentStatus =
  | "pending"
  | "in-progress"
  | "submitted"
  | "approved"
  | "revision"
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "REVISION";
export type AssignmentPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";
export type SubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revision"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVISION";
export type UserStatus = "online" | "offline" | "away";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  createdAt: string;
  specialty?: string;
  bio?: string;
  country?: string;
  timezone?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  assignedArtistIds: string[];
  createdBy: string;
  dueDate: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  attachments: Attachment[];
  referenceNotes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  artistId: string;
  files: SubmissionFile[];
  note: string;
  status: SubmissionStatus;
  feedback: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  timestamp: string;
  readStatus: boolean;
  type: "text" | "image" | "file";
}

export interface Conversation {
  id: string;
  artistId: string;
  supervisorId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface Notification {
  id: string;
  userId: string;
  type: "message" | "submission" | "assignment" | "feedback" | string;
  title: string;
  body: string;
  read: boolean;
  isRead?: boolean;
  link: string;
  createdAt: string;
}

export interface DashboardStats {
  totalArtists: number;
  pendingAssignments: number;
  submittedArtworks: number;
  completedJobs: number;
  activeConversations: number;
}
