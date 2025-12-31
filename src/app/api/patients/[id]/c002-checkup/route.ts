import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let userId = session.user.id;

    // Fallback: if user ID is not in session, try to get it from database
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return new NextResponse('User ID not found', { status: 400 });
    }

    const data = await request.json();
    const {
      // C002 specific data
      hasComplaints,
      complaints,
      healthChanges,
      healthChangesDetails,
      asaScore,
      asaNotes,
      cariesFindings,
      hygieneLevel,
      parafunctioning,
      parafunctioningDetails,
      mucosalAbnormalities,
      mucosalAbnormalitiesDetails,
      teethWear,
      teethWearDetails,
      otherFindings,
      recallTerm,
      additionalAppointments,
      carePlanNotes,
      otherNotes,
      // Standard treatment data
      codeId,
      notes,
      cost,
      sessions
    } = data;

    // Start a transaction to ensure all data is saved together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Save ASA record if there are changes
      let asaRecord = null;
      if (asaScore && asaNotes) {
        asaRecord = await tx.asaRecord.create({
          data: {
            score: asaScore,
            notes: asaNotes,
            patientId: params.id,
            createdBy: userId,
          },
        });
      }

      // 2. Save screening recall record
      let recallRecord = null;
      if (recallTerm) {
        recallRecord = await tx.screeningRecallRecord.create({
          data: {
            screeningMonths: recallTerm,
            notes: JSON.stringify({
              c002Checkup: true,
              additionalAppointments,
              carePlanNotes,
              otherNotes
            }),
            patientId: params.id,
            createdBy: userId,
          },
        });
      }

      // 3. Update or create care plan if there are notes
      let carePlan = null;
      if (carePlanNotes) {
        carePlan = await tx.carePlan.upsert({
          where: { patientId: params.id },
          update: {
            policy: carePlanNotes,
            updatedAt: new Date(),
          },
          create: {
            careRequest: 'C002 Checkup',
            careGoal: 'Maintain oral health',
            policy: carePlanNotes,
            patientId: params.id,
            createdBy: userId,
            riskProfile: {
              mucousMembranes: { status: 'NO_ABNORMALITIES', notes: '' },
              periodontitis: { status: 'LOW_RISK', notes: '' },
              caries: { status: 'LOW_RISK', notes: '' },
              wear: { status: 'LOW_RISK', notes: '' },
              functionProblem: { status: 'NO', notes: '' }
            }
          },
        });
      }

      // 4. Create the dental procedure
      // Construct a clean, human-readable notes string (only interesting facts)
      const interestingNotes = [
        hasComplaints && complaints ? `Complaints: ${complaints}` : null,
        healthChanges && healthChangesDetails ? `Health changes: ${healthChangesDetails}` : null,
        cariesFindings ? `Caries findings: ${cariesFindings}` : null,
        hygieneLevel && hygieneLevel !== 'GOOD' ? `Hygiene level: ${hygieneLevel}` : null,
        parafunctioning && parafunctioningDetails ? `Parafunctioning: ${parafunctioningDetails}` : null,
        mucosalAbnormalities && mucosalAbnormalitiesDetails ? `Mucosal abnormalities: ${mucosalAbnormalitiesDetails}` : null,
        teethWear && teethWearDetails ? `Teeth wear: ${teethWearDetails}` : null,
        otherFindings ? `Other findings: ${otherFindings}` : null,
        carePlanNotes ? `Care plan notes: ${carePlanNotes}` : null,
        otherNotes ? `Other notes: ${otherNotes}` : null
      ].filter(Boolean).join('; ');

      const dentalProcedure = await tx.dentalProcedure.create({
        data: {
          patientId: params.id,
          codeId,
          date: new Date(),
          notes: interestingNotes,
          status: 'IN_PROGRESS',
          quantity: sessions || 1,
          cost: cost || 0,
          practitionerId: userId,
        },
      });

      return {
        dentalProcedure,
        asaRecord,
        recallRecord,
        carePlan
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving C002 checkup:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 