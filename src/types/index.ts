// Core domain types for Memoria Activa
// These mirror the Supabase (PostgreSQL) schema described in the project spec.

export type PlanType = 'basic' | 'care' | 'premium';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type CallsPerDay = 1 | 2 | 3;
export type MinutesPerCall = 5 | 10 | 15;
export type SessionStatus = 'ongoing' | 'completed' | 'failed';
export type Mood = 'positive' | 'neutral' | 'negative';
export type MessageRole = 'user' | 'assistant';
export type MemoryType = 'permanent' | 'recent' | 'episodic';
export type AlertLevel = 1 | 2 | 3;

// 1. users (familiares)
export type User = {
  id: string;
  email: string;
  name?: string;
  created_at: string;
};

// 2. elderly_profiles (personas mayores)
export type ElderlyProfile = {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  family_info?: Record<string, any>;
  interests?: string[];
  hobbies?: string[];
  routines?: Record<string, string>;
  favorite_topics?: string[];
  sensitive_topics?: string[];
  active: boolean;
};

// 3. subscriptions
export type Subscription = {
  id: string;
  user_id: string;
  elderly_id: string;
  plan_type: PlanType;
  calls_per_day: CallsPerDay;
  minutes_per_call: MinutesPerCall;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
};

// 4. conversation_sessions
export type ConversationSession = {
  id: string;
  elderly_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  status: SessionStatus;
  mood?: Mood;
  retell_call_id?: string;
  transcript?: string;
};

// 5. conversation_messages
export type ConversationMessage = {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
};

// 6. memories
export type Memory = {
  id: string;
  elderly_id: string;
  content: string;
  memory_type: MemoryType;
  source: string; // session ID o "manual"
  confidence: number; // 0-1
  created_at: string;
};

// 7. call_summaries
export type CallSummary = {
  id: string;
  session_id: string;
  summary: string;
  important_things?: Record<string, any>;
  topics_discussed?: string[];
  mood_detected?: Mood;
};

// 8. alerts
export type Alert = {
  id: string;
  elderly_id: string;
  user_id: string;
  alert_level: AlertLevel;
  message: string;
  is_read: boolean;
  created_at: string;
};

// Supabase generic database shape for typed client usage.
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & Pick<User, 'email'>;
        Update: Partial<User>;
      };
      elderly_profiles: {
        Row: ElderlyProfile;
        Insert: Partial<ElderlyProfile> & Pick<ElderlyProfile, 'user_id' | 'name' | 'phone_number'>;
        Update: Partial<ElderlyProfile>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription> &
          Pick<Subscription, 'user_id' | 'elderly_id' | 'plan_type' | 'calls_per_day' | 'minutes_per_call' | 'status'>;
        Update: Partial<Subscription>;
      };
      conversation_sessions: {
        Row: ConversationSession;
        Insert: Partial<ConversationSession> & Pick<ConversationSession, 'elderly_id' | 'started_at' | 'status'>;
        Update: Partial<ConversationSession>;
      };
      conversation_messages: {
        Row: ConversationMessage;
        Insert: Partial<ConversationMessage> &
          Pick<ConversationMessage, 'session_id' | 'role' | 'content' | 'timestamp'>;
        Update: Partial<ConversationMessage>;
      };
      memories: {
        Row: Memory;
        Insert: Partial<Memory> & Pick<Memory, 'elderly_id' | 'content' | 'memory_type' | 'source' | 'confidence'>;
        Update: Partial<Memory>;
      };
      call_summaries: {
        Row: CallSummary;
        Insert: Partial<CallSummary> & Pick<CallSummary, 'session_id' | 'summary'>;
        Update: Partial<CallSummary>;
      };
      alerts: {
        Row: Alert;
        Insert: Partial<Alert> & Pick<Alert, 'elderly_id' | 'user_id' | 'alert_level' | 'message'>;
        Update: Partial<Alert>;
      };
    };
  };
};
