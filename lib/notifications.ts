import prisma from "./prisma";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId:   params.userId,
      type:     params.type,
      title:    params.title,
      body:     params.body,
      link:     params.link,
      metadata: params.metadata as any,
    },
  });
}

export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  conversationId: string
): Promise<void> {
  await createNotification({
    userId: recipientId,
    type:   "NEW_MESSAGE",
    title:  `New message from ${senderName}`,
    body:   `${senderName} sent you a message`,
    link:   `/messages/${conversationId}`,
    metadata: { senderName, conversationId },
  });
}

export async function notifyNewAssignment(
  artistId: string,
  title: string,
  assignmentId: string
): Promise<void> {
  await createNotification({
    userId: artistId,
    type:   "NEW_ASSIGNMENT",
    title:  "New Assignment",
    body:   `You've been assigned: ${title}`,
    link:   `/artist/assignments/${assignmentId}`,
    metadata: { assignmentId },
  });
}

export async function notifySubmissionUploaded(
  supervisorId: string,
  artistName: string,
  submissionId: string
): Promise<void> {
  await createNotification({
    userId: supervisorId,
    type:   "SUBMISSION_UPLOADED",
    title:  "New Submission",
    body:   `${artistName} submitted artwork for review`,
    link:   `/supervisor/submissions`,
    metadata: { submissionId, artistName },
  });
}

export async function notifySubmissionReviewed(
  artistId: string,
  status: string,
  assignmentTitle: string,
  submissionId: string
): Promise<void> {
  const typeMap: Record<string, NotificationType> = {
    APPROVED: "SUBMISSION_APPROVED",
    REVISION: "SUBMISSION_REVISION",
    REJECTED: "SUBMISSION_REJECTED",
  };
  const labelMap: Record<string, string> = {
    APPROVED: "approved",
    REVISION: "needs revision",
    REJECTED: "rejected",
  };
  await createNotification({
    userId: artistId,
    type:   typeMap[status] ?? "SYSTEM",
    title:  `Submission ${labelMap[status] ?? status}`,
    body:   `Your submission for "${assignmentTitle}" has been ${labelMap[status] ?? status}`,
    link:   `/artist/submissions`,
    metadata: { submissionId },
  });
}
