// actions/razorpayActions.ts
'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPayment {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Create Razorpay order
export async function createRazorpayOrder(amount: number, receipt: string): Promise<{ success: boolean; order?: RazorpayOrder; error?: string }> {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR' as const,
      receipt,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    return {
      success: true,
      order: {
        id: order.id || '',
        amount: Number(order.amount) || 0,
        currency: order.currency || 'INR',
        receipt: order.receipt || '',
        status: order.status || 'created',
      },
    };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment order'
    };
  }
}

// Verify payment signature
export async function verifyPaymentSignature(paymentData: RazorpayPayment): Promise<{ success: boolean; paymentId?: string; orderId?: string }> {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return { success: false };
    }

    // Create expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    return {
      success: isAuthentic,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return { success: false };
  }
}