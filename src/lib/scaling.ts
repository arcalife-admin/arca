// Utilities for scaling procedures (T021/T022)

export async function getScalingCode(code: 'T021' | 'T022') {
  try {
    console.log(`🔍 Looking up scaling code: ${code}`)
    const res = await fetch(`/api/dental-codes?search=${code.toLowerCase()}`)
    if (!res.ok) {
      console.error(`❌ Failed to fetch scaling code: ${res.status} ${res.statusText}`)
      throw new Error('Failed to fetch scaling code')
    }
    const codes = await res.json()
    const foundCode = codes.find((c: any) => c.code.toUpperCase() === code)
    console.log(`🔍 Scaling code lookup for ${code}:`, foundCode ? 'found' : 'not found', foundCode)
    return foundCode
  } catch (error) {
    console.error(`❌ Error in getScalingCode for ${code}:`, error)
    throw error
  }
}

/**
 * Create a scaling procedure for a single tooth. Optionally adds A10 local anesthesia x n.
 */
export async function createScalingProcedure(
  patientId: string,
  toothNumber: number,
  scalingCode: 'T021' | 'T022',
  anesthesiaCount: number = 0,
  status: string = 'PENDING'
) {
  try {
    console.log(`🦷 Creating scaling procedure:`, { patientId, toothNumber, scalingCode, anesthesiaCount, status })

    const code = await getScalingCode(scalingCode)
    if (!code) {
      console.error(`❌ Scaling code ${scalingCode} not found`)
      throw new Error(`Scaling code ${scalingCode} not found`)
    }

    const dateStr = new Date().toISOString().split('T')[0]

    console.log(`📝 Creating procedure with code:`, code)

    const procedureData = {
      codeId: code.id,
      toothNumber,
      notes: `${scalingCode} scaling`,
      status, // Use the passed status instead of defaulting to 'PENDING'
      date: dateStr,
      source: 'scaling-tool'
    }

    console.log(`📤 Sending procedure data:`, procedureData)

    const res = await fetch(`/api/patients/${patientId}/dental-procedures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(procedureData)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`❌ Failed to create scaling procedure:`, res.status, res.statusText, errorText)
      throw new Error(`Failed to create scaling procedure: ${res.status} ${res.statusText}`)
    }

    const createdProcedure = await res.json()
    console.log(`✅ Successfully created scaling procedure:`, createdProcedure)

    return createdProcedure
  } catch (error) {
    console.error(`❌ Error creating scaling procedure:`, error)
    throw error
  }
} 