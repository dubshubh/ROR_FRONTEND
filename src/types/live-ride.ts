export type ParticipantRole = "lead" | "marshal" | "sweeper" | "rider" | "pillion";
export type ParticipantStatus = "active" | "paused" | "ejected" | "left";
export type LiveRideStatus = "active" | "paused" | "completed";
export type BroadcastMessagePriority = "normal" | "urgent" | "direction";

export type BroadcastMessage = {
  _id?: string;
  senderRole: "lead" | "marshal" | "admin";
  senderName: string;
  senderParticipantId?: string;
  text: string;
  priority?: BroadcastMessagePriority;
  targetParticipantId?: string;
  targetRiderName?: string;
  sentAt: string;
};

export type Participant = {
  _id: string;
  riderName: string;
  phone: string;
  bikeModel: string;
  bikeNumber: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  role: ParticipantRole;
  isPillion?: boolean;
  pillionRiderName?: string;
  status: ParticipantStatus;
  profileImage?: string;
  lastPingAt: string;
  joinedAt: string;
};

export type LiveRide = {
  _id: string;
  title: string;
  code: string;
  status: LiveRideStatus;
  startLocation: string;
  destination: string;
  allowNewParticipants: boolean;
  showRiderCountToSquad?: boolean;
  quickMessages?: string[];
  messages?: BroadcastMessage[];
  participants: Participant[];
  totalParticipants?: number;
  activeParticipants?: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicLiveRide = {
  id: string;
  title: string;
  code: string;
  status: LiveRideStatus;
  startLocation: string;
  destination: string;
  allowNewParticipants: boolean;
  showRiderCountToSquad?: boolean;
  quickMessages?: string[];
  messages?: BroadcastMessage[];
  activeParticipantsCount?: number | null;
  participants?: Participant[];
  registeredBikes?: Array<{
    participantId?: string;
    riderName: string;
    bikeModel: string;
    bikeNumber: string;
    isPillion: boolean;
    role: string;
    status?: string;
  }>;
};

export type CreateLiveRideInput = {
  title: string;
  startLocation?: string;
  destination?: string;
  code?: string;
  quickMessages?: string[];
  autoJoinLead?: boolean;
  leadRiderName?: string;
  leadBikeModel?: string;
  leadBikeNumber?: string;
  leadPhone?: string;
};

export type JoinLiveRideInput = {
  participantId?: string;
  riderName: string;
  bikeModel: string;
  bikeNumber?: string;
  phone?: string;
  profileImage?: string | File;
  role?: ParticipantRole;
  isPillion?: boolean;
  pillionRiderName?: string;
};

export type PingLocationInput = {
  participantId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
};

export type PingResponse = {
  success: boolean;
  rideStatus: LiveRideStatus;
  participantStatus: ParticipantStatus;
  participantRole?: ParticipantRole;
  isMarshalOrLead?: boolean;
  showRiderCountToSquad?: boolean;
  activeParticipantsCount?: number | null;
  quickMessages?: string[];
  messages?: BroadcastMessage[];
  participants?: Participant[];
  message?: string;
  code?: string;
};

export type SendBroadcastMessageInput = {
  participantId?: string;
  text: string;
  priority?: BroadcastMessagePriority;
  targetParticipantId?: string;
};
