/**
 * Tipos de la base de datos de Supabase.
 *
 * Se mantienen a mano a partir de supabase/migrations/. Si instalas la CLI
 * de Supabase, puedes regenerarlos con:
 *   npx supabase gen types typescript --project-id fdmmxaaydsqmxfknpaqw > lib/supabase/types.ts
 */

export type AppRole =
  | "admin"
  | "sales"
  | "marketing"
  | "support"
  | "client"
  | "provider";

export type AccountKind = "client" | "provider" | "employee";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  kind: AccountKind;
  role: AppRole;
  active: boolean;
  avatar_url: string | null;
  must_change_password: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadTier = "green" | "yellow" | "red";
export type LeadStatus =
  | "new"
  | "contacted"
  | "meeting"
  | "proposal"
  | "won"
  | "lost";
export type MeetingChannel = "meet" | "call" | "whatsapp" | "in_person";
export type AppointmentStatus = "scheduled" | "cancelled" | "done" | "no_show";

export type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  problem_category: string;
  problem_text: string | null;
  budget: string;
  decision: string;
  timeline: string;
  score: number;
  tier: LeadTier;
  score_breakdown: Json;
  status: LeadStatus;
  assigned_to: string | null;
  locale: string | null;
  source_page: string | null;
  referrer: string | null;
  utm: Json | null;
  gclid: string | null;
  visitor_id: string | null;
  consent_at: string;
  whatsapp_opt_in_at: string | null;
  whatsapp_opt_out_at: string | null;
  email_token: string;
  email_opt_out_at: string | null;
  source: "web" | "chat" | "whatsapp" | "manual" | "import" | "referral";
  ai_insights: Json | null;
  ai_analyzed_at: string | null;
  ai_error: string | null;
  booking_token: string;
  value_cop: number | null;
  lost_reason: string | null;
  last_activity_at: string;
};

export type Appointment = {
  id: string;
  lead_id: string;
  starts_at: string;
  ends_at: string;
  channel: MeetingChannel;
  status: AppointmentStatus;
  notes: string | null;
  host_id: string | null;
  created_at: string;
  updated_at: string;
  kind: AppointmentKind;
  meeting_url: string | null;
  location: string | null;
  outcome: string | null;
  cancel_reason: string | null;
  reschedule_count: number;
};

export type AppointmentKind = "discovery" | "demo" | "proposal" | "followup" | "support" | "other";

export type ActivityType =
  | "note"
  | "call"
  | "whatsapp"
  | "email"
  | "meeting"
  | "status_change"
  | "assignment"
  | "created"
  | "appointment"
  | "chat";

export type LeadActivity = {
  id: string;
  lead_id: string;
  author_id: string | null;
  type: ActivityType;
  body: string | null;
  meta: Json;
  created_at: string;
  mentions: string[];
};

export type Task = {
  id: string;
  lead_id: string | null;
  title: string;
  due_at: string | null;
  assigned_to: string | null;
  created_by: string | null;
  done: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  tags: string[];
  checklist: ChecklistItem[];
  ticket_id: string | null;
  reminder_at: string | null;
  reminded_at: string | null;
  recurrence: TaskRecurrence;
  parent_id: string | null;
};

export type TaskStatus = "todo" | "in_progress" | "waiting" | "done";
export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskType = "call" | "email" | "whatsapp" | "meeting" | "follow_up" | "other";
export type TaskRecurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";
export type ChecklistItem = { id: string; title: string; done: boolean };

export type TaskComment = {
  id: number;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type Visitor = {
  id: string;
  first_seen: string;
  last_seen: string;
  first_landing: string | null;
  first_referrer: string | null;
  first_utm: Json | null;
  first_gclid: string | null;
  device: string | null;
  country: string | null;
  lead_id: string | null;
  page_views: number;
};

export type PageView = {
  id: number;
  visitor_id: string;
  session_id: string;
  path: string;
  title: string | null;
  referrer: string | null;
  utm: Json | null;
  locale: string | null;
  device: string | null;
  country: string | null;
  duration_ms: number | null;
  max_scroll: number | null;
  created_at: string;
};

export type ChatStatus = "open" | "closed";

export type ChatConversation = {
  id: string;
  token_hash: string;
  topic: string;
  visitor_id: string | null;
  lead_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  page: string | null;
  locale: string | null;
  status: ChatStatus;
  assigned_to: string | null;
  unread_agent: number;
  last_message: string | null;
  last_message_at: string;
  visitor_seen_at: string;
  agent_seen_at: string | null;
  closed_at: string | null;
  created_at: string;
  channel: ChatChannel;
  wa_phone: string | null;
  wa_window_until: string | null;
  tags: string[];
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  first_response_at: string | null;
  external_id: string | null;
  summary: string | null;
  summary_at: string | null;
};

export type ChatAttachment = { path: string; name: string; mime: string | null; size: number };

export type ChatAgentStatus = "available" | "busy" | "away";

export type ChatAgentRow = {
  profile_id: string;
  status: ChatAgentStatus;
  max_chats: number | null;
  sound: boolean;
  last_seen_at: string | null;
  last_assigned_at: string | null;
  updated_at: string;
};

export type ChatSettingsRow = {
  id: boolean;
  config: Json;
  updated_at: string;
  updated_by: string | null;
};

export type ChatSavedReply = {
  id: string;
  title: string;
  shortcut: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailQueueRow = {
  id: number;
  kind: string;
  lead_id: string | null;
  draft_id: string | null;
  report_id: string | null;
  to_email: string | null;
  send_at: string;
  status: "queued" | "sending" | "sent" | "failed" | "cancelled";
  error: string | null;
  provider_id: string | null;
  sent_at: string | null;
  created_at: string;
  payload: Json | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  open_count: number;
  click_count: number;
  created_by: string | null;
  campaign_id: string | null;
};

export type FollowupSettingsRow = {
  id: boolean;
  config: Json;
  updated_at: string;
  updated_by: string | null;
};

export type LeadDraft = {
  id: string;
  token: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  step: number;
  answers: Json;
  locale: string | null;
  source_page: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  reminded_at: string | null;
};

export type WeeklyReport = { id: string; week_start: string; kind: "week" | "month"; data: Json; created_at: string };

export type AppNotification = {
  id: number;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

export type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  params: Json;
  conditions: Json;
  actions: Json;
  enabled: boolean;
  template_key: string | null;
  runs: number;
  last_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AutomationRun = {
  id: number;
  rule_id: string;
  entity: string;
  entity_id: string;
  run_key: string;
  status: "done" | "failed";
  detail: Json | null;
  created_at: string;
};

export type DealStage = "prospecting" | "proposal" | "negotiation" | "won" | "lost";

export type Deal = {
  id: string;
  lead_id: string;
  title: string;
  value_cop: number;
  stage: DealStage;
  probability: number;
  expected_close: string | null;
  owner_id: string | null;
  notes: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadDocument = {
  id: string;
  lead_id: string;
  title: string;
  path: string;
  size: number;
  mime: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type ActivityReaction = { activity_id: string; user_id: string; emoji: string; created_at: string };

export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketPriority = "critical" | "high" | "medium" | "low";

export type Ticket = {
  id: string;
  number: number;
  requester_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  category: string;
  priority: TicketPriority;
  affected: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  assigned_to: string | null;
  source: "web" | "portal";
  last_activity_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: number;
  ticket_id: string;
  author_id: string | null;
  author_kind: "requester" | "staff" | "system";
  body: string;
  internal: boolean;
  created_at: string;
};

export type DocumentKind = "proposal" | "contract" | "invoice" | "deliverable" | "report" | "purchase_order" | "other";

export type PortalDocument = {
  id: string;
  owner_id: string;
  title: string;
  kind: DocumentKind;
  path: string;
  size: number;
  mime: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type ChatChannel = "web" | "whatsapp" | "messenger" | "instagram";
export type WaDelivery = "sent" | "delivered" | "read" | "failed";

export type WaTemplate = {
  id: string;
  meta_id: string | null;
  name: string;
  language: string;
  category: string | null;
  status: string;
  header: string | null;
  body: string;
  footer: string | null;
  variables: number;
  synced_at: string;
};

export type WaParam = {
  source: "first_name" | "name" | "company" | "owner" | "need" | "booking_link" | "quote_link" | "static";
  value?: string;
  fallback?: string;
};
export type WaSegment = {
  tiers?: string[];
  statuses?: string[];
  problems?: string[];
  sources?: string[];
  owners?: string[];
  days?: number | null;
  exclude_days?: number | null;
};
export type WaCampaignStatus = "draft" | "scheduled" | "sending" | "paused" | "sent" | "cancelled";
export type CampaignChannel = "whatsapp" | "email";

export type WaCampaign = {
  id: string;
  name: string;
  template_id: string | null;
  params: Json;
  segment: Json;
  status: WaCampaignStatus;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  total: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  channel: CampaignChannel;
  subject: string | null;
  preheader: string | null;
  body: string | null;
  cta_label: string | null;
  cta_url: string | null;
  utm: boolean;
  subject_b: string | null;
  throttle_per_hour: number | null;
};

export type CampaignSegment = { id: string; name: string; segment: Json; created_by: string | null; created_at: string };

export type WaMessageStatus = "queued" | "sending" | "sent" | "delivered" | "read" | "failed";

export type WaMessage = {
  id: number;
  campaign_id: string;
  lead_id: string | null;
  phone: string;
  name: string | null;
  params: Json;
  status: WaMessageStatus;
  wa_message_id: string | null;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  created_at: string;
};

export type ChatSender = "visitor" | "agent" | "system" | "bot";

export type ChatMessage = {
  id: number;
  conversation_id: string;
  sender: ChatSender;
  author_id: string | null;
  body: string;
  created_at: string;
  external_id: string | null;
  delivery: WaDelivery | null;
  internal: boolean;
  attachment: ChatAttachment | null;
  meta: Json | null;
};

export type BookingSettings = {
  id: number;
  timezone: string;
  duration_min: number;
  buffer_min: number;
  notice_hours: number;
  horizon_days: number;
  updated_at: string;
};

export type Availability = {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
};

export type AvailabilityBlock = {
  id: number;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export type ScoringConfig = {
  id: number;
  config: Json;
  updated_at: string;
  updated_by: string | null;
};

/** Respuesta de `submit_lead`. */
export type SubmitLeadResult = {
  id: string;
  tier: LeadTier;
  category: string;
  booking_token: string | null;
};

/** Respuesta de `book_appointment`. */
export type BookingResult = {
  id: string;
  starts_at: string;
  ends_at: string;
  channel: MeetingChannel;
  timezone: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        // Solo se crean desde la función submit_lead (RLS lo impone).
        Insert: Partial<Lead>;
        Update: Partial<
          Pick<Lead, "status" | "assigned_to" | "value_cop" | "lost_reason">
        >;
        Relationships: [];
      };
      lead_activities: {
        Row: LeadActivity;
        Insert: Partial<LeadActivity> & {
          lead_id: string;
          type: ActivityType;
          author_id: string;
        };
        Update: Partial<LeadActivity>;
        Relationships: [];
      };
      analytics_events: {
        Row: { id: number; visitor_id: string; session_id: string | null; name: string; label: string | null; path: string | null; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      task_comments: {
        Row: TaskComment;
        Insert: Partial<TaskComment> & { task_id: string; body: string };
        Update: Partial<TaskComment>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task> & { title: string };
        Update: Partial<Task>;
        Relationships: [];
      };
      booking_settings: {
        Row: BookingSettings;
        Insert: Partial<BookingSettings>;
        Update: Partial<BookingSettings>;
        Relationships: [];
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, "id">;
        Update: Partial<Availability>;
        Relationships: [];
      };
      availability_blocks: {
        Row: AvailabilityBlock;
        Insert: Omit<AvailabilityBlock, "id">;
        Update: Partial<AvailabilityBlock>;
        Relationships: [];
      };
      scoring_config: {
        Row: ScoringConfig;
        Insert: Partial<ScoringConfig>;
        Update: Partial<ScoringConfig>;
        Relationships: [];
      };
      visitors: {
        Row: Visitor;
        Insert: Partial<Visitor>;
        Update: Partial<Visitor>;
        Relationships: [];
      };
      page_views: {
        Row: PageView;
        Insert: Partial<PageView>;
        Update: Partial<PageView>;
        Relationships: [];
      };
      chat_conversations: {
        Row: ChatConversation;
        // Solo se escriben desde las funciones chat_* (RLS lo impone).
        Insert: Partial<ChatConversation>;
        Update: Partial<ChatConversation>;
        Relationships: [];
      };
      chat_saved_replies: {
        Row: ChatSavedReply;
        Insert: Partial<ChatSavedReply> & { title: string; shortcut: string; body: string };
        Update: Partial<ChatSavedReply>;
        Relationships: [];
      };
      followup_settings: {
        Row: FollowupSettingsRow;
        Insert: Partial<FollowupSettingsRow>;
        Update: Partial<FollowupSettingsRow>;
        Relationships: [];
      };
      chat_settings: {
        Row: ChatSettingsRow;
        Insert: Partial<ChatSettingsRow>;
        Update: Partial<ChatSettingsRow>;
        Relationships: [];
      };
      chat_agents: {
        Row: ChatAgentRow;
        Insert: Partial<ChatAgentRow>;
        Update: Partial<ChatAgentRow>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Partial<ChatMessage>;
        Update: Partial<ChatMessage>;
        Relationships: [];
      };
      email_queue: {
        Row: EmailQueueRow;
        Insert: Partial<EmailQueueRow>;
        Update: Partial<EmailQueueRow>;
        Relationships: [];
      };
      lead_drafts: {
        Row: LeadDraft;
        Insert: Partial<LeadDraft>;
        Update: Partial<LeadDraft>;
        Relationships: [];
      };
      weekly_reports: {
        Row: WeeklyReport;
        Insert: Partial<WeeklyReport>;
        Update: Partial<WeeklyReport>;
        Relationships: [];
      };
      notifications: {
        Row: AppNotification;
        Insert: Partial<AppNotification> & { user_id: string; kind: string; title: string };
        Update: Partial<Pick<AppNotification, "read_at">>;
        Relationships: [];
      };
      automation_rules: {
        Row: AutomationRule;
        Insert: Partial<AutomationRule> & { name: string; trigger: string };
        Update: Partial<AutomationRule>;
        Relationships: [];
      };
      automation_runs: {
        Row: AutomationRun;
        Insert: Partial<AutomationRun>;
        Update: Partial<AutomationRun>;
        Relationships: [];
      };
      lead_favorites: {
        Row: { user_id: string; lead_id: string; created_at: string };
        Insert: { lead_id: string; user_id?: string };
        Update: never;
        Relationships: [];
      };
      activity_reactions: {
        Row: ActivityReaction;
        Insert: { activity_id: string; emoji: string; user_id?: string };
        Update: never;
        Relationships: [];
      };
      deals: {
        Row: Deal;
        Insert: Partial<Deal> & { lead_id: string; title: string };
        Update: Partial<Deal>;
        Relationships: [];
      };
      lead_documents: {
        Row: LeadDocument;
        Insert: Partial<LeadDocument> & { lead_id: string; title: string; path: string };
        Update: Partial<LeadDocument>;
        Relationships: [];
      };
      tickets: {
        Row: Ticket;
        // Se crean con submit_ticket; el equipo actualiza estado, prioridad y responsable.
        Insert: Partial<Ticket>;
        Update: Partial<Pick<Ticket, "status" | "priority" | "assigned_to" | "category">>;
        Relationships: [];
      };
      ticket_messages: {
        Row: TicketMessage;
        Insert: Partial<TicketMessage>;
        Update: Partial<TicketMessage>;
        Relationships: [];
      };
      documents: {
        Row: PortalDocument;
        Insert: Partial<PortalDocument> & { owner_id: string; title: string; path: string };
        Update: Partial<PortalDocument>;
        Relationships: [];
      };
      wa_templates: {
        Row: WaTemplate;
        Insert: Partial<WaTemplate> & { name: string; language: string; status: string; body: string };
        Update: Partial<WaTemplate>;
        Relationships: [];
      };
      campaign_segments: {
        Row: CampaignSegment;
        Insert: Partial<CampaignSegment> & { name: string; segment: Json };
        Update: Partial<CampaignSegment>;
        Relationships: [];
      };
      wa_campaigns: {
        Row: WaCampaign;
        Insert: Partial<WaCampaign> & { name: string };
        Update: Partial<WaCampaign>;
        Relationships: [];
      };
      wa_messages: {
        Row: WaMessage;
        Insert: Partial<WaMessage> & { campaign_id: string; phone: string };
        Update: Partial<WaMessage>;
        Relationships: [];
      };
      appointments: {
        Row: Appointment;
        // Solo se crean desde la función book_appointment (RLS lo impone).
        Insert: Partial<Appointment>;
        Update: Partial<Omit<Appointment, "id" | "lead_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      my_role: { Args: Record<string, never>; Returns: AppRole };
      is_employee: { Args: Record<string, never>; Returns: boolean };
      has_role: { Args: { roles: AppRole[] }; Returns: boolean };
      submit_lead: { Args: { p: Json }; Returns: Json };
      admin_create_user: {
        Args: {
          p_email: string;
          p_full_name: string;
          p_kind: AccountKind;
          p_role: AppRole;
          p_phone?: string | null;
          p_company?: string | null;
        };
        Returns: Json;
      };
      admin_reset_password: { Args: { p_user: string }; Returns: Json };
      admin_set_active: {
        Args: { p_user: string; p_active: boolean };
        Returns: undefined;
      };
      admin_set_role: {
        Args: { p_user: string; p_kind: AccountKind; p_role: AppRole };
        Returns: undefined;
      };
      mark_password_changed: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      touch_last_seen: { Args: Record<string, never>; Returns: undefined };
      track_page_view: { Args: { p: Json }; Returns: number | null };
      track_page_leave: { Args: { p: Json }; Returns: undefined };
      forget_visitor: { Args: { p_visitor: string }; Returns: undefined };
      analytics_tracked_leads: {
        Args: { p_from: string; p_to: string };
        Returns: number;
      };
      analytics_summary: {
        Args: { p_from: string; p_to: string };
        Returns: Json;
      };
      chat_start: { Args: { p: Json }; Returns: Json };
      chat_fetch: { Args: { p_token: string; p_after?: number }; Returns: Json };
      chat_send: { Args: { p_token: string; p_body: string }; Returns: number };
      chat_end: { Args: { p_token: string }; Returns: undefined };
      chat_agent_send: {
        Args: { p_conversation: string; p_body: string; p_internal?: boolean; p_attachment?: Json | null };
        Returns: number;
      };
      chat_send_file: { Args: { p_token: string; p: Json }; Returns: number };
      chat_public_config: { Args: { p_locale?: string }; Returns: Json };
      chat_agent_heartbeat: { Args: Record<string, never>; Returns: Json };
      chat_agent_set: { Args: { p: Json; p_profile?: string | null }; Returns: undefined };
      chat_transfer: { Args: { p_conversation: string; p_to: string; p_note?: string | null }; Returns: undefined };
      chat_save_summary: { Args: { p_conversation: string; p_summary: string }; Returns: undefined };
      chat_create_ticket: { Args: { p_conversation: string; p: Json }; Returns: Json };
      chat_report: { Args: { p_days?: number }; Returns: Json };
      chat_team: { Args: Record<string, never>; Returns: Json };
      meta_inbound: {
        Args: { p_channel: string; p_user: string; p_name: string | null; p_body: string; p_mid: string };
        Returns: Json;
      };
      meta_agent_message: {
        Args: { p_conversation: string; p_author: string | null; p_body: string; p_mid: string };
        Returns: number;
      };
      meta_seen: { Args: { p_channel: string; p_user: string; p_status: string; p_until: string }; Returns: undefined };
      chat_offline_notice: { Args: { p_token: string }; Returns: undefined };
      chat_rate: { Args: { p_token: string; p_rating: number; p_comment?: string | null }; Returns: undefined };
      chat_create_lead: { Args: { p_conversation: string; p: Json }; Returns: string };
      chat_stats: { Args: { p_days?: number }; Returns: Json };
      chat_agent_read: { Args: { p_conversation: string }; Returns: undefined };
      chat_agent_update: {
        Args: { p_conversation: string; p: Json };
        Returns: undefined;
      };
      wa_campaign_stats: {
        Args: Record<string, never>;
        Returns: {
          campaign_id: string;
          sent: number;
          delivered: number;
          read: number;
          replied: number;
          failed: number;
          pending: number;
        }[];
      };
      ads_offline_conversions: {
        Args: { p_days?: number };
        Returns: { gclid: string; kind: string; converted_at: string; value: number | null; lead_id: string }[];
      };
      submit_ticket: { Args: { p: Json }; Returns: Json };
      ticket_reply: {
        Args: { p_ticket: string; p_body: string; p_internal?: boolean };
        Returns: number;
      };
      my_appointments: {
        Args: Record<string, never>;
        Returns: { id: string; starts_at: string; ends_at: string; channel: MeetingChannel; status: string }[];
      };
      public_tag_config: { Args: Record<string, never>; Returns: Json };
      integration_status: { Args: Record<string, never>; Returns: Json };
      admin_get_integrations: { Args: Record<string, never>; Returns: Json };
      admin_set_integration: { Args: { p_key: string; p_value: string | null }; Returns: undefined };
      integration_config: { Args: Record<string, never>; Returns: Json };
      save_lead_draft: { Args: { p: Json }; Returns: string };
      get_lead_draft: { Args: { p_token: string }; Returns: Json };
      email_unsubscribe: { Args: { p_token: string }; Returns: boolean };
      jobs_enqueue_abandoned: { Args: Record<string, never>; Returns: number };
      email_claim: { Args: { p_limit?: number }; Returns: Json[] };
      email_mark: {
        Args: { p_id: number; p_status: string; p_error?: string | null; p_provider_id?: string | null };
        Returns: undefined;
      };
      email_cancel: { Args: { p_id: number }; Returns: undefined };
      email_bulk: { Args: { p_ids: number[]; p_action: "send_now" | "cancel" | "retry" }; Returns: number };
      email_reschedule: { Args: { p_id: number; p_at: string }; Returns: undefined };
      email_event: { Args: { p_provider_id: string; p_type: string; p_at?: string }; Returns: undefined };
      followup_enroll: { Args: { p_lead: string }; Returns: number };
      followup_stop: { Args: { p_lead: string }; Returns: number };
      email_compose: { Args: { p_lead: string; p: Json }; Returns: number };
      draft_remind: { Args: { p_id: string }; Returns: undefined };
      draft_delete: { Args: { p_id: string }; Returns: undefined };
      followup_report: { Args: { p_days?: number }; Returns: Json };
      tasks_kpis: { Args: Record<string, never>; Returns: Json };
      booking_lead: { Args: { p_token: string }; Returns: Json };
      booking_invite: { Args: { p_lead: string }; Returns: string };
      staff_free_slots: { Args: { p_day: string; p_duration?: number | null }; Returns: { starts_at: string }[] };
      staff_book: { Args: { p: Json }; Returns: string };
      staff_reschedule: { Args: { p_id: string; p_start: string; p_notify?: boolean }; Returns: undefined };
      staff_cancel: { Args: { p_id: string; p_reason?: string | null; p_notify?: boolean }; Returns: undefined };
      appointment_close: {
        Args: { p_id: string; p_status: AppointmentStatus; p_outcome?: string | null; p_followup_days?: number | null };
        Returns: undefined;
      };
      agenda_kpis: { Args: { p_days?: number }; Returns: Json };
      track_event: { Args: { p: Json }; Returns: undefined };
      report_live: { Args: { p_from: string; p_to: string }; Returns: Json };
      report_team: { Args: { p_from: string; p_to: string }; Returns: Json };
      report_trends: { Args: { p_months?: number }; Returns: Json };
      report_pipeline: { Args: Record<string, never>; Returns: Json };
      report_generate_month: { Args: { p_month_start: string; p_email?: boolean }; Returns: string };
      report_send: { Args: { p_report: string }; Returns: undefined };
      analytics_overview: { Args: { p_from: string; p_to: string }; Returns: Json };
      analytics_acquisition: { Args: { p_from: string; p_to: string }; Returns: Json };
      analytics_behavior: { Args: { p_from: string; p_to: string }; Returns: Json };
      analytics_funnel: { Args: { p_from: string; p_to: string }; Returns: Json };
      analytics_live: { Args: Record<string, never>; Returns: Json };
      report_generate: { Args: { p_week_start: string; p_email?: boolean }; Returns: string };
      jobs_weekly_report: { Args: Record<string, never>; Returns: string | null };
      jobs_monthly_report: { Args: Record<string, never>; Returns: string | null };
      ai_pending_leads: {
        Args: { p_limit?: number };
        Returns: {
          id: string;
          name: string;
          company: string | null;
          problem_category: string;
          problem_text: string;
          budget: string;
          decision: string;
          timeline: string;
          tier: string;
          locale: string | null;
        }[];
      };
      ai_store: { Args: { p_lead: string; p_insights: Json | null; p_error?: string | null }; Returns: undefined };
      ai_reset: { Args: { p_lead: string }; Returns: undefined };
      admin_jobs_schedule: { Args: { p_url: string; p_enabled: boolean }; Returns: Json };
      admin_jobs_status: { Args: Record<string, never>; Returns: Json };
      notifications_mark_all_read: { Args: Record<string, never>; Returns: undefined };
      global_search: { Args: { p_q: string }; Returns: Json };
      automations_run_now: { Args: Record<string, never>; Returns: number };
      home_dashboard: { Args: { p_days?: number }; Returns: Json };
      crm_kpis: { Args: { p_days?: number }; Returns: Json };
      staff_create_lead: { Args: { p: Json }; Returns: string };
      import_leads: { Args: { p_rows: Json }; Returns: Json };
      staff_book_appointment: {
        Args: { p_lead: string; p_start: string; p_channel: MeetingChannel; p_notes?: string | null };
        Returns: string;
      };
      wa_audience_count: { Args: { p_segment: Json }; Returns: number };
      wa_campaign_queue: { Args: { p_campaign: string }; Returns: number };
      campaign_audience: { Args: { p_segment: Json; p_channel: string; p_limit?: number }; Returns: Json };
      campaign_queue: { Args: { p_campaign: string }; Returns: number };
      campaign_action: { Args: { p_campaign: string; p_action: "pause" | "resume" | "cancel" | "retry" }; Returns: number };
      campaign_duplicate: { Args: { p_campaign: string }; Returns: string };
      campaign_stats: {
        Args: Record<string, never>;
        Returns: { campaign_id: string; sent: number; delivered: number; opened: number; engaged: number; failed: number; pending: number; unsubscribed: number }[];
      };
      campaign_report: { Args: { p_campaign: string }; Returns: Json };
      campaign_ab: { Args: { p_campaign: string }; Returns: Json };
      campaigns_overview: { Args: { p_days?: number }; Returns: Json };
      wa_claim_batch: {
        Args: { p_limit?: number };
        Returns: { id: number; phone: string; params: Json; template: string; language: string }[];
      };
      wa_mark_sent: {
        Args: { p_id: number; p_wa_id: string | null; p_error?: string | null };
        Returns: undefined;
      };
      wa_status_update: {
        Args: { p_wa_id: string; p_status: string; p_error?: string | null };
        Returns: undefined;
      };
      wa_inbound: {
        Args: { p_phone: string; p_name: string | null; p_body: string; p_wa_id: string };
        Returns: Json;
      };
      wa_agent_message: {
        Args: { p_conversation: string; p_author: string | null; p_body: string; p_wa_id: string };
        Returns: number;
      };
      available_slots: {
        Args: { p_token: string };
        Returns: { starts_at: string }[];
      };
      book_appointment: {
        Args: {
          p_token: string;
          p_start: string;
          p_channel: MeetingChannel;
          p_notes?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: AppRole;
      account_kind: AccountKind;
      lead_tier: LeadTier;
      lead_status: LeadStatus;
      meeting_channel: MeetingChannel;
      appointment_status: AppointmentStatus;
      activity_type: ActivityType;
    };
    CompositeTypes: Record<string, never>;
  };
};
