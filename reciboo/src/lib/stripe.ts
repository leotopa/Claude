import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

let _stripe: Stripe | null = null

export function getServerStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })
  }
  return _stripe
}

let stripePromise: ReturnType<typeof loadStripe>

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}
