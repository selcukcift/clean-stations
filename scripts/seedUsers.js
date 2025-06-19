const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('Seeding users...');
    
    const users = [
      {
        username: 'admin',
        email: 'admin@torvan.local',
        fullName: 'System Administrator',
        role: 'ADMIN',
        initials: 'ADM',
        password: 'admin123'
      },
      {
        username: 'qc',
        email: 'qc@torvan.local',
        fullName: 'Quality Control',
        role: 'QC_PERSON',
        initials: 'QC',
        password: 'qc123'
      },
      {
        username: 'prod',
        email: 'prod@torvan.local',
        fullName: 'Production Coordinator',
        role: 'PRODUCTION_COORDINATOR',
        initials: 'PC',
        password: 'prod123'
      },
      {
        username: 'assembler',
        email: 'assembler@torvan.local',
        fullName: 'Assembler User',
        role: 'ASSEMBLER',
        initials: 'ASM',
        password: 'assembler123'
      }
    ];
    
    for (const user of users) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: user.username },
            { email: user.email }
          ]
        }
      });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await prisma.user.create({
          data: {
            username: user.username,
            email: user.email,
            passwordHash: hashedPassword,
            fullName: user.fullName,
            role: user.role,
            initials: user.initials,
            isActive: true
          }
        });
        
        console.log(`✅ Created user: ${user.username} (${user.role}) - Password: ${user.password}`);
      } else {
        console.log(`⚠️ User already exists: ${user.username}`);
      }
    }
    
    // Check all users
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        fullName: true,
        role: true,
        initials: true
      }
    });
    
    console.log('\n📋 All users in database:');
    console.table(allUsers);
    
    const qcUsers = allUsers.filter(u => u.role === 'QC_PERSON');
    console.log('\n🔍 QC_PERSON users:');
    console.table(qcUsers);
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();