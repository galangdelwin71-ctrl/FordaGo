import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface Coach {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  bio?: string;
  specialty?: string;
  rate?: number;
  created_at?: string;
}

/** Response shape of GET /coaches/profile/me — the caller's own coach profile, if any. */
export interface CoachProfileMe {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  bio: string;
  specialty: string;
  rate: number;
  is_active: boolean;
  /** True only if the authenticated user actually has a coach profile row. */
  has_profile: boolean;
}

/** A client's next accepted session, as returned nested inside CoachClientItem. */
export interface CoachClientNextSession {
  id: number;
  session_date: string;
  time_val: string;
  time_ampm: string;
  duration_minutes: number;
  location?: string;
}

/** Response shape of GET /coaches/clients — one entry per client conversation. */
export interface CoachClientItem {
  conversation_id: number;
  client: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };
  latest_message?: Message;
  next_session?: CoachClientNextSession | null;
  updated_at: string;
}

/** Response shape of GET /coaches/requests — one entry per pending client request. */
export interface CoachRequestItem {
  conversation_id: number;
  client: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  latest_message?: Message;
  created_at: string;
}

/** Response shape of GET /coaches/dashboard-stats. */
export interface CoachDashboardStats {
  active_clients: number;
  sessions_today: number;
  pending_requests: number;
  earnings_this_month: number;
}

export interface CoachAvailabilitySlot {
  id?: number;
  coach_id?: number;
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  start_time: string;  // 'HH:mm'
  end_time: string;    // 'HH:mm'
  is_active?: boolean;
}

export interface CoachProgramItemPayload {
  id?: number;
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  order?: number;
}

export interface CoachProgram {
  id?: number;
  coach_id?: number;
  name: string;
  workout_type?: string;
  target?: string;
  duration_minutes?: number;
  price?: number;
  description?: string;
  items?: CoachProgramItemPayload[];
  created_at?: string;
  /** Public group-class fields — only meaningful when is_public is true. */
  is_public?: boolean;
  capacity?: number | null;
  session_date?: string | null;
  time_val?: string | null;
  time_ampm?: string | null;
  location?: string | null;
  /** Present only on responses from the public browse/detail endpoints. */
  coach?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  booked_count?: number;
  spots_left?: number | null;
  is_full?: boolean;
  already_booked?: boolean;
}

/** A member's seat in a public group class — GET /coaches/programs/{id}/bookings. */
export interface ProgramBooking {
  id: number;
  program_id: number;
  member_id: number;
  status: 'booked' | 'cancelled';
  payment_status: 'pay_at_gym' | 'paid';
  booked_at?: string;
  member?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

export interface Conversation {
  id: number;
  coach_id: number;
  client_id: number;
  is_coach: boolean;
  /** 'pending' | 'active' | 'declined' — see Conversation::STATUS_* on the backend. */
  status?: 'pending' | 'active' | 'declined';
  partner: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  partner_role: 'coach' | 'client';
  latest_message?: Message;
  unread_count: number;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  type: 'text' | 'proposal';
  read_at?: string;
  created_at: string;
  sender?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    role?: string;
  };
  proposal?: WorkoutPlanProposal;
}

export interface WorkoutPlanItem {
  id?: number;
  proposal_id?: number;
  name: string;
  description?: string;
  sets: number;
  reps: number;
  order?: number;
}

export interface WorkoutPlanProposal {
  id: number;
  conversation_id: number;
  coach_id: number;
  client_id: number;
  session_date: string;
  time_val: string;
  time_ampm: string;
  duration_minutes: number;
  price: number;
  location?: string;
  status: 'pending' | 'accepted' | 'expired';
  message_id?: number;
  accepted_at?: string;
  created_at?: string;
  items?: WorkoutPlanItem[];
  coach?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  client?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class CoachingService {
  private readonly apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  // ── Coaches ──────────────────────────────────────────

  getCoaches(search = '', specialty = ''): Observable<Coach[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());
    if (specialty.trim() && specialty !== 'All') params = params.set('specialty', specialty.trim());
    return this.http.get<Coach[]>(`${this.apiUrl}/coaches`, { params });
  }

  getCoach(id: number): Observable<Coach> {
    return this.http.get<Coach>(`${this.apiUrl}/coaches/${id}`);
  }

  getMyCoachProfile(): Observable<CoachProfileMe> {
    return this.http.get<CoachProfileMe>(`${this.apiUrl}/coaches/profile/me`);
  }

  getCoachClients(): Observable<CoachClientItem[]> {
    return this.http.get<CoachClientItem[]>(`${this.apiUrl}/coaches/clients`);
  }

  /** GET /coaches/requests — pending client-initiated conversations awaiting Accept/Decline. */
  getCoachRequests(): Observable<CoachRequestItem[]> {
    return this.http.get<CoachRequestItem[]>(`${this.apiUrl}/coaches/requests`);
  }

  /** GET /coaches/dashboard-stats — the whole Coach Dashboard stats row in one call. */
  getDashboardStats(): Observable<CoachDashboardStats> {
    return this.http.get<CoachDashboardStats>(`${this.apiUrl}/coaches/dashboard-stats`);
  }

  /** PUT /coaches/profile/me — self-service edit, limited to bio/specialty/photo_url/rate. */
  updateMyCoachProfile(payload: { bio?: string; specialty?: string; photo_url?: string; rate?: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/coaches/profile/me`, payload);
  }

  // ── Conversation accept/decline (Requests tab) ────────

  acceptConversation(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conversations/${id}/accept`, {});
  }

  declineConversation(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conversations/${id}/decline`, {});
  }

  // ── Availability ("Set Availability") ────────────────────

  getAvailability(): Observable<CoachAvailabilitySlot[]> {
    return this.http.get<CoachAvailabilitySlot[]>(`${this.apiUrl}/coaches/availability`);
  }

  createAvailabilitySlot(payload: { day_of_week: number; start_time: string; end_time: string; is_active?: boolean }): Observable<CoachAvailabilitySlot> {
    return this.http.post<CoachAvailabilitySlot>(`${this.apiUrl}/coaches/availability`, payload);
  }

  updateAvailabilitySlot(id: number, payload: Partial<CoachAvailabilitySlot>): Observable<CoachAvailabilitySlot> {
    return this.http.put<CoachAvailabilitySlot>(`${this.apiUrl}/coaches/availability/${id}`, payload);
  }

  deleteAvailabilitySlot(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/coaches/availability/${id}`);
  }

  // ── Programs ("Create Program") ─────────────────────

  getPrograms(): Observable<CoachProgram[]> {
    return this.http.get<CoachProgram[]>(`${this.apiUrl}/coaches/programs`);
  }

  getProgram(id: number): Observable<CoachProgram> {
    return this.http.get<CoachProgram>(`${this.apiUrl}/coaches/programs/${id}`);
  }

  createProgram(payload: CoachProgram): Observable<CoachProgram> {
    return this.http.post<CoachProgram>(`${this.apiUrl}/coaches/programs`, payload);
  }

  updateProgram(id: number, payload: Partial<CoachProgram>): Observable<CoachProgram> {
    return this.http.put<CoachProgram>(`${this.apiUrl}/coaches/programs/${id}`, payload);
  }

  deleteProgram(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/coaches/programs/${id}`);
  }

  /** GET /coaches/programs/{id}/bookings — roster for a public class the coach owns. */
  getProgramRoster(programId: number): Observable<ProgramBooking[]> {
    return this.http.get<ProgramBooking[]>(`${this.apiUrl}/coaches/programs/${programId}/bookings`);
  }

  // ── Public group classes ("Avail" flow) ──────────────

  /** GET /programs/public — browse all upcoming public classes any member can book into. */
  getPublicPrograms(): Observable<CoachProgram[]> {
    return this.http.get<CoachProgram[]>(`${this.apiUrl}/programs/public`);
  }

  getPublicProgram(id: number): Observable<CoachProgram> {
    return this.http.get<CoachProgram>(`${this.apiUrl}/programs/public/${id}`);
  }

  /** POST /programs/{id}/book — instant-book a seat, pay at gym. */
  bookProgram(id: number): Observable<{ message: string; booking: ProgramBooking; workout_session: any }> {
    return this.http.post<any>(`${this.apiUrl}/programs/${id}/book`, {});
  }

  /** POST /programs/{id}/book/cancel — member cancels their own seat. */
  cancelProgramBooking(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/programs/${id}/book/cancel`, {});
  }

  // ── Conversations ────────────────────────────────────

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  startConversation(payload: { coach_id?: number; client_id?: number; target_user_id?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conversations/start`, payload);
  }

  getConversation(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations/${id}`);
  }

  // ── Messages ─────────────────────────────────────────

  getMessages(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: number, body: string, type: 'text' | 'proposal' = 'text'): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/conversations/${conversationId}/messages`, { body, type });
  }

  markMessagesRead(conversationId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/conversations/${conversationId}/read`, {});
  }

  // ── Proposals ────────────────────────────────────────

  getProposals(status?: string): Observable<WorkoutPlanProposal[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<WorkoutPlanProposal[]>(`${this.apiUrl}/proposals`, { params });
  }

  getProposal(id: number): Observable<WorkoutPlanProposal> {
    return this.http.get<WorkoutPlanProposal>(`${this.apiUrl}/proposals/${id}`);
  }

  createProposal(payload: {
    conversation_id: number;
    session_date: string;
    time_val: string;
    time_ampm: string;
    duration_minutes: number;
    price: number;
    location?: string;
    items: { name: string; sets?: number; reps?: number; description?: string }[];
  }): Observable<WorkoutPlanProposal> {
    return this.http.post<WorkoutPlanProposal>(`${this.apiUrl}/proposals`, payload);
  }

  acceptProposal(id: number): Observable<{ message: string; proposal: WorkoutPlanProposal; workout_session: any }> {
    return this.http.post<any>(`${this.apiUrl}/proposals/${id}/accept`, {});
  }

  cancelProposal(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/proposals/${id}/cancel`, {});
  }

  // ── Admin: Coach account management (admin/super_admin only) ─────
  // Coach accounts can only be created or edited here — there is no
  // self-service "become a coach" path anywhere else in the app.

  getAdminCoaches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/coaches`);
  }

  createCoach(payload: {
    user_id?: number;
    username?: string;
    email?: string;
    password?: string;
    phone?: string;
    gender?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
    specialty?: string;
    photo_url?: string;
    rate?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/coaches`, payload);
  }

  updateAdminCoach(userId: number, payload: {
    bio?: string;
    specialty?: string;
    photo_url?: string;
    rate?: number;
    is_active?: boolean;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/coaches/${userId}`, payload);
  }

  deleteAdminCoach(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/coaches/${userId}`);
  }
}
