import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const body = await request.json()
    
    console.log('📞 Updating customer contact for payment:', paymentId)
    console.log('📋 Contact data:', body)

    // Validate input
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (body.customer_email) {
      updateData.customer_email = body.customer_email
    }
    
    if (body.customer_phone) {
      updateData.customer_phone = body.customer_phone
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contact information provided' },
        { status: 400 }
      )
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    // Update the transaction record
    const { data: updatedPayment, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Supabase update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update contact information' },
        { status: 500 }
      )
    }

    if (!updatedPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('✅ Customer contact updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Contact information updated successfully',
      payment: updatedPayment
    })

  } catch (error) {
    console.error('❌ Error updating customer contact:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

