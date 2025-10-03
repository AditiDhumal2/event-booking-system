// app/payment/status/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');
  const reason = searchParams.get('reason');
  
  const [countdown, setCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!status) {
      setShouldRedirect(true);
      return;
    }
  }, [status]);

  // Separate useEffect for redirect
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/user/bookings');
    }
  }, [shouldRedirect, router]);

  // Countdown timer
  useEffect(() => {
    if (!status) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShouldRedirect(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed. You will receive a confirmation email shortly.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/user/bookings"
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors block"
            >
              View My Bookings ({countdown})
            </Link>
            <Link
              href="/events"
              className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors block"
            >
              Browse More Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    const getErrorMessage = () => {
      switch (reason) {
        case 'user_cancelled':
          return 'Payment was cancelled. You can try again anytime.';
        case 'cancelled':
          return 'Payment was cancelled.';
        case 'verification_failed':
          return 'Payment verification failed. Please contact support.';
        case 'booking_creation_failed':
          return 'Payment was successful but booking creation failed. Please contact support.';
        case 'processing_error':
          return 'An error occurred while processing your payment.';
        case 'initiation_error':
          return 'Failed to initiate payment. Please try again.';
        default:
          return reason || 'Payment failed. Please try again.';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            {getErrorMessage()}
          </p>
          
          <div className="space-y-3">
            <Link
              href="/user/bookings"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors block"
            >
              Back to Bookings ({countdown})
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}