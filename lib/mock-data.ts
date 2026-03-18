import type {
  User,
  Assignment,
  Submission,
  Message,
  Conversation,
  Notification,
} from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "supervisor-1",
    name: "Alex Chen",
    email: "supervisor@rds.com",
    passwordHash: "hashed_password_supervisor",
    role: "supervisor",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=AlexChen&backgroundColor=0f0f0f",
    status: "online",
    createdAt: "2024-01-01T00:00:00Z",
    bio: "Creative Director & Studio Supervisor",
  },
  {
    id: "artist-1",
    name: "Maya Rivera",
    email: "maya@rds.com",
    passwordHash: "hashed_password_maya",
    role: "artist",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=MayaRivera&backgroundColor=0f0f0f",
    status: "online",
    createdAt: "2024-01-10T00:00:00Z",
    specialty: "Character Design",
    bio: "Specialist in character concept art and digital illustration",
  },
  {
    id: "artist-2",
    name: "Jordan Blackwood",
    email: "jordan@rds.com",
    passwordHash: "hashed_password_jordan",
    role: "artist",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=JordanBlackwood&backgroundColor=0f0f0f",
    status: "away",
    createdAt: "2024-01-15T00:00:00Z",
    specialty: "Brand Identity",
    bio: "Expert in logo design and brand identity systems",
  },
  {
    id: "artist-3",
    name: "Sora Kim",
    email: "sora@rds.com",
    passwordHash: "hashed_password_sora",
    role: "artist",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=SoraKim&backgroundColor=0f0f0f",
    status: "offline",
    createdAt: "2024-02-01T00:00:00Z",
    specialty: "Motion Graphics",
    bio: "Motion designer specializing in UI animation and video graphics",
  },
  {
    id: "artist-4",
    name: "Dante Cruz",
    email: "dante@rds.com",
    passwordHash: "hashed_password_dante",
    role: "artist",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=DanteCruz&backgroundColor=0f0f0f",
    status: "online",
    createdAt: "2024-02-10T00:00:00Z",
    specialty: "3D Environments",
    bio: "3D artist focused on environment design and architectural visualization",
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "assign-1",
    title: "Hero Banner Artwork — Q2 Campaign",
    description:
      "Create a high-impact hero banner for our Q2 marketing campaign. The artwork should convey power, precision, and innovation. Dark theme with dynamic lighting effects. Dimensions: 2560×1440px (16:9). Deliver master file + web-optimized exports.",
    assignedArtistIds: ["artist-1"],
    createdBy: "supervisor-1",
    dueDate: "2026-03-25T23:59:00Z",
    priority: "urgent",
    status: "in-progress",
    referenceNotes:
      "Reference boards are in the attachments. Focus on dark environment with neon accents. Look at the Cyberpunk 2077 promo artwork for mood direction. Typography should be minimal — the art should speak for itself.",
    tags: ["banner", "marketing", "Q2", "hero"],
    attachments: [
      { id: "att-1", name: "Q2_Campaign_Brief.pdf", url: "#", type: "pdf" },
      { id: "att-2", name: "Reference_Board.zip", url: "#", type: "zip" },
    ],
    createdAt: "2026-03-10T09:00:00Z",
    updatedAt: "2026-03-15T14:30:00Z",
  },
  {
    id: "assign-2",
    title: "Brand Logo Redesign — Minimal Variant",
    description:
      "Develop a minimal, monochrome version of the studio logo suitable for embossing, embroidery, and single-color print applications. Must retain core brand recognition while stripping all color. Deliver AI, EPS, SVG, and PNG formats.",
    assignedArtistIds: ["artist-2"],
    createdBy: "supervisor-1",
    dueDate: "2026-04-01T23:59:00Z",
    priority: "high",
    status: "pending",
    referenceNotes:
      "Refer to existing brand guidelines PDF. The minimal variant should work at sizes as small as 16×16px. Avoid thin strokes that won't survive embroidery production.",
    tags: ["logo", "branding", "print"],
    attachments: [
      { id: "att-3", name: "Brand_Guidelines_v3.pdf", url: "#", type: "pdf" },
    ],
    createdAt: "2026-03-12T11:00:00Z",
    updatedAt: "2026-03-12T11:00:00Z",
  },
  {
    id: "assign-3",
    title: "UI Motion Pack — Dashboard Transitions",
    description:
      "Design and animate a set of UI micro-interaction animations for the new dashboard product. Required: 8 entry animations, 4 loading states, 3 success states, 2 error states. Deliver as Lottie JSON + After Effects source files.",
    assignedArtistIds: ["artist-3"],
    createdBy: "supervisor-1",
    dueDate: "2026-03-30T23:59:00Z",
    priority: "high",
    status: "submitted",
    referenceNotes:
      "Keep animations under 800ms. Ease curves should feel premium — no linear or bounce easing. Use the provided design tokens for colors.",
    tags: ["motion", "UI", "animation", "Lottie"],
    attachments: [
      { id: "att-4", name: "Design_Tokens.pdf", url: "#", type: "pdf" },
      { id: "att-5", name: "UI_Specs.figma", url: "#", type: "figma" },
    ],
    createdAt: "2026-03-08T10:00:00Z",
    updatedAt: "2026-03-16T16:00:00Z",
  },
  {
    id: "assign-4",
    title: "3D Environment — Server Room Scene",
    description:
      "Model and render a futuristic server room environment for use in product marketing imagery. The scene should feel industrial yet high-tech. Deliver 4K renders from 3 camera angles + the scene file.",
    assignedArtistIds: ["artist-4"],
    createdBy: "supervisor-1",
    dueDate: "2026-04-15T23:59:00Z",
    priority: "medium",
    status: "in-progress",
    referenceNotes:
      "Atmosphere: dark, moody, cinematic. Blue-green ambient lighting with dramatic highlights. Avoid photorealism — stylized realism preferred. Reference: Blade Runner 2049 production design.",
    tags: ["3D", "environment", "render", "marketing"],
    attachments: [
      { id: "att-6", name: "Concept_Sketches.pdf", url: "#", type: "pdf" },
    ],
    createdAt: "2026-03-14T08:00:00Z",
    updatedAt: "2026-03-17T09:00:00Z",
  },
  {
    id: "assign-5",
    title: "Social Media Kit — Product Launch",
    description:
      "Create a complete social media visual kit for the upcoming product launch. Required: 12 Instagram posts, 6 Stories, 4 Twitter/X banners, 2 LinkedIn headers. All assets should feel cohesive and premium.",
    assignedArtistIds: ["artist-1", "artist-2"],
    createdBy: "supervisor-1",
    dueDate: "2026-03-28T23:59:00Z",
    priority: "urgent",
    status: "revision",
    referenceNotes:
      "First submission was good but needs more consistency between the Instagram and Twitter sizes. Resubmit with unified color grading.",
    tags: ["social", "marketing", "launch"],
    attachments: [
      { id: "att-7", name: "Launch_Brief.pdf", url: "#", type: "pdf" },
    ],
    createdAt: "2026-03-05T14:00:00Z",
    updatedAt: "2026-03-16T11:00:00Z",
  },
  {
    id: "assign-6",
    title: "Character Concept — Studio Mascot",
    description:
      "Design the official studio mascot character. Should embody the brand personality: sharp, futuristic, creative, professional. Deliver full character sheet (front, side, back views) + 6 expression variants.",
    assignedArtistIds: ["artist-1"],
    createdBy: "supervisor-1",
    dueDate: "2026-04-30T23:59:00Z",
    priority: "low",
    status: "approved",
    referenceNotes:
      "Approved — excellent work. Proceed to final production files. The mascot will be used across all branded materials.",
    tags: ["character", "mascot", "branding"],
    attachments: [],
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-03-10T15:00:00Z",
  },
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    assignmentId: "assign-3",
    artistId: "artist-3",
    files: [
      {
        id: "f-1",
        name: "UI_Motion_Pack_v1.zip",
        url: "#",
        type: "zip",
        size: 48200000,
      },
      {
        id: "f-2",
        name: "Preview_Animations.mp4",
        url: "#",
        type: "mp4",
        size: 12400000,
      },
    ],
    note: "Completed all 17 animations as specified. I've included a preview video showing each animation in context. The Lottie files are optimized for web — average file size under 20KB. AE source files included with organized layer structure.",
    status: "pending",
    feedback: "",
    submittedAt: "2026-03-16T14:22:00Z",
  },
  {
    id: "sub-2",
    assignmentId: "assign-5",
    artistId: "artist-1",
    files: [
      {
        id: "f-3",
        name: "Social_Kit_v1_Maya.zip",
        url: "#",
        type: "zip",
        size: 89000000,
      },
    ],
    note: "First pass of the social media kit. All sizes completed. Let me know if you need any adjustments to the color palette.",
    status: "revision",
    feedback:
      "Good work on the Instagram posts — the photography treatment is on point. The Twitter/X banners need color grading consistency with the Instagram set. Also, the Stories need 10px more padding on the top to avoid notification bar overlap. Please resubmit.",
    submittedAt: "2026-03-14T11:00:00Z",
    reviewedAt: "2026-03-15T16:30:00Z",
  },
  {
    id: "sub-3",
    assignmentId: "assign-6",
    artistId: "artist-1",
    files: [
      {
        id: "f-4",
        name: "Mascot_Final.ai",
        url: "#",
        type: "ai",
        size: 24000000,
      },
      {
        id: "f-5",
        name: "Mascot_Expressions.pdf",
        url: "#",
        type: "pdf",
        size: 8000000,
      },
      {
        id: "f-6",
        name: "Character_Sheet.png",
        url: "#",
        type: "png",
        size: 15000000,
      },
    ],
    note: "Final character sheet with all 6 expression variants. Also including the transparent PNG exports and the master AI file.",
    status: "approved",
    feedback:
      "Outstanding work, Maya! The character has exactly the right energy. The expression variants are expressive and on-brand. Marking as approved — proceed to production files. Well done.",
    submittedAt: "2026-03-08T09:45:00Z",
    reviewedAt: "2026-03-10T14:00:00Z",
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    artistId: "artist-1",
    supervisorId: "supervisor-1",
    lastMessage: "The hero banner is looking great — can't wait to see it finished!",
    lastMessageTime: "2026-03-17T10:30:00Z",
    unreadCount: 2,
    messages: [
      {
        id: "msg-1",
        senderId: "supervisor-1",
        receiverId: "artist-1",
        content:
          "Hey Maya! I've just assigned the Q2 Hero Banner to you. It's an urgent one for the campaign launch — let me know if you have any questions on the brief.",
        timestamp: "2026-03-10T09:15:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-2",
        senderId: "artist-1",
        receiverId: "supervisor-1",
        content:
          "Got it! I've reviewed the brief and the reference boards. I have a clear direction in mind. Will start with rough thumbnails today.",
        timestamp: "2026-03-10T10:02:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-3",
        senderId: "artist-1",
        receiverId: "supervisor-1",
        content:
          "Quick question — for the lighting, should I go for a more blue-tinted ambient or keep it neutral dark? The reference board has both approaches.",
        timestamp: "2026-03-11T14:30:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-4",
        senderId: "supervisor-1",
        receiverId: "artist-1",
        content:
          "Go with the blue-tinted approach — it aligns better with the product color palette. Maybe 10–15% blue shift, nothing too dramatic.",
        timestamp: "2026-03-11T15:00:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-5",
        senderId: "artist-1",
        receiverId: "supervisor-1",
        content: "Perfect, thanks! Here's the first rough thumbnail for your review.",
        timestamp: "2026-03-13T11:00:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-6",
        senderId: "supervisor-1",
        receiverId: "artist-1",
        content:
          "The hero banner is looking great — can't wait to see it finished! Keep that composition, it's strong.",
        timestamp: "2026-03-17T10:30:00Z",
        readStatus: false,
        type: "text",
      },
    ],
  },
  {
    id: "conv-2",
    artistId: "artist-2",
    supervisorId: "supervisor-1",
    lastMessage: "On it — I'll have concepts to you by Thursday.",
    lastMessageTime: "2026-03-16T17:45:00Z",
    unreadCount: 0,
    messages: [
      {
        id: "msg-7",
        senderId: "supervisor-1",
        receiverId: "artist-2",
        content:
          "Jordan, the logo redesign brief is assigned. Main thing: it needs to work at tiny sizes without losing recognizability. Think icon-first.",
        timestamp: "2026-03-12T11:30:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-8",
        senderId: "artist-2",
        receiverId: "supervisor-1",
        content:
          "Understood. I'll approach this with a geometric simplification strategy — keeping the core symbol but stripping all decorative elements. Should result in something that works even at 16px.",
        timestamp: "2026-03-12T13:00:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-9",
        senderId: "supervisor-1",
        receiverId: "artist-2",
        content: "Great approach. Any initial ideas on direction?",
        timestamp: "2026-03-15T10:00:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-10",
        senderId: "artist-2",
        receiverId: "supervisor-1",
        content:
          "On it — I'll have concepts to you by Thursday. Three directions: geometric mark, letterform, and an abstract symbol.",
        timestamp: "2026-03-16T17:45:00Z",
        readStatus: true,
        type: "text",
      },
    ],
  },
  {
    id: "conv-3",
    artistId: "artist-3",
    supervisorId: "supervisor-1",
    lastMessage: "Submission is up! Let me know what you think.",
    lastMessageTime: "2026-03-16T14:30:00Z",
    unreadCount: 1,
    messages: [
      {
        id: "msg-11",
        senderId: "supervisor-1",
        receiverId: "artist-3",
        content:
          "Sora, the motion pack project is live. Key thing: premium easing. Nothing bouncy or linear. Look at Apple's UIKit transitions for reference on timing.",
        timestamp: "2026-03-08T10:30:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-12",
        senderId: "artist-3",
        receiverId: "supervisor-1",
        content:
          "Got it — Apple-level polish. I'll base the easing on cubic-bezier(0.4, 0, 0.2, 1) with custom variants per interaction type.",
        timestamp: "2026-03-08T11:00:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-13",
        senderId: "artist-3",
        receiverId: "supervisor-1",
        content:
          "Submission is up! Let me know what you think. I'm especially happy with the success state animations — they feel really satisfying.",
        timestamp: "2026-03-16T14:30:00Z",
        readStatus: false,
        type: "text",
      },
    ],
  },
  {
    id: "conv-4",
    artistId: "artist-4",
    supervisorId: "supervisor-1",
    lastMessage: "Starting on the final render passes now.",
    lastMessageTime: "2026-03-17T08:00:00Z",
    unreadCount: 0,
    messages: [
      {
        id: "msg-14",
        senderId: "supervisor-1",
        receiverId: "artist-4",
        content:
          "Dante, your server room scene assignment is live. Blade Runner 2049 is the mood reference — cinematic, stylized, atmospheric.",
        timestamp: "2026-03-14T08:30:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-15",
        senderId: "artist-4",
        receiverId: "supervisor-1",
        content:
          "Perfect reference. I'll focus on the volumetric lighting and practical element mix — server hardware visible but obscured by atmosphere. Sending a grey-box layout for approval before I commit to detail work.",
        timestamp: "2026-03-14T10:00:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-16",
        senderId: "supervisor-1",
        receiverId: "artist-4",
        content:
          "The grey-box looks solid — approved. Go ahead with full detail and lighting.",
        timestamp: "2026-03-16T09:00:00Z",
        readStatus: true,
        type: "text",
      },
      {
        id: "msg-17",
        senderId: "artist-4",
        receiverId: "supervisor-1",
        content: "Starting on the final render passes now. ETA 48 hours for first review.",
        timestamp: "2026-03-17T08:00:00Z",
        readStatus: true,
        type: "text",
      },
    ],
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    userId: "supervisor-1",
    type: "submission",
    title: "New Submission",
    body: "Sora Kim submitted the UI Motion Pack for review.",
    read: false,
    link: "/supervisor/submissions",
    createdAt: "2026-03-16T14:22:00Z",
  },
  {
    id: "notif-2",
    userId: "supervisor-1",
    type: "message",
    title: "New Message from Maya Rivera",
    body: "The hero banner is coming along well...",
    read: false,
    link: "/supervisor/chat/artist-1",
    createdAt: "2026-03-17T10:30:00Z",
  },
  {
    id: "notif-3",
    userId: "supervisor-1",
    type: "message",
    title: "New Message from Sora Kim",
    body: "Submission is up! Let me know what you think.",
    read: false,
    link: "/supervisor/chat/artist-3",
    createdAt: "2026-03-16T14:30:00Z",
  },
  {
    id: "notif-4",
    userId: "artist-1",
    type: "assignment",
    title: "New Assignment",
    body: "Hero Banner Artwork — Q2 Campaign has been assigned to you.",
    read: true,
    link: "/artist/assignments/assign-1",
    createdAt: "2026-03-10T09:00:00Z",
  },
  {
    id: "notif-5",
    userId: "artist-1",
    type: "feedback",
    title: "Revision Requested",
    body: "Alex Chen has requested revisions on Social Media Kit.",
    read: false,
    link: "/artist/submissions",
    createdAt: "2026-03-15T16:30:00Z",
  },
];

// Demo login credentials
export const DEMO_CREDENTIALS = {
  supervisor: { email: "supervisor@rds.com", password: "demo123" },
  artist: { email: "maya@rds.com", password: "demo123" },
};

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

export function getArtists(): User[] {
  return MOCK_USERS.filter((u) => u.role === "artist");
}

export function getAssignmentsForArtist(artistId: string): Assignment[] {
  return MOCK_ASSIGNMENTS.filter((a) => a.assignedArtistIds.includes(artistId));
}

export function getSubmissionsForArtist(artistId: string): Submission[] {
  return MOCK_SUBMISSIONS.filter((s) => s.artistId === artistId);
}

export function getConversationForArtist(artistId: string): Conversation | undefined {
  return MOCK_CONVERSATIONS.find((c) => c.artistId === artistId);
}

export function getNotificationsForUser(userId: string): Notification[] {
  return MOCK_NOTIFICATIONS.filter((n) => n.userId === userId);
}

export function getSupervisorStats() {
  const artists = getArtists();
  const pending = MOCK_ASSIGNMENTS.filter((a) =>
    ["pending", "in-progress"].includes(a.status)
  ).length;
  const submitted = MOCK_SUBMISSIONS.filter((s) => s.status === "pending").length;
  const completed = MOCK_ASSIGNMENTS.filter((a) => a.status === "approved").length;
  return {
    totalArtists: artists.length,
    pendingAssignments: pending,
    submittedArtworks: submitted,
    completedJobs: completed,
    activeConversations: MOCK_CONVERSATIONS.filter((c) => c.unreadCount > 0).length,
  };
}
