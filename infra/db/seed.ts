import {
  PrismaClient,
  AgentType,
  UserRole,
  MessageRole,
  MessageType,
  ContentFormat,
  RunStatus,
  
} from '@prisma/client'

import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {

  console.log('🌱 Starting Agent System Seed')

  //////////////////////////////////////////////////////
  // CLEAN DATABASE (FK SAFE ORDER)
  //////////////////////////////////////////////////////

  await prisma.messageChunk.deleteMany()
  await prisma.toolCall.deleteMany()
  await prisma.runStep.deleteMany()
  await prisma.message.deleteMany()
  await prisma.agentRun.deleteMany()
  await prisma.tool.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Database cleaned')

  //////////////////////////////////////////////////////
  // ADMIN USER
  //////////////////////////////////////////////////////

  const adminPassword = await bcrypt.hash('Admin123!', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@agent.local',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: UserRole.ADMIN,
      isActive: true
    }
  })

  console.log('✅ Admin user created')

  //////////////////////////////////////////////////////
  // DEFAULT AGENTS
  //////////////////////////////////////////////////////

  const plannerAgent = await prisma.agent.create({
    data: {
      name: 'Planner Agent',
      type: AgentType.PLANER_AGENT,
      version: 'v1.0'
    }
  })

  const responseAgent = await prisma.agent.create({
    data: {
      name: 'Response Agent',
      type: AgentType.RESPONSE_AGENT,
      version: 'v1.0'
    }
  })

  console.log('🤖 Default agents created')

  //////////////////////////////////////////////////////
  // DEFAULT TOOLS
  //////////////////////////////////////////////////////

  const tools = await Promise.all([
    prisma.tool.create({
      data: {
        name: 'get_system_time',
        description: 'Returns current server time',
        endpoint: '/api/tools/time',
        method: 'GET',
        schema: {}
      }
    }),

    prisma.tool.create({
      data: {
        name: 'echo',
        description: 'Echo input payload',
        endpoint: '/api/tools/echo',
        method: 'POST',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    })
  ])

  console.log(`🧰 Created ${tools.length} tools`)

  //////////////////////////////////////////////////////
  // INITIAL CONVERSATION
  //////////////////////////////////////////////////////

  const conversation = await prisma.conversation.create({
    data: {
      title: 'Initial Conversation',
      userId: admin.id
    }
  })

  console.log('💬 Conversation created')

  //////////////////////////////////////////////////////
  // USER MESSAGE (sequence = 1)
  //////////////////////////////////////////////////////

  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sequence: 1,
      role: MessageRole.USER,
      type: MessageType.CHAT,
      format: ContentFormat.TEXT,
      content: 'Hello assistant!'
    }
  })

  //////////////////////////////////////////////////////
  // AGENT RUN
  //////////////////////////////////////////////////////

  const run = await prisma.agentRun.create({
    data: {
      conversationId: conversation.id,
      agentId: responseAgent.id,
      status: RunStatus.COMPLETED,
      startedAt: new Date(),
      completedAt: new Date()
    }
  })

  console.log('⚙️ Initial agent run created')

  //////////////////////////////////////////////////////
  // RUN STEP TRACE
  //////////////////////////////////////////////////////

  await prisma.runStep.create({
    data: {
      runId: run.id,
      stepIndex: 1,
      action: 'generate_response',
      reasoning: 'Initial bootstrap response'
    }
  })

  //////////////////////////////////////////////////////
  // ASSISTANT MESSAGE (sequence = 2)
  //////////////////////////////////////////////////////

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      agentRunId: run.id,
      sequence: 2,
      role: MessageRole.ASSISTANT,
      type: MessageType.CHAT,
      format: ContentFormat.TEXT,
      content: 'Hello! System initialized successfully.'
    }
  })

  //////////////////////////////////////////////////////
  // STREAMING CHUNKS EXAMPLE
  //////////////////////////////////////////////////////

  await prisma.messageChunk.createMany({
    data: [
      {
        messageId: assistantMessage.id,
        sequence: 1,
        content: 'Hello!'
      },
      {
        messageId: assistantMessage.id,
        sequence: 2,
        content: ' System initialized successfully.'
      }
    ]
  })

  console.log('📡 Streaming chunks created')

  //////////////////////////////////////////////////////
  // TOOL CALL EXAMPLE
  //////////////////////////////////////////////////////

  await prisma.toolCall.create({
    data: {
      runId: run.id,
      toolId: tools[0].id,
      status: 'SUCCESS',
      arguments: {},
      result: {
        time: new Date().toISOString()
      }
    }
  })

  console.log('🧠 Tool call example created')

  //////////////////////////////////////////////////////
  // DONE
  //////////////////////////////////////////////////////

  console.log('\n✨ Seed completed successfully!')
  console.log('\nDefault credentials:')
  console.log('Admin → admin@agent.local / Admin123!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })