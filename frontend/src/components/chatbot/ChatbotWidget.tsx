import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Paperclip,
  Bot,
  User,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Tag,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useChatbotStore, type ChatAttachment, type ChatMessage, type ChatOption, type ChatPropertyListing } from '../../store/chatbotStore';
import { getBotResponse } from '../../services/chatbotService';

/* ─── Helpers ─────────────────────────────────────────────────── */

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function humanFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';

function fileToAttachment(file: File): Promise<ChatAttachment> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const isImage = file.type.startsWith('image/');
      resolve({
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: isImage ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'document',
        name: file.name,
        url: reader.result as string,
        size: file.size,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  });
}

/* ─── Simple Markdown renderer ────────────────────────────────── */

function renderMarkdown(text: string) {
  // Convert markdown to JSX-safe HTML string, then dangerouslySetInnerHTML
  let html = text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    // Tables (GFM-style)
    .replace(
      /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g,
      (_, header, rows) => {
        const ths = header.split('|').filter(Boolean).map((h: string) =>
          `<th class="px-3 py-1.5 text-left font-semibold text-xs text-white/80 border-b border-white/10">${h.trim()}</th>`
        ).join('');
        const trs = rows.trim().split('\n').map((row: string) => {
          const tds = row.split('|').filter(Boolean).map((d: string) =>
            `<td class="px-3 py-1.5 text-xs text-slate-300 border-b border-white/[0.05]">${d.trim()}</td>`
          ).join('');
          return `<tr class="hover:bg-white/[0.03]">${tds}</tr>`;
        }).join('');
        return `<div class="overflow-x-auto my-2"><table class="w-full text-left"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
      }
    )
    // Bullet list items
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc text-slate-300 text-xs leading-relaxed">$1</li>')
    // Numbered list
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300 text-xs leading-relaxed">$1</li>')
    // Wrap consecutive <li> in <ul>/<ol>
    .replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="space-y-0.5 my-1">$1</ul>')
    // Newlines → breaks (excluding inside tags)
    .replace(/\n/g, '<br/>');

  return html;
}

/* ─── Attachment Preview Chip ──────────────────────────────────── */

function AttachChip({
  att,
  onRemove,
}: {
  att: ChatAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-white/[0.08] border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 max-w-[160px]">
      {att.type === 'image' ? (
        <img src={att.url} alt={att.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
      ) : (
        <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
      )}
      <span className="truncate flex-1">{att.name}</span>
      <button
        onClick={onRemove}
        className="text-slate-500 hover:text-red-400 flex-shrink-0 ml-1"
        aria-label="Remove attachment"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─── Attachment in Message ────────────────────────────────────── */

function MessageAttachment({ att }: { att: ChatAttachment }) {
  if (att.type === 'image') {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-w-[200px]">
        <img src={att.url} alt={att.name} className="w-full object-cover" />
        <div className="px-2 py-1 bg-black/20 flex items-center gap-1 text-[10px] text-slate-400">
          <ImageIcon className="w-3 h-3" />
          <span className="truncate">{att.name}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 max-w-[220px]">
      <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{att.name}</p>
        <p className="text-[10px] text-slate-500">{humanFileSize(att.size)}</p>
      </div>
    </div>
  );
}

/* ─── Typing Indicator ─────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-brand-400" />
      </div>
      <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Status badge colours ────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  active:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pending:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sold:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  coming_soon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

/* ─── Mini Property Card ───────────────────────────────────────── */

function PropertyCard({
  listing,
  onAsk,
}: {
  listing: ChatPropertyListing;
  onAsk: (q: string) => void;
}) {
  const img = listing.images.find((i) => i.isPrimary)?.url ?? listing.images[0]?.url;
  const statusStyle = STATUS_STYLES[listing.status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  const statusLabel = listing.status.replace('_', ' ');
  const listingUrl = `/properties/${listing._id}`;

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] transition-colors group">
      {/* Image — clicking opens the listing page */}
      <a href={listingUrl} target="_blank" rel="noopener noreferrer" className="block relative h-[120px] overflow-hidden">
        {img ? (
          <img src={img} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-600" />
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide border ${statusStyle}`}>
          {statusLabel}
        </span>
        {/* Days on market */}
        {listing.daysOnMarket > 0 && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white backdrop-blur-sm">
            {listing.daysOnMarket}d on market
          </span>
        )}
      </a>

      {/* Info */}
      <div className="p-2.5">
        {/* Price + type */}
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-bold text-white leading-tight">
            ${listing.price.toLocaleString()}
          </p>
          <span className="flex items-center gap-0.5 text-[9px] text-slate-500 capitalize bg-white/[0.05] px-1.5 py-0.5 rounded-full border border-white/[0.06] flex-shrink-0">
            <Tag className="w-2 h-2" />{listing.propertyType}
          </span>
        </div>

        {/* Title */}
        <p className="text-[11px] text-slate-300 leading-tight mt-0.5 line-clamp-1">{listing.title}</p>

        {/* Location */}
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500 truncate">
            {listing.neighbourhood ? `${listing.neighbourhood}, ` : ''}{listing.address.city}
          </span>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-3 mt-1.5 mb-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Bed className="w-2.5 h-2.5" />{listing.bedrooms} bd
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Bath className="w-2.5 h-2.5" />{listing.bathrooms} ba
          </span>
          {listing.squareFeet && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Maximize2 className="w-2.5 h-2.5" />{listing.squareFeet.toLocaleString()} ft²
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5">
          <a
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-semibold transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            View Listing
          </a>
          <button
            onClick={() => onAsk(`Tell me more about ${listing.title}`)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-[10px] font-medium transition-colors"
          >
            Ask Nova
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Property Listings Grid ───────────────────────────────────── */

function ListingsGrid({
  listings,
  onAsk,
}: {
  listings: ChatPropertyListing[];
  onAsk: (q: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? listings : listings.slice(0, 3);

  return (
    <div className="mt-2 space-y-2">
      {visible.map((l) => (
        <PropertyCard key={l._id} listing={l} onAsk={onAsk} />
      ))}
      {listings.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-[11px] text-brand-400 hover:text-brand-300 font-medium border border-brand-500/20 rounded-xl hover:bg-brand-500/5 transition-colors"
        >
          Show {listings.length - 3} more listings ↓
        </button>
      )}
    </div>
  );
}

/* ─── Option List Row ──────────────────────────────────────────── */

function OptionList({
  options,
  onSelect,
}: {
  options: ChatOption[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03] divide-y divide-white/[0.06]">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt.value)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-500/10 active:bg-brand-500/20 transition-colors group"
        >
          {/* Icon */}
          <span className="text-base flex-shrink-0 w-6 text-center leading-none">{opt.icon ?? '•'}</span>
          {/* Labels */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white group-hover:text-brand-300 transition-colors leading-tight">
              {opt.label}
            </p>
            {opt.description && (
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{opt.description}</p>
            )}
          </div>
          {/* Arrow */}
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-brand-400 flex-shrink-0 transition-colors" />
        </button>
      ))}
    </div>
  );
}

/* ─── Single Message Bubble ────────────────────────────────────── */

function MessageBubble({
  msg,
  onQuickReply,
}: {
  msg: ChatMessage;
  onQuickReply: (text: string) => void;
}) {
  const isBot = msg.role === 'assistant';

  return (
    <div className={`flex items-end gap-2 mb-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 self-start mt-0.5 ${
          isBot
            ? 'bg-brand-500/20 border border-brand-500/30'
            : 'bg-slate-700 border border-white/10'
        }`}
      >
        {isBot ? (
          <Bot className="w-3.5 h-3.5 text-brand-400" />
        ) : (
          <User className="w-3.5 h-3.5 text-slate-300" />
        )}
      </div>

      <div className={`flex flex-col gap-1 ${isBot ? 'w-[88%]' : 'max-w-[82%] items-end'}`}>
        {/* Bubble */}
        <div
          className={`relative px-3.5 py-2.5 text-xs leading-relaxed ${
            isBot
              ? 'bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-sm text-slate-200 w-full'
              : 'bg-brand-500 rounded-2xl rounded-br-sm text-white shadow-lg shadow-brand-500/20'
          }`}
        >
          {isBot ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}

          {/* Attachments */}
          {msg.attachments?.map((att) => (
            <MessageAttachment key={att.id} att={att} />
          ))}

          {/* Property listings grid */}
          {isBot && msg.listings && msg.listings.length > 0 && (
            <ListingsGrid listings={msg.listings} onAsk={onQuickReply} />
          )}

          {/* Selectable options list — shown inside the bubble */}
          {isBot && msg.options && msg.options.length > 0 && (
            <OptionList options={msg.options} onSelect={onQuickReply} />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.timestamp)}</span>

        {/* Quick Replies (pill buttons, used as fallback when no options) */}
        {isBot && !msg.options?.length && msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {msg.quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => onQuickReply(qr)}
                className="px-2.5 py-1 rounded-full border border-brand-500/40 text-brand-400 text-[10px] font-medium hover:bg-brand-500/10 transition-colors active:scale-95"
              >
                {qr}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Widget ──────────────────────────────────────────────── */

export default function ChatbotWidget() {
  const {
    messages,
    isOpen,
    isMinimized,
    isTyping,
    unreadCount,
    openChat,
    closeChat,
    minimizeChat,
    restoreChat,
    addMessage,
    setTyping,
    clearMessages,
    incrementUnread,
  } = useChatbotStore();

  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Scroll to bottom on new messages */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  /* Focus input when opening */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  /* Send message handler */
  const sendMessage = useCallback(
    async (text: string, attachments?: ChatAttachment[]) => {
      const trimmed = text.trim();
      if (!trimmed && (!attachments || attachments.length === 0)) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
        attachments: attachments ?? [],
      };
      addMessage(userMsg);
      setInput('');
      setPendingAttachments([]);

      // Typing indicator
      setTyping(true);
      try {
        const botMsg = await getBotResponse(trimmed, attachments);
        addMessage(botMsg);
        if (!isOpen) incrementUnread();
      } finally {
        setTyping(false);
      }
    },
    [addMessage, setTyping, isOpen, incrementUnread]
  );

  const handleSend = () => sendMessage(input, pendingAttachments);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (text: string) => sendMessage(text);

  /* File picker */
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const atts = await Promise.all(files.map(fileToAttachment));
    setPendingAttachments((prev) => [...prev, ...atts]);
    e.target.value = '';
  };

  /* Drag & drop */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    const atts = await Promise.all(files.map(fileToAttachment));
    setPendingAttachments((prev) => [...prev, ...atts]);
  };

  const removeAttachment = (id: string) =>
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));

  /* ── Render ── */
  return (
    <>
      {/* ── Floating Button ── */}
      {!isOpen && (
        <button
          onClick={openChat}
          aria-label="Open customer support chat"
          className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-2xl bg-brand-500 animate-ping opacity-30 group-hover:opacity-0" />
        </button>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          className={`fixed bottom-6 left-6 z-50 flex flex-col bg-slate-925 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 transition-all duration-300 ${
            isMinimized
              ? 'h-14 w-72 overflow-hidden'
              : 'w-[360px] sm:w-[380px] h-[600px] max-h-[calc(100vh-6rem)]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ background: 'rgba(13, 18, 30, 0.97)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-925 rounded-t-2xl">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 relative">
              <Bot className="w-4.5 h-4.5 text-brand-400" style={{ width: 18, height: 18 }} />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white">Nova</p>
                <Sparkles className="w-3 h-3 text-gold-400 opacity-80" />
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">NuVista AI · Online</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={isMinimized ? restoreChat : minimizeChat}
                title={isMinimized ? 'Restore' : 'Minimize'}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
              >
                {isMinimized ? (
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={closeChat}
                title="Close chat"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Messages Area ── */}
          {!isMinimized && (
            <>
              <div
                className={`flex-1 overflow-y-auto px-4 py-4 space-y-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative ${
                  isDragging
                    ? 'border-2 border-dashed border-brand-500/50 bg-brand-500/5'
                    : ''
                }`}
              >
                {isDragging && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <Paperclip className="w-10 h-10 text-brand-400 mb-2" />
                    <p className="text-sm font-medium text-brand-400">Drop files here</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onQuickReply={handleQuickReply}
                  />
                ))}

                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input Area ── */}
              <div className="flex-shrink-0 border-t border-white/[0.07] bg-slate-950/50 rounded-b-2xl">
                {/* Attachment chips */}
                {pendingAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                    {pendingAttachments.map((att) => (
                      <AttachChip
                        key={att.id}
                        att={att}
                        onRemove={() => removeAttachment(att.id)}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 px-3 py-2.5">
                  {/* Attach button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach image or document"
                    className="flex-shrink-0 p-2 rounded-xl text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors self-end mb-0.5"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPT}
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Text area */}
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Ask anything about real estate…"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/40 resize-none transition-colors leading-relaxed max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
                    style={{ scrollbarWidth: 'thin' }}
                    onInput={(e) => {
                      const t = e.currentTarget;
                      t.style.height = 'auto';
                      t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
                    }}
                  />

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && pendingAttachments.length === 0}
                    className="flex-shrink-0 p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 self-end mb-0.5 shadow-md shadow-brand-500/30"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer label */}
                <p className="text-center text-[9px] text-slate-700 pb-2">
                  Nova · NuVista AI Assistant · Real Estate Specialist
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
