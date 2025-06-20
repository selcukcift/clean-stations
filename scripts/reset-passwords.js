const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    console.log('Resetting all user passwords to password123...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Update all users with the same password
    const result = await prisma.user.updateMany({
      data: {
        passwordHash: hashedPassword
      }
    });
    
    console.log(`✅ Updated passwords for ${result.count} users`);
    
    // Show all users
    const users = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        fullName: true
      }
    });
    
    console.log('\n📝 All users now have password: password123\n');
    console.log('Users in database:');
    console.table(users);
    
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();