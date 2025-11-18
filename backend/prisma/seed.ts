import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@entrx.local';
  const adminPassword = 'Admin123!';
  const adminFirstName = 'Admin';
  const adminLastName = 'User';
  const adminRoleCode = 'ADMIN';
  const organizerAdminRoleCode = 'ORGANIZER_ADMIN';

  // 1. Ensure ADMIN role exists
  let adminRole = await prisma.roles.findFirst({ where: { code: adminRoleCode } });
  if (!adminRole) {
    adminRole = await prisma.roles.create({
      data: {
        code: adminRoleCode,
        name: 'Administrator',
        description: 'Superuser with full access',
        is_active: true,
      },
    });
    console.log('Created ADMIN role');
  } else {
    console.log('ADMIN role already exists');
  }

  // 2. Create admin user if not exists
  let adminUser = await prisma.users.findFirst({ where: { email: adminEmail } });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.users.create({
      data: {
        email: adminEmail,
        first_name: adminFirstName,
        last_name: adminLastName,
        password: hashedPassword,
        is_active: true,
        email_verified: true,
      },
    });
    console.log('Created admin user');
  } else {
    console.log('Admin user already exists');
  }

  // 3. Assign ADMIN role to user if not already assigned
  const userRole = await prisma.user_roles.findFirst({
    where: {
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  });
  if (!userRole) {
    await prisma.user_roles.create({
      data: {
        user_id: adminUser.id,
        role_id: adminRole.id,
        status: 'ACTIVE',
      },
    });
    console.log('Assigned ADMIN role to admin user');
  } else {
    console.log('Admin user already has ADMIN role');
  }

  // Ensure ORGANIZER_ADMIN role exists
  let organizerAdminRole = await prisma.roles.findFirst({ where: { code: organizerAdminRoleCode } });
  if (!organizerAdminRole) {
    organizerAdminRole = await prisma.roles.create({
      data: {
        code: organizerAdminRoleCode,
        name: 'Admin Organisateur',
        description: 'Gestion complète organisation',
        is_active: true,
      },
    });
    console.log('Created ORGANIZER_ADMIN role');
  } else {
    console.log('ORGANIZER_ADMIN role already exists');
  }

  // Assign ORGANIZER_ADMIN role to user if not already assigned
  const userOrganizerAdminRole = await prisma.user_roles.findFirst({
    where: {
      user_id: adminUser.id,
      role_id: organizerAdminRole.id,
    },
  });
  if (!userOrganizerAdminRole) {
    await prisma.user_roles.create({
      data: {
        user_id: adminUser.id,
        role_id: organizerAdminRole.id,
        status: 'ACTIVE',
      },
    });
    console.log('Assigned ORGANIZER_ADMIN role to admin user');
  } else {
    console.log('Admin user already has ORGANIZER_ADMIN role');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 