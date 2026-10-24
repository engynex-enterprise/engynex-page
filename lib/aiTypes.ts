/** Forma de la lectura con IA guardada en leads.ai_insights (ver lib/ai.ts). */
export type LeadInsights = {
  summary: string;
  needs: string[];
  suggested_services: string[];
  urgency: "alta" | "media" | "baja";
  urgency_reason: string;
  questions: string[];
  red_flags: string[];
  next_step: string;
  opening_message: string;
};
