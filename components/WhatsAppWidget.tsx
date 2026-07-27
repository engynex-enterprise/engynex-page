"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Send, X } from "lucide-react";
import { WhatsappIcon } from "./SocialIcons";
import { siteConfig } from "@/lib/site";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Msg = { from: "bot" | "user"; text: string };

export function WhatsAppWidget({ chat }: { chat: Dictionary["chat"] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: chat.greeting },
  ]);
  const [askedReply, setAskedReply] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll del chat (sin setState).
  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const pushUser = (text: string) => {
    setMessages((m) => [...m, { from: "user", text }]);
    setInput(text);
    if (!askedReply) {
      setAskedReply(true);
      setMessages((m) => [...m, { from: "bot", text: chat.reply }]);
    }
  };

  const sendToWhatsApp = () => {
    const text = input.trim() || chat.greeting;
    const url = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    // pointer-events-none en el contenedor: con el chat cerrado, su caja
    // (casi el ancho de la pantalla en móvil) interceptaba los toques sobre
    // los enlaces y botones que quedaban debajo.
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Panel */}
      <div
        role="dialog"
        aria-label={chat.title}
        aria-hidden={!open}
        className={cn(
          "mb-3 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right overflow-hidden rounded-3xl border border-navy-900/10 bg-white shadow-2xl transition-all duration-300 dark:border-white/10 dark:bg-navy-900",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3.5 text-white">
          <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-1 ring-white/25">
            <Image
              src="/images/logos/favico.png"
              alt="Engynex"
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#075E54] bg-[#25D366]" />
          </span>
          <div className="flex-1">
            <p className="font-extrabold leading-tight">{chat.title}</p>
            <p className="text-xs text-white/80">{chat.status}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={chat.close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div
          ref={bodyRef}
          className="max-h-72 space-y-2.5 overflow-y-auto bg-[#e9e4dc] px-4 py-4 dark:bg-navy-950"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.from === "user" ? "justify-end" : "justify-start",
              )}
            >
              <span
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  m.from === "user"
                    ? "rounded-br-sm bg-[#dcf8c6] text-navy-900 dark:bg-brand-green/25 dark:text-white"
                    : "rounded-bl-sm bg-white text-navy-800 dark:bg-navy-800 dark:text-ink-200",
                )}
              >
                {m.text}
              </span>
            </div>
          ))}

          {/* Respuestas rápidas */}
          {!askedReply && (
            <div className="flex flex-wrap gap-2 pt-1">
              {chat.quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => pushUser(q)}
                  className="rounded-full border border-brand-green/40 bg-white px-3 py-1.5 text-xs font-bold text-brand-green-dark transition-colors hover:bg-brand-green hover:text-navy-950 dark:bg-navy-800 dark:text-brand-green"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-navy-900/10 bg-white p-3 dark:border-white/10 dark:bg-navy-900">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendToWhatsApp()}
            placeholder={chat.placeholder}
            className="min-w-0 flex-1 rounded-full border border-navy-900/10 bg-slate-50 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-brand-green dark:border-white/10 dark:bg-navy-800 dark:text-white"
          />
          <button
            type="button"
            onClick={sendToWhatsApp}
            aria-label={chat.send}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-105"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? chat.close : chat.open}
        className="group pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/30 transition-transform hover:scale-110"
      >
        {!open && (
          <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.5s]" />
        )}
        {open ? (
          <X className="relative h-7 w-7" />
        ) : (
          <WhatsappIcon className="relative h-8 w-8" />
        )}
      </button>
    </div>
  );
}
