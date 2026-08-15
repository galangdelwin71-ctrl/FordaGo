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

export interface Conversation {
  id: number;
  coach_id: number;
  client_id: number;
  is_coach: boolean;
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

  getMyCoachProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/coaches/profile/me`);
  }

  getCoachClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/coaches/clients`);
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
