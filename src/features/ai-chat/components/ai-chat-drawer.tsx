import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  History,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  X,
  MessageSquare,
  MessagesSquare,
} from 'lucide-react';
import { useAIChat } from '../hooks/use-ai-chat';
import { AIChatFloatingButton } from './ai-chat-floating-button';
import { AIChatMessageItem } from './ai-chat-message-item';
import { cn } from '@/lib/utils';

const STARTER_PROMPTS = [
  'Bahan baku apa saja yang stoknya mau habis?',
  'Menu mana yang margin keuntungannya paling rendah?',
  'Bagaimana ringkasan penjualan dan laba kotor toko?',
  'Bahan apa yang menyerap biaya pengeluaran terbesar?',
];

export function AIChatFloatingDrawer() {
  const {
    isOpen,
    setIsOpen,
    conversations,
    activeConversation,
    isLoadingHistory,
    isLoadingActive,
    isSending,
    error,
    quotaExceeded,
    quotaMessage,
    selectConversation,
    startNewChat,
    sendMessage,
    retryLastMessage,
    deleteConversation,
  } = useAIChat();

  const [inputMessage, setInputMessage] = React.useState('');
  const [showHistoryView, setShowHistoryView] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectStarter = (promptText: string) => {
    setInputMessage('');
    sendMessage(promptText);
  };

  const isNewSession = !activeConversation || activeConversation.messages.length === 0;

  return (
    <>
      <AIChatFloatingButton onClick={() => setIsOpen(true)} isOpen={isOpen} />

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col p-0 h-full bg-background border-l border-border/80 shadow-2xl z-50"
          data-testid="ai-chat-drawer"
        >
          {/* Header */}
          <SheetHeader className="p-3.5 border-b border-border/60 bg-card/60 backdrop-blur shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2 min-w-0">
              {showHistoryView ? (
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="ai-back-btn"
                  className="h-8 w-8 rounded-lg cursor-pointer shrink-0"
                  onClick={() => setShowHistoryView(false)}
                  title="Kembali ke chat"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="ai-history-btn"
                  className="h-8 px-2 text-xs gap-1.5 rounded-lg border-border/70 cursor-pointer shrink-0"
                  onClick={() => setShowHistoryView(true)}
                  title="Daftar sesi percakapan"
                >
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">Sesi</span>
                  {conversations.length > 0 && (
                    <span className="bg-primary/10 text-primary font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                      {conversations.length}
                    </span>
                  )}
                </Button>
              )}

              <div className="min-w-0 pl-1">
                <SheetTitle className="text-sm font-semibold leading-tight truncate">
                  {showHistoryView
                    ? 'Riwayat Sesi Percakapan'
                    : isNewSession
                    ? 'Percakapan Baru'
                    : activeConversation.title || 'Asisten Bisnis AI'}
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground truncate">
                  {showHistoryView
                    ? `${conversations.length} sesi percakapan tersimpan`
                    : isNewSession
                    ? 'Sesi bersih • Analisis data toko aktif'
                    : 'Sesi aktif • Data faktual toko'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setIsOpen(false)}
                title="Tutup asisten AI"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Body Section */}
          <div className="flex-1 overflow-y-auto flex flex-col p-4">
            {showHistoryView ? (
              /* History Sessions View */
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    startNewChat();
                    setShowHistoryView(false);
                  }}
                  data-testid="ai-panel-new-chat-btn"
                  className="w-full justify-center gap-2 mb-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95 rounded-xl h-10 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Mulai Sesi Percakapan Baru
                </Button>

                {isLoadingHistory ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm">Memuat daftar sesi...</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <MessagesSquare className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Belum ada riwayat percakapan tersimpan</p>
                    <p className="text-xs text-muted-foreground/80 max-w-xs">
                      Setiap pertanyaan baru akan membentuk sesi percakapan mandiri yang dapat Anda tinjau kembali di sini.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = activeConversation?.id === conv.id;
                    return (
                      <div
                        key={conv.id}
                        data-testid={`ai-history-item-${conv.id}`}
                        onClick={() => {
                          selectConversation(conv.id);
                          setShowHistoryView(false);
                        }}
                        className={cn(
                          "group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left relative",
                          isActive
                            ? "bg-primary/10 border-primary/40 text-foreground ring-1 ring-primary/30"
                            : "bg-card hover:bg-accent/40 border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            <p className="text-sm font-semibold text-foreground truncate">
                              {conv.title || 'Percakapan Tanpa Judul'}
                            </p>
                            {isActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary text-primary-foreground shrink-0">
                                Aktif
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-xs text-muted-foreground truncate mt-1 pl-5.5">
                              {conv.last_message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 mt-1.5 pl-5.5">
                            <span>
                              {new Date(conv.updated_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {conv.message_count > 0 && (
                              <>
                                <span>•</span>
                                <span>{conv.message_count} pesan</span>
                              </>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`ai-delete-btn-${conv.id}`}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          title="Hapus sesi ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Active Chat View */
              <div className="flex-1 flex flex-col justify-between">
                {isLoadingActive ? (
                  <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm">Memuat sesi percakapan...</span>
                  </div>
                ) : isNewSession ? (
                  /* Empty Welcome State */
                  <div className="py-8 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md mb-3">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-base">
                      Halo! Ada yang bisa saya bantu?
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                      Saya dapat menganalisis stok bahan, menghitung HPP resep, meninjau penjualan, dan memberi saran bisnis berdasarkan data toko Anda.
                    </p>

                    {/* Starter Prompt Chips */}
                    <div className="w-full mt-6 flex flex-col gap-2">
                      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase text-left">
                        Pertanyaan Cepat
                      </p>
                      {STARTER_PROMPTS.map((promptText, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectStarter(promptText)}
                          className="text-left text-xs p-2.5 rounded-xl border border-border/70 bg-card hover:bg-accent/60 hover:border-primary/50 text-foreground transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <span>{promptText}</span>
                          <Send className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Message Bubbles */
                  <div className="flex flex-col">
                    {activeConversation.messages.map((msg) => (
                      <AIChatMessageItem
                        key={msg.id}
                        message={msg}
                        onRetry={retryLastMessage}
                        isRetrying={isSending}
                      />
                    ))}

                    {isSending && (
                      <div className="flex items-center gap-3 my-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-2xs">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted/70 text-foreground border border-border/60 rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span>Memproses...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quota Exceeded / Error Banner */}
          {quotaExceeded && (
            <div className="mx-4 mb-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Batas Kuota AI Tercapai</p>
                <p className="mt-0.5 leading-relaxed">{quotaMessage}</p>
              </div>
            </div>
          )}

          {error && !quotaExceeded && (
            <div className="mx-4 mb-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="flex-1 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Input Box Footer */}
          {!showHistoryView && (
            <div className="p-3 border-t border-border/60 bg-card/60 backdrop-blur shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  data-testid="ai-new-chat-btn"
                  onClick={startNewChat}
                  disabled={isSending || isNewSession}
                  className="h-10 w-10 rounded-xl border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent/60 shrink-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Mulai sesi percakapan baru"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pertanyaan untuk asisten bisnis AI..."
                  rows={1}
                  disabled={isSending || quotaExceeded}
                  data-testid="ai-chat-input"
                  className="flex-1 resize-none bg-background rounded-xl border border-border/80 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 min-h-[42px] max-h-24"
                />

                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending || quotaExceeded}
                  size="icon"
                  data-testid="ai-chat-send-btn"
                  className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground/70 mt-2">
                Asisten AI menganalisis data toko secara real-time. Periksa kembali keputusan bisnis penting.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
