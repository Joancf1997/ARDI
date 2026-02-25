import { PrismaClient, AgentType, UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {

  console.log('🌱 Starting Agent System Seed')

  //////////////////////////////////////////////////////
  // CLEAN ORDER (FK SAFE)
  //////////////////////////////////////////////////////

  await prisma.messageChunk.deleteMany()
  await prisma.toolCall.deleteMany()
  await prisma.runStep.deleteMany()
  await prisma.message.deleteMany()
  await prisma.agentRun.deleteMany()
  await prisma.tool.deleteMany()
  await prisma.agent.deleteMany()
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
  // DEFAULT AGENT
  //////////////////////////////////////////////////////

  const agent = await prisma.agent.create({
    data: {
      name: 'Main Assistant',
      type: AgentType.CHAT_AGENT,
      version: 'v1.0'
    }
  })

  console.log('🤖 Default agent created')

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
  ])

  console.log(`🧰 Created ${tools.length} initial tool`)

  //////////////////////////////////////////////////////
  // INITIAL CONVERSATION
  //////////////////////////////////////////////////////

  const conversation = await prisma.conversation.create({
    data: {
      title: 'Initial Conversation',
      userId: admin.id
    }
  })

  console.log('Initial conversation created')

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