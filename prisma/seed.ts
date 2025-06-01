import { PrismaClient, PartType, Status, AssemblyType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create Categories
  const category1 = await prisma.category.upsert({
    where: { categoryId: 'CAT001' },
    update: {},
    create: {
      categoryId: 'CAT001',
      name: 'Standard Cleaning Stations',
      description: 'Pre-configured cleaning stations',
    },
  });

  const category2 = await prisma.category.upsert({
    where: { categoryId: 'CAT002' },
    update: {},
    create: {
      categoryId: 'CAT002',
      name: 'Custom Cleaning Solutions',
      description: 'Customizable cleaning station components',
    },
  });

  // Create Subcategories
  const subcategory1 = await prisma.subcategory.upsert({
    where: { subcategoryId: 'SUB001' },
    update: {},
    create: {
      subcategoryId: 'SUB001',
      name: 'Wall-Mounted Stations',
      description: 'Cleaning stations designed to be mounted on walls.',
      categoryId: category1.categoryId,
    },
  });

  const subcategory2 = await prisma.subcategory.upsert({
    where: { subcategoryId: 'SUB002' },
    update: {},
    create: {
      subcategoryId: 'SUB002',
      name: 'Frame Assemblies',
      description: 'Structural frames for cleaning stations.',
      categoryId: category2.categoryId,
    },
  });

  // Create Parts
  const part1 = await prisma.part.upsert({
    where: { partId: 'PART001' },
    update: {},
    create: {
      partId: 'PART001',
      name: 'Stainless Steel Tube 1m',
      manufacturerPartNumber: 'SSTUBE1000',
      type: PartType.COMPONENT,
      status: Status.ACTIVE,
      photoURL: 'http://example.com/sstube1000.jpg',
      technicalDrawingURL: 'http://example.com/sstube1000_drawing.pdf',
    },
  });

  const part2 = await prisma.part.upsert({
    where: { partId: 'PART002' },
    update: {},
    create: {
      partId: 'PART002',
      name: 'Mounting Bracket Type A',
      manufacturerPartNumber: 'MBRACKET-A',
      type: PartType.COMPONENT,
      status: Status.ACTIVE,
      photoURL: 'http://example.com/mbracket_a.jpg',
    },
  });

  const part3 = await prisma.part.upsert({
    where: { partId: 'PART003' },
    update: {},
    create: {
      partId: 'PART003',
      name: 'Cleaning Solution Concentrate 5L',
      manufacturerPartNumber: 'CSCONC5L',
      type: PartType.MATERIAL,
      status: Status.ACTIVE,
    },
  });

  // Create Assemblies
  const assembly1 = await prisma.assembly.upsert({
    where: { assemblyId: 'ASM001' },
    update: {},
    create: {
      assemblyId: 'ASM001',
      name: 'Basic Wall-Mount Frame',
      type: AssemblyType.SIMPLE,
      categoryCode: category1.categoryId,
      subcategoryCode: subcategory1.subcategoryId,
      workInstructionId: 'WI-WMF-001',
      qrData: 'ASM001_QR_DATA',
      // kitComponentsJson will be populated by creating AssemblyComponent entries
    },
  });

  const assembly2 = await prisma.assembly.upsert({
    where: { assemblyId: 'ASM002' },
    update: {},
    create: {
      assemblyId: 'ASM002',
      name: 'Advanced Cleaning Station Kit',
      type: AssemblyType.KIT,
      categoryCode: category1.categoryId,
      subcategoryCode: subcategory1.subcategoryId,
      workInstructionId: 'WI-ACSK-001',
      qrData: 'ASM002_QR_DATA',
      kitComponentsJson: JSON.stringify([ // Example for a KIT type assembly
        { partId: 'PART001', quantity: 2, notes: 'Main structural tubes' },
        { partId: 'PART002', quantity: 4, notes: 'Brackets for tubes' },
        { partId: 'PART003', quantity: 1, notes: 'Starter cleaning solution' }
      ]),
    },
  });
  
  // Create AssemblyComponents for ASM001 (Basic Wall-Mount Frame)
  // This assembly is made of 2 units of PART001 and 4 units of PART002
  await prisma.assemblyComponent.createMany({
    data: [
      { parentAssemblyId: assembly1.assemblyId, childPartId: part1.partId, quantity: 2, notes: 'Vertical supports' },
      { parentAssemblyId: assembly1.assemblyId, childPartId: part2.partId, quantity: 4, notes: 'Mounting points' },
    ],
    skipDuplicates: true, // Optional: useful if you might re-run the seed
  });

  // Associate assemblies with subcategories (many-to-many relation)
  await prisma.subcategory.update({
    where: { subcategoryId: subcategory1.subcategoryId },
    data: {
      assemblies: {
        connect: [{ assemblyId: assembly1.assemblyId }, { assemblyId: assembly2.assemblyId }],
      },
    },
  });

  await prisma.subcategory.update({
    where: { subcategoryId: subcategory2.subcategoryId },
    data: {
      assemblies: {
        connect: [{ assemblyId: assembly1.assemblyId }], // Example: Basic frame can also be a custom component
      },
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
