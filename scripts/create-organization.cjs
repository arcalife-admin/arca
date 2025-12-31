const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createOrganization() {
  try {
    console.log('🏢 Creating organization...');

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: 'Dentiva Clinic',
        email: 'admin@dentiva.com',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345',
        website: 'https://dentiva.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Organization created:', organization.name);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@dentiva.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create some sample vendors
    const vendors = await prisma.vendor.createMany({
      data: [
        {
          name: 'Dental Supply Co.',
          contactPerson: 'John Smith',
          email: 'john@dentalsupply.com',
          phone: '+1-555-0101',
          address: '456 Supply St, Dental City, DC 12345',
          website: 'https://dentalsupply.com',
          organizationId: organization.id,
        },
        {
          name: 'Medical Equipment Inc.',
          contactPerson: 'Jane Doe',
          email: 'jane@medequip.com',
          phone: '+1-555-0102',
          address: '789 Equipment Ave, Med City, MC 12345',
          website: 'https://medequip.com',
          organizationId: organization.id,
        },
        {
          name: 'Dental Materials Ltd.',
          contactPerson: 'Bob Johnson',
          email: 'bob@dentalmaterials.com',
          phone: '+1-555-0103',
          address: '321 Materials Blvd, Dental Town, DT 12345',
          organizationId: organization.id,
        },
      ],
    });

    console.log('✅ Sample vendors created:', vendors.count);

    // Create some item categories
    const categories = await prisma.itemCategory.createMany({
      data: [
        {
          name: 'Dental Instruments',
          description: 'Hand instruments and tools',
          organizationId: organization.id,
        },
        {
          name: 'Dental Materials',
          description: 'Composite, amalgam, impression materials',
          organizationId: organization.id,
        },
        {
          name: 'Office Supplies',
          description: 'General office and administrative supplies',
          organizationId: organization.id,
        },
        {
          name: 'Disposables',
          description: 'Single-use items and consumables',
          organizationId: organization.id,
        },
      ],
    });

    console.log('✅ Sample categories created:', categories.count);

    console.log('\n🎉 Database setup complete!');
    console.log('📧 Admin login: admin@dentiva.com');
    console.log('🔑 Admin password: admin123');

  } catch (error) {
    console.error('❌ Error creating organization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOrganization(); 