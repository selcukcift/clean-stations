// accessoriesService.js
// Implements dynamic accessory data logic per Coding Prompt Chains v5 - Hybrid Backend
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Fetch accessory categories (subcategories under "ACCESSORY LIST" category "720")
 * See v5 Coding Prompt Chains, Prompt 2.2
 */
async function getAccessoryCategories() {
  // Find subcategories under category code '720' (ACCESSORY LIST)
  return prisma.category.findMany({
    where: {
      parentCode: '720',
    },
    select: {
      code: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Fetch accessories (assemblies) for a given subcategory
 * See v5 Coding Prompt Chains, Prompt 2.2
 */
async function getAccessoriesByCategory(categoryCode) {
  return prisma.assembly.findMany({
    where: {
      subcategoryCode: categoryCode,
    },
    select: {
      assemblyId: true,
      name: true,
      description: true,
      partNumber: true,
      // Add more fields as needed
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Fetch all accessories with optional filtering
 * See v5 Coding Prompt Chains, Prompt 2.2
 */
async function getAllAccessories({ searchTerm, categoryFilter }) {
  const where = {}
  if (categoryFilter) {
    where.subcategoryCode = categoryFilter
  }
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { partNumber: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ]
  }
  return prisma.assembly.findMany({
    where,
    select: {
      assemblyId: true,
      name: true,
      description: true,
      partNumber: true,
      subcategoryCode: true,
    },
    orderBy: { name: 'asc' },
  })
}

module.exports = {
  getAccessoryCategories,
  getAccessoriesByCategory,
  getAllAccessories,
} 