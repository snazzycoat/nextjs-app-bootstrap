import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, purchaseType, eventId, quantity } = await request.json()

    if (!priceId || !purchaseType || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const lineItem = {
      price: priceId,
      quantity: quantity || 1,
    }

    // Determine mode based on purchaseType
    const mode = purchaseType === 'subscription' ? 'subscription' : 'payment'

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [lineItem],
      metadata: {
        purchaseType,
        eventId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout session creation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
