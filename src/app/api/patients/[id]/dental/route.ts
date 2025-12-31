import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DentalChartData, PeriodontalChartData } from '@/types/dental';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        dentalProcedures: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Get the latest periodontal chart from the array, or create a default one
    const periodontalCharts = (patient.periodontalCharts as unknown[] as PeriodontalChartData[]) || [];
    const periodontalChart = periodontalCharts.length > 0
      ? periodontalCharts[periodontalCharts.length - 1] // Always get the last (most recent) chart
      : {
        teeth: {},
        date: new Date().toISOString(),
        patientId: params.id,
        chartType: 'INITIAL_ASSESSMENT',
        isExplicitlySaved: false
      };




    return NextResponse.json({
      dentalChart: patient.dentalChart ? (patient.dentalChart as unknown as DentalChartData) : null, // Return saved dental chart data
      periodontalChart: periodontalChart as PeriodontalChartData,
      procedures: patient.dentalProcedures,
    });
  } catch (error) {
    console.error('Error fetching dental data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dental data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { dentalChart, periodontalChart } = body;

    // Get existing periodontal charts
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      select: { periodontalCharts: true }
    });

    const existingCharts = (patient?.periodontalCharts as unknown[] as PeriodontalChartData[]) || [];

    // Handle periodontal chart updates
    let updatedCharts = existingCharts;

    if (periodontalChart) {
      if (periodontalChart.isExplicitlySaved) {
        // Explicit save: append new chart to history
        updatedCharts = [...existingCharts, periodontalChart];
      } else {
        // Auto-save: replace the last chart (or create first one)
        if (existingCharts.length > 0) {
          // Replace the last chart with the new auto-saved data
          updatedCharts = [...existingCharts.slice(0, -1), periodontalChart];
        } else {
          // No existing charts, create the first one
          updatedCharts = [periodontalChart];
        }
      }
    }

    // Filter out disabled teeth from dental chart data since they are now stored as procedures
    let filteredDentalChart = dentalChart;
    if (dentalChart && dentalChart.teeth) {
      const filteredTeeth = {};
      Object.entries(dentalChart.teeth).forEach(([toothId, toothData]) => {
        const typedToothData = toothData as any;
        // Don't save disabled teeth to dental chart data - they are stored as procedures
        if (!typedToothData.isDisabled) {
          filteredTeeth[toothId] = toothData;
        }
      });
      filteredDentalChart = { ...dentalChart, teeth: filteredTeeth };
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        periodontalCharts: updatedCharts as any,
        dentalChart: filteredDentalChart || null, // Save dental chart data excluding disabled state
      },
      include: {
        dentalProcedures: true,
      },
    });



    // Return the latest chart
    const latestCharts = (updatedPatient.periodontalCharts as unknown[] as PeriodontalChartData[]) || [];
    const latestChart = latestCharts.length > 0
      ? latestCharts[latestCharts.length - 1]
      : { teeth: {}, date: new Date().toISOString(), patientId: params.id };

    return NextResponse.json({
      dentalChart: updatedPatient.dentalChart ? (updatedPatient.dentalChart as unknown as DentalChartData) : null, // Return updated dental chart data
      periodontalChart: latestChart as PeriodontalChartData,
      procedures: updatedPatient.dentalProcedures,
    });
  } catch (error) {
    console.error('Error updating dental data:', error);
    return NextResponse.json(
      { error: 'Failed to update dental data' },
      { status: 500 }
    );
  }
}