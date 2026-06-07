import { prisma } from '@/lib/prisma'
import { CLINIC_MEDICATION_SEED } from '@/lib/medications/seed-data'

export async function ensureClinicMedicationsSeeded(organizationId: string) {
  const count = await prisma.clinicMedication.count({
    where: { organizationId },
  })

  if (count > 0) return count

  await prisma.clinicMedication.createMany({
    data: CLINIC_MEDICATION_SEED.map((item) => ({
      organizationId,
      sortOrder: item.sortOrder,
      name: item.name,
      aliases: item.aliases ?? [],
      requiresFridge: item.requiresFridge ?? false,
      form: item.form ?? null,
      stockFarmacia: item.stockFarmacia ?? 0,
      stockEtaj1: 0,
      stockEtaj2: 0,
      stockEtaj3: 0,
      usageInstructions: item.usageInstructions,
      prescriptionTemplate: item.prescriptionTemplate,
      activeIngredient: item.activeIngredient ?? null,
      notes: item.notes ?? null,
    })),
  })

  return CLINIC_MEDICATION_SEED.length
}

export function medicationTotalStock(med: {
  stockFarmacia: number
  stockEtaj1: number
  stockEtaj2: number
  stockEtaj3: number
}) {
  return med.stockFarmacia + med.stockEtaj1 + med.stockEtaj2 + med.stockEtaj3
}

export function sanitizeMedicationForRole<T extends Record<string, unknown>>(
  medication: T,
  includeStock: boolean
) {
  if (includeStock) return medication

  const {
    stockFarmacia: _a,
    stockEtaj1: _b,
    stockEtaj2: _c,
    stockEtaj3: _d,
    ...rest
  } = medication
  return rest
}
