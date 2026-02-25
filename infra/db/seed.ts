import {
  PrismaClient,
  agent_type,
  user_role,
  message_role,
  message_type,
  content_format,
  run_status
} from '@prisma/client'

import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {

  console.log('🌱 Starting Agent System Seed')

  //////////////////////////////////////////////////////
  // CLEAN DATABASE (FK SAFE ORDER)
  //////////////////////////////////////////////////////

  await prisma.message_chunk.deleteMany()
  await prisma.tool_call.deleteMany()
  await prisma.run_step.deleteMany()
  await prisma.message.deleteMany()
  await prisma.agent_run.deleteMany()
  await prisma.tool.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.refresh_token.deleteMany()
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
      password_hash: adminPassword,
      full_name: 'System Administrator',
      role: user_role.ADMIN,
      is_active: true
    }
  })

  console.log('✅ Admin user created')

  //////////////////////////////////////////////////////
  // DEFAULT AGENTS
  //////////////////////////////////////////////////////

  const plannerAgent = await prisma.agent.create({
    data: {
      name: 'Planner Agent',
      type: agent_type.PLANER_AGENT,
      version: 'v1.0'
    }
  })

  const responseAgent = await prisma.agent.create({
    data: {
      name: 'Response Agent',
      type: agent_type.RESPONSE_AGENT,
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
      user_id: admin.id
    }
  })

  console.log('💬 Conversation created')

  //////////////////////////////////////////////////////
  // USER MESSAGE (sequence = 1)
  //////////////////////////////////////////////////////

  const userMessage = await prisma.message.create({
    data: {
      conversation_id: conversation.id,
      sequence: 1,
      role: message_role.USER,
      type: message_type.CHAT,
      format: content_format.TEXT,
      content: 'Hello assistant!'
    }
  })

  //////////////////////////////////////////////////////
  // AGENT RUN
  //////////////////////////////////////////////////////

  const run = await prisma.agent_run.create({
    data: {
      conversation_id: conversation.id,
      agent_id: responseAgent.id,
      status: run_status.COMPLETED,
      model_name: 'gpt-bootstrap',
      provider: 'local',
      input_tokens: 10,
      output_tokens: 20,
      total_tokens: 30,
      cost_usd: 0,
      started_at: new Date(),
      completed_at: new Date()
    }
  })

  console.log('⚙️ Initial agent run created')

  //////////////////////////////////////////////////////
  // RUN STEP TRACE
  //////////////////////////////////////////////////////

  await prisma.run_step.create({
    data: {
      run_id: run.id,
      step_index: 1,
      action: 'generate_response',
      reasoning: 'Initial bootstrap response'
    }
  })

  //////////////////////////////////////////////////////
  // ASSISTANT MESSAGE (sequence = 2)
  //////////////////////////////////////////////////////

  const assistantMessage = await prisma.message.create({
    data: {
      conversation_id: conversation.id,
      agent_run_id: run.id,
      sequence: 2,
      role: message_role.ASSISTANT,
      type: message_type.CHAT,
      format: content_format.TEXT,
      content: 'Hello! System initialized successfully.'
    }
  })

  //////////////////////////////////////////////////////
  // STREAMING CHUNKS EXAMPLE
  //////////////////////////////////////////////////////

  await prisma.message_chunk.createMany({
    data: [
      {
        message_id: assistantMessage.id,
        sequence: 1,
        content: 'Hello!'
      },
      {
        message_id: assistantMessage.id,
        sequence: 2,
        content: ' System initialized successfully.'
      }
    ]
  })

  console.log('📡 Streaming chunks created')

  //////////////////////////////////////////////////////
  // TOOL CALL EXAMPLE
  //////////////////////////////////////////////////////

  await prisma.tool_call.create({
    data: {
      run_id: run.id,
      tool_id: tools[0].id,
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