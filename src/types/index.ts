export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface ElderlyProfile {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  age: number | null;
  family_info: Record<string, unknown>;
  interests: string[];
  hobbies: string[];
  routines: string[];
  favorite_topics: string[];
  sensitive_topics: string[];
  active: boolean;
  created_at: string;
  retell_agent_id: string | null;
  retell_llm_id: string | null;
  preferred_call_time: string | null;
}

export type PlanType = "esencial" | "completo";
export type CallsPerDay = 1 | 2;
export type MinutesPerCall = 4;
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete"
  | "payment_failed";

export interface Subscription {
  id: string;
  user_id: string;
  elderly_id: string;
  plan_type: PlanType;
  calls_per_day: CallsPerDay;
  minutes_per_call: MinutesPerCall;
  status: SubscriptionStatus;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  current_period_end: string | null;
  created_at: string;
}

export type ConversationSessionStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "failed"
  | "no_answer";

export interface ConversationSession {
  id: string;
  elderly_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: ConversationSessionStatus;
  mood: string | null;
  retell_call_id: string | null;
  transcript: string | null;
}

export type MemoryType = "permanent" | "recent" | "episodic";

export interface Memory {
  id: string;
  elderly_id: string;
  content: string;
  memory_type: MemoryType;
  source: string;
  confidence: number;
  created_at: string;
}

export type AlertLevel = 1 | 2 | 3;

export interface Alert {
  id: string;
  elderly_id: string;
  user_id: string;
  alert_level: AlertLevel;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CallSummary {
  id: string;
  session_id: string;
  summary: string;
  important_things: string[];
  topics_discussed: string[];
  mood_detected: string | null;
  created_at: string;
}

export interface ElderlyPhoto {
  id: string;
  elderly_id: string;
  uploaded_by: string;
  image_url: string;
  caption: string;
  people_in_photo: string | null;
  created_at: string;
}

export type ElderlyAccessRole = "owner" | "viewer";
export type ElderlyAccessStatus = "pending" | "accepted";

export interface ElderlyProfileAccess {
  id: string;
  elderly_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: ElderlyAccessRole;
  invited_by: string;
  invite_token: string;
  status: ElderlyAccessStatus;
  created_at: string;
}

export type ChatRole = "user" | "assistant";

export interface FamilyChatMessage {
  id: string;
  elderly_id: string;
  user_id: string | null;
  role: ChatRole;
  content: string;
  created_at: string;
}
