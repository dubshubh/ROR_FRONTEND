import { api } from "./api";
import type {
  BroadcastMessage,
  CreateLiveRideInput,
  JoinLiveRideInput,
  LiveRide,
  LiveRideStatus,
  ParticipantRole,
  PingLocationInput,
  PingResponse,
  PublicLiveRide,
  SendBroadcastMessageInput
} from "@/types/live-ride";

// ----------------------------------------------------
// Admin Operations
// ----------------------------------------------------

export async function createLiveRide(data: CreateLiveRideInput | FormData) {
  const response = await api.post("/admin/live-rides", data);
  return response.data.data as LiveRide;
}

export async function getLiveRidesAdmin() {
  const response = await api.get("/admin/live-rides");
  return response.data.data as LiveRide[];
}

export async function getLiveRideAdmin(id: string) {
  const response = await api.get(`/admin/live-rides/${id}`);
  return response.data.data as LiveRide;
}

export async function updateLiveRideStatus(
  id: string,
  data: { status?: LiveRideStatus; allowNewParticipants?: boolean; showRiderCountToSquad?: boolean }
) {
  const response = await api.patch(`/admin/live-rides/${id}/status`, data);
  return response.data.data as LiveRide;
}

export async function ejectParticipant(id: string, participantId: string) {
  const response = await api.patch(`/admin/live-rides/${id}/participants/${participantId}/eject`);
  return response.data.data as { participantId: string; status: string };
}

export async function updateParticipantRole(id: string, participantId: string, role: ParticipantRole) {
  const response = await api.patch(`/admin/live-rides/${id}/participants/${participantId}/role`, { role });
  return response.data.data as { participantId: string; role: ParticipantRole };
}

export async function updateAdminParticipantProfile(
  id: string,
  participantId: string,
  payload: FormData | {
    riderName?: string;
    bikeModel?: string;
    bikeNumber?: string;
    phone?: string;
    role?: ParticipantRole;
    isPillion?: boolean;
    pillionRiderName?: string;
    profileImage?: string;
  }
) {
  const response = await api.patch(`/admin/live-rides/${id}/participants/${participantId}/profile`, payload);
  return response.data.data as { participant: LiveRide["participants"][0] };
}

export async function sendAdminBroadcastMessage(
  id: string,
  input: { text: string; priority?: string; targetParticipantId?: string }
) {
  const response = await api.post(`/admin/live-rides/${id}/messages`, input);
  return response.data.data as BroadcastMessage;
}

export async function updateQuickMessagesAdmin(id: string, quickMessages: string[]) {
  const response = await api.patch(`/admin/live-rides/${id}/quick-messages`, { quickMessages });
  return response.data.data as string[];
}

export async function deleteLiveRide(id: string) {
  await api.delete(`/admin/live-rides/${id}`);
}

// ----------------------------------------------------
// Public Rider Operations
// ----------------------------------------------------

export async function getPublicLiveRide(code: string) {
  const response = await api.get(`/live-rides/${code}`);
  return response.data.data as PublicLiveRide;
}

export async function joinLiveRide(code: string, input: JoinLiveRideInput | FormData) {
  const response = await api.post(`/live-rides/${code}/join`, input);
  return response.data.data as {
    participantId: string;
    participant: LiveRide["participants"][0];
    reconnected?: boolean;
    ride: {
      id: string;
      title: string;
      code: string;
      status: LiveRideStatus;
      showRiderCountToSquad?: boolean;
      quickMessages?: string[];
      messages?: BroadcastMessage[];
    };
  };
}

export async function updateRiderProfile(
  code: string,
  payload: FormData | {
    participantId: string;
    riderName?: string;
    bikeModel?: string;
    bikeNumber?: string;
    phone?: string;
    isPillion?: boolean;
    pillionRiderName?: string;
    profileImage?: string;
  }
) {
  const response = await api.patch(`/live-rides/${code}/profile`, payload);
  return response.data.data as { participant: LiveRide["participants"][0] };
}

export async function pingLocation(code: string, input: PingLocationInput): Promise<PingResponse> {
  const response = await api.post(`/live-rides/${code}/ping`, input);
  return response.data as PingResponse;
}

export async function sendRiderBroadcastMessage(code: string, input: SendBroadcastMessageInput) {
  const response = await api.post(`/live-rides/${code}/messages`, input);
  return response.data.data as BroadcastMessage;
}

export async function leaveLiveRide(code: string, participantId: string) {
  await api.post(`/live-rides/${code}/leave`, { participantId });
}

