import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const PLANS = {
  FREE: {
    name: 'Free',
    description: 'Get started for free',
    price: 0,
    priceId: null,
    features: ['5 AI requests/day', '1 project', 'Community support'],
  },
  PRO: {
    name: 'Pro',
    description: 'For serious builders',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited AI requests',
      'Unlimited projects',
      'Priority support',
      'Advanced analytics',
      'Custom domain',
      'Team collaboration (up to 5)',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'For teams and agencies',
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'SLA guarantees',
      'Dedicated support',
      'Custom integrations',
      'SSO/SAML',
      'Audit logs',
    ],
  },
} as const

export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string
  userEmail: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId },
    },
  })
  return session
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
