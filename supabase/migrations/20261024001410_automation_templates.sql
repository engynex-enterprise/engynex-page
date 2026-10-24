-- Una regla con error nunca bloquea el evento que la disparó.
create or replace function public.automation_fire(p_trigger text, p_entity text, p_id text, p_key text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.automation_rules;
begin
  for r in select * from public.automation_rules where enabled and trigger = p_trigger order by created_at loop
    begin
      perform public.automation_execute(r, p_entity, p_id, p_entity || ':' || p_id || ':' || p_key);
    exception when others then
      raise warning 'automatización % falló: %', r.id, sqlerrm;
    end;
  end loop;
end;
$$;
revoke all on function public.automation_fire(text, text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Reglas listas para usar (avisos y recordatorios)
-- -----------------------------------------------------------------------------
insert into public.automation_rules (template_key, name, description, trigger, params, conditions, actions, enabled, created_by) values
('green_assign', 'Lead verde: asignar por turnos y avisar',
 'Reparte los leads verdes entre ventas y avisa al asesor al instante.',
 'lead_created', '{}', '{"tiers":["green"]}',
 '[{"type":"assign","roles":["sales","admin"]},{"type":"notify","to":"owner","kind":"lead","title":"🟢 Nuevo lead verde: {nombre}","body":"{empresa} · puntaje {puntaje}. Contáctalo cuanto antes."}]', true, null),
('green_not_contacted', 'Lead verde sin contactar en 15 minutos',
 'Alerta a la gerencia si nadie ha registrado contacto con un lead verde.',
 'lead_not_contacted', '{"minutes":15}', '{"tiers":["green"]}',
 '[{"type":"notify","to":"roles","roles":["admin"],"kind":"lead","title":"⚠️ {nombre} lleva 15 min sin contacto","body":"Lead verde asignado y sin llamada, nota ni WhatsApp registrado."}]', true, null),
('meeting_reminder_24h', 'Recordatorio de cita 24 horas antes',
 'Correo al cliente el día anterior a la reunión.',
 'appointment_upcoming', '{"hours":24}', '{}',
 '[{"type":"email","to":"contact","subject":"Mañana nos vemos, {primer_nombre}","body":"Te recordamos tu reunión con Engynex: {fecha} ({canal}).\n\nSi necesitas cambiarla, responde este correo y lo coordinamos."}]', true, null),
('meeting_reminder_1h', 'Recordatorio de cita 1 hora antes',
 'Correo al cliente y aviso al asesor una hora antes.',
 'appointment_upcoming', '{"hours":1}', '{}',
 '[{"type":"email","to":"contact","subject":"En una hora es tu reunión con Engynex","body":"Hola {primer_nombre}, tu reunión es hoy a las {fecha} por {canal}. ¡Nos vemos!"},{"type":"notify","to":"owner","kind":"meeting","title":"📅 Reunión en 1 hora con {nombre}","body":"{fecha} · {canal}"}]', true, null),
('ticket_reply_email', 'Respuesta en una solicitud → correo al cliente',
 'Cuando el equipo responde una solicitud de soporte, el cliente recibe la respuesta por correo.',
 'ticket_staff_reply', '{}', '{}',
 '[{"type":"email","to":"contact","subject":"Respuesta a tu solicitud #{numero}: {asunto}","body":"Hola {primer_nombre}, te respondimos:\n\n{ultima_respuesta}\n\nPuedes contestar desde tu portal de cliente o respondiendo este correo.","cta_label":"Ver la solicitud","cta_url":"https://engynex.com/es/portal/soporte"}]', true, null),
('ticket_urgent', 'Solicitud crítica o alta → avisar a soporte',
 'Aviso inmediato al equipo de soporte para las solicitudes urgentes.',
 'ticket_created', '{}', '{"priorities":["critical","high"]}',
 '[{"type":"notify","to":"roles","roles":["support","admin"],"kind":"ticket","title":"🚨 Solicitud #{numero} ({prioridad}): {asunto}","body":"De {nombre} · {empresa}"}]', true, null),
('ticket_assign', 'Solicitud nueva → asignar por turnos',
 'Reparte las solicitudes nuevas entre el equipo de soporte.',
 'ticket_created', '{}', '{}',
 '[{"type":"assign","roles":["support"]},{"type":"notify","to":"owner","kind":"ticket","title":"Te asignaron la solicitud #{numero}","body":"{asunto}"}]', false, null),
('ticket_no_reply', 'Solicitud sin respuesta en 4 horas',
 'Avisa al responsable (o a la gerencia) si el cliente espera respuesta hace 4 horas.',
 'ticket_no_reply', '{"hours":4}', '{}',
 '[{"type":"notify","to":"roles","roles":["support","admin"],"kind":"ticket","title":"⏰ #{numero} sin respuesta hace 4 h","body":"{asunto} · {nombre}"}]', true, null),
('chat_unanswered', 'Chat sin responder en 5 minutos',
 'Avisa al equipo si un visitante lleva 5 minutos esperando en el chat.',
 'chat_unanswered', '{"minutes":5}', '{"channels":["web","whatsapp"]}',
 '[{"type":"notify","to":"roles","roles":["sales","support","admin"],"kind":"chat","title":"💬 {nombre} espera respuesta en el chat","body":"{mensaje}"}]', true, null),
('chat_offline_email', 'Respuesta del chat cuando el visitante se fue → correo',
 'Si respondiste y el visitante ya no estaba, le llega tu respuesta por correo.',
 'chat_reply_offline', '{}', '{}',
 '[{"type":"email","to":"contact","subject":"Te respondimos en el chat de Engynex","body":"Hola {primer_nombre}, te escribimos en el chat:\n\n{ultima_respuesta}\n\nPuedes seguir la conversación en engynex.com (se abre donde la dejaste) o respondiendo este correo.","cta_label":"Volver al chat","cta_url":"https://engynex.com/es"}]', true, null),
('lead_stale', 'Lead sin actividad en 7 días → tarea de seguimiento',
 'Crea una tarea para el asesor cuando un lead abierto lleva una semana quieto.',
 'lead_stale', '{"days":7}', '{"statuses":["contacted","meeting","proposal"]}',
 '[{"type":"task","assign_to":"owner","title":"Hacer seguimiento a {nombre}","due_minutes":1440}]', true, null),
('lead_won', 'Venta ganada → celebrar con el equipo',
 'Aviso a ventas y gerencia cuando se gana una oportunidad.',
 'lead_won', '{}', '{}',
 '[{"type":"notify","to":"roles","roles":["admin","sales"],"kind":"lead","title":"🎉 ¡Ganamos a {nombre}!","body":"{empresa}"}]', true, null),
('chat_started', 'Nueva conversación de chat → avisar',
 'Aviso en la campana cuando un visitante abre el chat.',
 'chat_started', '{}', '{}',
 '[{"type":"notify","to":"roles","roles":["sales","support","admin"],"kind":"chat","title":"Nueva conversación: {nombre}","body":"{mensaje}"}]', true, null);
