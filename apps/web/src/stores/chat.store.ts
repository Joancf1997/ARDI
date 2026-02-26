import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { Conversation, Message, UserMessage, MessageRole } from '@/pages/Chats/chat.types';
import { chatService } from '@/services/chat.service';

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | null>(null);
  const activeConversation = ref<Conversation | null>(null);
  const isTyping = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  watch(activeConversationId, async (newId) => {
    if (newId) {
      try {
        activeConversation.value = await loadConversationMessages(newId);
      } catch (err) {
        console.error("Failed to sync messages for conversation:", newId);
      }
    }
  }, { immediate: false });


  const sortedConversations = computed(() =>
    [...conversations.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  );

  async function fetchConversations() {
    isLoading.value = true;
    error.value = null;

    try {
      const res = await chatService.getConversations();
      conversations.value = res.data;
      pagination.value = res.pagination;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch conversations';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function selectConversation(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      const conv = await chatService.getConversation(id);
      activeConversationId.value = conv.id;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to select conversation';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createConversation(conTitle?: string) {
    isLoading.value = true;
    error.value = null;

    try {
      let title = conTitle ? conTitle : 'New Conversation';
      const conv = await chatService.createConversation({ title });
      conversations.value.unshift(conv);
      activeConversationId.value = conv.id;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create conversation';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateConversationTitle(id: string, title: string) {
    isLoading.value = true;
    error.value = null;

    try {
      await chatService.updateConversationTitle(id, title);
      activeConversationId.value = id;
      await fetchConversations();
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to update conversation title';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteConversation(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      await chatService.deleteConversation(id);
      await fetchConversations();
      if (activeConversationId.value === id) {
        activeConversationId.value = conversations.value[0]?.id ?? null;
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to delete conversation';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadConversationMessages(id: string): Promise<Conversation & { messages: Message[] }> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await chatService.getConversation(id);
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to load conversation messages';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendMessage(content: string) {
    if (!activeConversationId.value || !content.trim()) return;
    if (!activeConversation.value) return;

    const nextSeq = (activeConversation.value.messages?.at(-1)?.sequence ?? 0) + 1;

    const userMsgPayload: any = {
      conversationId: activeConversation.value.id,
      sequence: nextSeq,
      role: 'USER',
      type: 'CHAT',
      content,
      format: 'TEXT',
    };

    try {
      isTyping.value = true;
      let streamedAssistantMsg: Message | null = null;

      await chatService.sendMessageStream(
        activeConversation.value.id,
        userMsgPayload,
        (chunk) => {
          if (!activeConversation.value) return;
          if (!activeConversation.value.messages) {
            activeConversation.value.messages = [];
          }

          if (chunk.type === 'user_message' || chunk.type === 'agent_message') {
            activeConversation.value.messages.push(chunk.message);
          } else if (chunk.type === 'agent_message_start') {
            streamedAssistantMsg = chunk.message;
            activeConversation.value.messages.push(streamedAssistantMsg!);
          } else if (chunk.type === 'agent_message_chunk') {
            if (streamedAssistantMsg && streamedAssistantMsg.id === chunk.messageId) {
              streamedAssistantMsg.content += chunk.delta;
            }
          }
        }
      );
    } catch (err: any) {
      error.value = err.message || 'Failed to send message';
      throw err;
    } finally {
      isTyping.value = false;
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    sortedConversations,
    isTyping,
    error,
    updateConversationTitle,
    fetchConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
  };
});
