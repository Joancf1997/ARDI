import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Conversation, Message } from '@/pages/Chats/chat.types';
import { MOCK_CONVERSATIONS } from '@/pages/Chats/chat.mock';

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>(MOCK_CONVERSATIONS);
  const activeConversationId = ref<string | null>(null);
  const isTyping = ref(false);

  const activeConversation = computed(() =>
    conversations.value.find((c) => c.id === activeConversationId.value) ?? null
  );

  const sortedConversations = computed(() =>
    [...conversations.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  );

  function selectConversation(id: string) {
    activeConversationId.value = id;
  }

  function createConversation(): string {
    const id = `conv-${Date.now()}`;
    const now = new Date().toISOString();
    conversations.value.unshift({
      id,
      title: 'New conversation',
      userId: 'user-1',
      createdAt: now,
      updatedAt: now,
      messages: [],
    });
    activeConversationId.value = id;
    return id;
  }

  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id ?? null;
    }
  }

  async function sendMessage(content: string) {
    if (!activeConversationId.value || !content.trim()) return;

    const conv = conversations.value.find((c) => c.id === activeConversationId.value);
    if (!conv) return;

    const now = new Date().toISOString();
    const nextSeq = (conv.messages.at(-1)?.sequence ?? 0) + 1;

    // Append user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conv.id,
      sequence: nextSeq,
      role: 'USER',
      type: 'CHAT',
      content,
      format: 'TEXT',
      createdAt: now,
    };
    conv.messages.push(userMsg);
    conv.updatedAt = now;

    // Auto-generate title from the first user message
    if (conv.messages.filter((m) => m.role === 'USER').length === 1) {
      conv.title = content.length > 45 ? content.slice(0, 45) + '…' : content;
    }

    // Simulate assistant typing
    isTyping.value = true;
    await new Promise((r) => setTimeout(r, 1400));
    isTyping.value = false;

    const assistantMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      conversationId: conv.id,
      sequence: nextSeq + 1,
      role: 'ASSISTANT',
      type: 'CHAT',
      content:
        "I've received your message and I'm processing your request. This is a **mock response** — the real AI agent will be connected in the next phase.\n\nHere's what I would typically do:\n1. Analyze your query\n2. Query the relevant data sources\n3. Apply the appropriate reasoning chain\n4. Return a structured response\n\nStay tuned! 🚀",
      format: 'MARKDOWN',
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(assistantMsg);
    conv.updatedAt = assistantMsg.createdAt;
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    sortedConversations,
    isTyping,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
  };
});
