<template>
  <AppLayout>
    <div class="chat-shell">

      <!-- ── Sidebar ───────────────────────────────────────── -->
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <!-- Sidebar top -->
        <div class="sidebar-top">
          <div class="brand" v-if="!sidebarCollapsed">
            <span class="brand-name">ARDI</span>
            <span class="brand-tag">AI Agent</span>
          </div>
          <Button
            :icon="sidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
            variant="text"
            rounded
            class="collapse-btn"
            @click="sidebarCollapsed = !sidebarCollapsed"
            v-tooltip.right="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          />
        </div>

        <div class="sidebar-actions" v-if="!sidebarCollapsed">
          <Button
            label="New Chat"
            icon="pi pi-plus"
            class="new-chat-btn"
            @click="chatStore.createConversation()"
          />
        </div>
        <div class="sidebar-actions" v-else>
          <Button
            icon="pi pi-plus"
            rounded
            class="new-chat-btn-icon"
            @click="chatStore.createConversation()"
            v-tooltip.right="'New chat'"
          />
        </div>

        <!-- Conversation list -->
        <nav class="conv-list" v-if="!sidebarCollapsed">
          <div class="conv-section-label">Recent</div>

          <div
            v-for="conv in chatStore.sortedConversations"
            :key="conv.id"
            class="conv-item"
            :class="{ active: chatStore.activeConversationId === conv.id }"
            @click="chatStore.selectConversation(conv.id)"
          >
            <div class="conv-item-content">
              <i class="pi pi-comments conv-icon" />
              <span class="conv-title">{{ conv.title ?? 'New conversation' }}</span>
            </div>
            <Button
              icon="pi pi-trash"
              variant="text"
              rounded
              size="small"
              severity="danger"
              class="conv-delete-btn"
              @click.stop="chatStore.deleteConversation(conv.id)"
              v-tooltip.right="'Delete'"
            />
          </div>

          <div v-if="chatStore.sortedConversations.length === 0" class="conv-empty">
            No conversations yet
          </div>
        </nav>

        <!-- Sidebar footer -->
        <div class="sidebar-footer" v-if="!sidebarCollapsed">
          <div class="user-pill">
            <Avatar icon="pi pi-user" size="small" class="user-avatar" />
            <div class="user-info">
              <span class="user-name">{{ authStore.user?.fullName ?? 'User' }}</span>
              <span class="user-role">{{ authStore.user?.role ?? '' }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- ── Main chat area ─────────────────────────────────── -->
      <main class="chat-main">

        <!-- Empty state when no conversation selected -->
        <div v-if="!chatStore.activeConversation" class="chat-empty-state">
          <div class="welcome-card">
            <div class="welcome-icon">
              <i class="pi pi-bolt" />
            </div>
            <h2>How can I help you today?</h2>
            <p>Select a conversation or start a new one to interact with ARDI, your AI data agent.</p>
            <div class="suggestion-chips">
              <button class="chip" @click="startWithSuggestion('Analyze enga consumption for last month')">
                <i class="pi pi-chart-line" /> Analyze consumption
              </button>
              <button class="chip" @click="startWithSuggestion('Analyze engagement by region')">
                <i class="pi pi-map-marker" /> Analyze Engagement By Region
              </button>
              <button class="chip" @click="startWithSuggestion('Show the topic consumption by time of the day')">
                <i class="pi pi-sun" /> Show The Topic Consumption By Time Of The Day
              </button>
            </div>
          </div>
        </div>

        <!-- Active conversation -->
        <template v-else>
          <!-- Chat header -->
          <header class="chat-header">
            <div class="chat-header-title">
              <i class="pi pi-comments" />
              <span>{{ chatStore.activeConversation.title ?? 'New conversation' }}</span>
            </div>
            <div class="chat-header-meta">
              <span class="msg-count">
                {{ chatStore.activeConversation.messages.length }} messages
              </span>
            </div>
          </header>

          <!-- Messages -->
          <div class="messages-area" ref="messagesAreaRef">
            <div
              v-for="msg in chatStore.activeConversation.messages"
              :key="msg.id"
              class="message-row"
              :class="msg.role.toLowerCase()"
            >
              <!-- Avatar -->
              <div class="msg-avatar" v-if="msg.role !== 'USER'">
                <div class="agent-avatar">
                  <i class="pi pi-bolt" />
                </div>
              </div>

              <!-- Bubble -->
              <div class="msg-bubble-wrapper" :class="{ 'user-side': msg.role === 'USER' }">
                <!-- Tool call / result chips -->
                <div v-if="msg.type === 'TOOL_CALL'" class="tool-badge tool-call">
                  <i class="pi pi-cog" />
                  <span>Tool call</span>
                  <code class="tool-name">{{ parseToolName(msg.content) }}</code>
                </div>
                <div v-else-if="msg.type === 'TOOL_RESULT'" class="tool-badge tool-result">
                  <i class="pi pi-check-circle" />
                  <span>Tool result</span>
                </div>

                <div
                  class="msg-bubble"
                  :class="[msg.role.toLowerCase(), msg.type.toLowerCase().replace('_', '-')]"
                >
                  <!-- Markdown / plain text -->
                  <div v-if="msg.format === 'MARKDOWN'" class="msg-markdown" v-html="renderMarkdown(msg.content)" />
                  <div v-else-if="msg.format === 'JSON'" class="msg-json">
                    <pre>{{ formatJson(msg.content) }}</pre>
                  </div>
                  <div v-else class="msg-text">{{ msg.content }}</div>
                </div>

                <div class="msg-meta">
                  <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
                  <span class="msg-role-badge">{{ msg.role }}</span>
                </div>
              </div>

              <!-- User avatar -->
              <div class="msg-avatar" v-if="msg.role === 'USER'">
                <Avatar icon="pi pi-user" size="small" class="user-chat-avatar" />
              </div>
            </div>

            <!-- Typing indicator -->
            <div class="message-row assistant" v-if="chatStore.isTyping">
              <div class="msg-avatar">
                <div class="agent-avatar">
                  <i class="pi pi-bolt" />
                </div>
              </div>
              <div class="typing-indicator">
                <span /><span /><span />
              </div>
            </div>

            <!-- Scroll anchor -->
            <div ref="scrollAnchorRef" />
          </div>

          <!-- Input area -->
          <div class="input-area">
            <div class="input-box">
              <Textarea
                v-model="inputText"
                placeholder="Message ARDI…"
                :autoResize="true"
                rows="1"
                class="chat-input"
                @keydown.enter.exact.prevent="handleSend"
                @keydown.enter.shift.exact="() => {}"
              />
              <Button
                icon="pi pi-send"
                rounded
                class="send-btn"
                :disabled="!inputText.trim() || chatStore.isTyping"
                @click="handleSend"
                v-tooltip.top="'Send (Enter)'"
              />
            </div>
            <p class="input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
          </div>
        </template>
      </main>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import AppLayout from '@/layouts/AppLayout.vue';


const chatStore = useChatStore();
const authStore = useAuthStore();
const router = useRouter();

const sidebarCollapsed = ref(false);
const inputText = ref('');
const messagesAreaRef = ref<HTMLElement | null>(null);
const scrollAnchorRef = ref<HTMLElement | null>(null);

// Auto-select first conversation on mount
onMounted(() => {
  if (!chatStore.activeConversationId && chatStore.sortedConversations.length > 0) {
    chatStore.selectConversation(chatStore.sortedConversations[0].id);
  }
});

// Scroll to bottom when messages change or typing state changes
watch(
  [() => chatStore.activeConversation?.messages.length, () => chatStore.isTyping],
  async () => {
    await nextTick();
    scrollAnchorRef.value?.scrollIntoView({ behavior: 'smooth' });
  }
);

// Also scroll when switching conversations
watch(
  () => chatStore.activeConversationId,
  async () => {
    await nextTick();
    if (messagesAreaRef.value) {
      messagesAreaRef.value.scrollTop = messagesAreaRef.value.scrollHeight;
    }
  }
);

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || chatStore.isTyping) return;
  inputText.value = '';
  await chatStore.sendMessage(text);
};

const startWithSuggestion = async (text: string) => {
  chatStore.createConversation();
  await nextTick();
  inputText.value = text;
  await handleSend();
};

// ── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const parseToolName = (content: string): string => {
  try {
    const parsed = JSON.parse(content);
    return parsed.tool ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

const formatJson = (content: string): string => {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
};

// Lightweight markdown rendering (bold, italic, headers, lists, code, tables)
const renderMarkdown = (text: string): string => {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Tables (basic)
    .replace(/\|(.+)\|/g, (line) => {
      if (line.includes('---')) return '';
      const cells = line.split('|').filter(Boolean).map((c) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Ordered list
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Newlines to <br> (excluding inside block elements)
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(<br\/>)?)+/g, (match) => `<ul>${match.replace(/<br\/>/g, '')}</ul>`);
  // Wrap <tr> in <table>
  html = html.replace(/(<tr>.*?<\/tr>(<br\/>)?)+/g, (match) => `<table class="md-table">${match.replace(/<br\/>/g, '')}</table>`);

  return html;
};
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────── */
.chat-shell {
  display: flex;
  height: 88vh;
  overflow: hidden;
  background: var(--p-surface-50, #f8fafc);
  font-family: 'Inter', sans-serif;
}

/* ── Sidebar ────────────────────────────────────────────────── */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: var(--p-surface-900);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, min-width 0.25s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1rem 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.brand {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

.brand-tag {
  font-size: 0.68rem;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.collapse-btn {
  color: rgba(255,255,255,0.5) !important;
  flex-shrink: 0;
}

.sidebar-actions {
  padding: 0.875rem 0.75rem;
}

.new-chat-btn {
  width: 100%;
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  color: #fff !important;
  font-size: 0.85rem;
  justify-content: flex-start;
  gap: 0.5rem;
  transition: background 0.15s;
}

.new-chat-btn:hover {
  background: rgba(255,255,255,0.14) !important;
}

.new-chat-btn-icon {
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  color: #fff !important;
}

/* Conversation list */
.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.conv-section-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255,255,255,0.3);
  padding: 0.5rem 0.5rem 0.25rem;
  margin-top: 0.25rem;
}

.conv-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 0.25rem;
  margin-bottom: 2px;
}

.conv-item:hover {
  background: rgba(255,255,255,0.07);
}

.conv-item.active {
  background: rgba(255,255,255,0.12);
}

.conv-item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.conv-icon {
  color: rgba(255,255,255,0.35);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.conv-title {
  color: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.conv-item:hover .conv-delete-btn {
  opacity: 1;
}

.conv-empty {
  color: rgba(255,255,255,0.25);
  font-size: 0.8rem;
  text-align: center;
  padding: 1.5rem 0;
}

/* Sidebar footer */
.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.user-pill:hover {
  background: rgba(255,255,255,0.07);
}

.user-avatar {
  background: rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.8) !important;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
}

.user-exit {
  color: rgba(255,255,255,0.25);
  font-size: 0.75rem;
}

/* ── Chat Main ────────────────────────────────────────────── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--p-surface-0, #ffffff);
}

/* Empty / Welcome state */
.chat-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.welcome-card {
  text-align: center;
  max-width: 560px;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 8px 24px rgba(99,102,241,0.35);
}

.welcome-icon i {
  font-size: 1.6rem;
  color: #fff;
}

.welcome-card h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  color: var(--p-surface-800, #1e293b);
}

.welcome-card p {
  color: var(--p-surface-500, #64748b);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  justify-content: center;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 999px;
  background: var(--p-surface-50, #f8fafc);
  color: var(--p-surface-600, #475569);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.chip:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99,102,241,0.05);
}

.chip i {
  font-size: 0.8rem;
}

/* Chat header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid var(--p-surface-100, #f1f5f9);
  background: var(--p-surface-0, #fff);
}

.chat-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--p-surface-700, #334155);
}

.chat-header-title i {
  color: #6366f1;
}

.chat-header-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.msg-count {
  font-size: 0.78rem;
  color: var(--p-surface-400, #94a3b8);
}

/* Messages */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  scroll-behavior: smooth;
}

.message-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  max-width: 100%;
}

.message-row.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  flex-shrink: 0;
}

.agent-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}

.agent-avatar i {
  font-size: 0.85rem;
  color: #fff;
}

.user-chat-avatar {
  background: var(--p-surface-200, #e2e8f0) !important;
  color: var(--p-surface-600, #475569) !important;
}

/* Bubble wrapper */
.msg-bubble-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 72%;
}

.msg-bubble-wrapper.user-side {
  align-items: flex-end;
}

/* Tool badges */
.tool-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  margin-bottom: 0.15rem;
  font-weight: 500;
}

.tool-call {
  background: rgba(251,146,60,0.12);
  color: #f97316;
  border: 1px solid rgba(251,146,60,0.25);
}

.tool-result {
  background: rgba(34,197,94,0.1);
  color: #16a34a;
  border: 1px solid rgba(34,197,94,0.2);
}

.tool-name {
  background: rgba(0,0,0,0.08);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-family: monospace;
}

/* Message bubble */
.msg-bubble {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  line-height: 1.6;
  word-break: break-word;
}

.msg-bubble.assistant, .msg-bubble.system {
  background: var(--p-surface-50, #f8fafc);
  color: var(--p-surface-800, #1e293b);
  border: 1px solid var(--p-surface-100, #f1f5f9);
  border-radius: 4px 12px 12px 12px;
}

.msg-bubble.user {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border-radius: 12px 4px 12px 12px;
}

.msg-bubble.tool {
  background: var(--p-surface-100, #f1f5f9);
  border-radius: 8px;
}

.msg-bubble.tool-call, .msg-bubble.tool-result {
  background: var(--p-surface-100, #f1f5f9);
}

/* Metadata under bubble */
.msg-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.msg-time {
  font-size: 0.7rem;
  color: var(--p-surface-400, #94a3b8);
}

.msg-role-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--p-surface-400, #94a3b8);
}

/* Markdown rendering */
.msg-markdown :deep(h1),
.msg-markdown :deep(h2),
.msg-markdown :deep(h3) {
  font-weight: 700;
  margin: 0.5rem 0 0.25rem;
}

.msg-markdown :deep(strong) {
  font-weight: 700;
}

.msg-markdown :deep(ul) {
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}

.msg-markdown :deep(code) {
  background: rgba(0,0,0,0.07);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.82em;
}

.msg-bubble.user .msg-markdown :deep(code) {
  background: rgba(255,255,255,0.2);
}

:deep(.md-table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
  font-size: 0.82rem;
}

:deep(.md-table td) {
  border: 1px solid var(--p-surface-200, #e2e8f0);
  padding: 0.3rem 0.6rem;
}

:deep(.md-table tr:nth-child(odd) td) {
  background: rgba(0,0,0,0.02);
}

/* JSON display */
.msg-json pre {
  font-family: monospace;
  font-size: 0.78rem;
  overflow-x: auto;
  white-space: pre-wrap;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.65rem 0.9rem;
  background: var(--p-surface-50, #f8fafc);
  border: 1px solid var(--p-surface-100, #f1f5f9);
  border-radius: 4px 12px 12px 12px;
}

.typing-indicator span {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6366f1;
  animation: bounce 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ── Input area ────────────────────────────────────────────── */
.input-area {
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid var(--p-surface-100, #f1f5f9);
  background: var(--p-surface-0, #fff);
}

.input-box {
  display: flex;
  align-items: flex-end;
  gap: 0.625rem;
  background: var(--p-surface-50, #f8fafc);
  border: 1.5px solid var(--p-surface-200, #e2e8f0);
  border-radius: 14px;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  transition: border-color 0.15s;
}

.input-box:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}

.chat-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  resize: none;
  font-size: 0.9rem;
  max-height: 160px;
  padding: 0.25rem 0 !important;
  line-height: 1.5;
}

.send-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
  border: none !important;
  width: 36px !important;
  height: 36px !important;
  box-shadow: 0 2px 8px rgba(99,102,241,0.3);
  transition: all 0.15s;
}

.send-btn:not(:disabled):hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99,102,241,0.45);
}

.send-btn:disabled {
  background: var(--p-surface-200, #e2e8f0) !important;
  box-shadow: none;
}

.input-hint {
  font-size: 0.72rem;
  color: var(--p-surface-400, #94a3b8);
  margin-top: 0.5rem;
  text-align: center;
}

.input-hint kbd {
  background: var(--p-surface-100, #f1f5f9);
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 3px;
  padding: 0.1rem 0.35rem;
  font-size: 0.68rem;
  font-family: inherit;
}
</style>
