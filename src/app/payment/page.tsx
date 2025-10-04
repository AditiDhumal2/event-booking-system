// app/payment/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBooking } from '@/actions/bookingActions';
import { createRazorpayOrder, verifyPaymentSignature } from '@/actions/razorpayActions';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const eventId = searchParams.get('eventId');
  const tickets = parseInt(searchParams.get('tickets') || '1');
  const totalPrice = parseInt(searchParams.get('totalPrice') || '0');
  
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  
  const razorpayInstance = useRef<any>(null);
  const paymentInitiated = useRef(false);
  const paymentCompleted = useRef(false);

  // Redirect if required parameters are missing
  useEffect(() => {
    if (!eventId || !tickets || !totalPrice) {
      router.push('/user');
    }
  }, [eventId, tickets, totalPrice, router]);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          setRazorpayLoaded(true);
          resolve(true);
        };
        
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          setLoadError('Failed to load payment gateway. Please refresh the page.');
          resolve(false);
        };
        
        document.head.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  // Cleanup Razorpay instance on unmount
  useEffect(() => {
    return () => {
      if (razorpayInstance.current) {
        razorpayInstance.current.close();
      }
    };
  }, []);

  const redirectToFailure = (reason: string) => {
    if (paymentCompleted.current) return; // Prevent multiple redirects
    
    console.log('Redirecting to failure page with reason:', reason);
    paymentCompleted.current = true;
    router.push(`/payment/status?status=failed&reason=${encodeURIComponent(reason)}`);
  };

  const redirectToSuccess = () => {
    if (paymentCompleted.current) return;
    
    console.log('Redirecting to success page');
    paymentCompleted.current = true;
    router.push('/payment/status?status=success');
  };

  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      console.log('Payment success received:', paymentResponse);
      paymentCompleted.current = true;

      // Verify payment signature
      const verificationResult = await verifyPaymentSignature({
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
      });

      if (!verificationResult.success) {
        console.error('Payment verification failed');
        redirectToFailure('verification_failed');
        return;
      }

      // Create booking after successful payment
      const formData = new FormData();
      formData.append('tickets', tickets.toString());
      formData.append('paymentId', paymentResponse.razorpay_payment_id);
      formData.append('orderId', paymentResponse.razorpay_order_id);

      const result = await createBooking(eventId!, formData);
      
      if (result.success) {
        console.log('Booking created successfully');
        redirectToSuccess();
      } else {
        console.error('Booking creation failed:', result.error);
        redirectToFailure('booking_creation_failed');
      }
    } catch (error) {
      console.error('Error processing payment success:', error);
      redirectToFailure('processing_error');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateRazorpayPayment = async () => {
    if (!window.Razorpay) {
      setLoadError('Payment gateway is not available. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    paymentInitiated.current = true;
    paymentCompleted.current = false;

    try {
      // Create Razorpay order
      const receipt = `booking_${Date.now()}`;
      const orderResult = await createRazorpayOrder(totalPrice, receipt);

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const order = orderResult.order;
      console.log('Razorpay order created:', order.id);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Event Booking System',
        description: `Booking for ${tickets} ticket(s)`,
        order_id: order.id,
        handler: (response: any) => {
          console.log('Payment handler called with response:', response);
          handlePaymentSuccess(response);
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        notes: {
          eventId: eventId,
          tickets: tickets.toString(),
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed by user');
            if (!paymentCompleted.current && paymentInitiated.current) {
              console.log('Triggering failure redirect from ondismiss');
              redirectToFailure('payment_cancelled');
            }
            setIsLoading(false);
          },
          escape: true, // Allow escape key to close
          backdropclose: true, // Allow clicking outside to close
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpayInstance.current = razorpay;
      
      // Add payment failed handler
      razorpay.on('payment.failed', (response: any) => {
        console.log('Payment failed event triggered:', response);
        let reason = 'payment_failed';
        if (response.error && response.error.description) {
          reason = response.error.description;
        } else if (response.error && response.error.reason) {
          reason = response.error.reason;
        }
        redirectToFailure(reason);
        setIsLoading(false);
      });

      // Add close event listener as backup
      razorpay.on('close', () => {
        console.log('Razorpay close event triggered');
        // Small delay to ensure other events are processed first
        setTimeout(() => {
          if (!paymentCompleted.current && paymentInitiated.current) {
            console.log('Triggering failure redirect from close event');
            redirectToFailure('payment_cancelled');
            setIsLoading(false);
          }
        }, 500);
      });

      console.log('Opening Razorpay checkout...');
      razorpay.open();
      
      // Backup timeout for cases where Razorpay doesn't trigger events
      setTimeout(() => {
        if (!paymentCompleted.current && paymentInitiated.current) {
          console.log('Backup timeout - checking payment status');
          // This is a fallback, in real implementation you might want to check payment status via API
        }
      }, 300000); // 5 minutes timeout
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      redirectToFailure('initiation_error');
      setIsLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!razorpayLoaded) {
      setLoadError('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    if (isLoading) return;

    await initiateRazorpayPayment();
  };

  const handleCancel = () => {
    // Only redirect to events page if payment wasn't initiated
    if (!paymentInitiated.current) {
      router.push('/events');
    }
    // If payment was initiated but not completed, let the Razorpay handlers handle the redirect
  };

  const handleRetryLoad = () => {
    setLoadError('');
    setRazorpayLoaded(false);
    window.location.reload();
  };

  if (!eventId || !tickets || !totalPrice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Payment Request</h1>
          <p className="text-gray-600">Redirecting to events page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Secure payment with Razorpay</p>
          
          {loadError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 mb-3">{loadError}</p>
              <button
                onClick={handleRetryLoad}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Retry Loading Payment
              </button>
            </div>
          )}
          
          {!razorpayLoaded && !loadError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                <p className="text-yellow-800 text-sm">Loading payment gateway...</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span>Tickets:</span>
                <span className="font-medium">{tickets} ticket{tickets !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handlePayment} className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Test Card Details</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-800 space-y-1">
                  <div><strong>Card Number:</strong> 4111 1111 1111 1111</div>
                  <div><strong>Expiry:</strong> 12/30 (any future date)</div>
                  <div><strong>CVV:</strong> 123 (any 3 digits)</div>
                  <div><strong>Name:</strong> Any Name</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm text-green-800">
                  Your payment is secure and encrypted. Powered by Razorpay.
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !razorpayLoaded || !!loadError}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing Payment...
                  </>
                ) : (
                  `Pay ₹${totalPrice.toLocaleString('en-IN')}`
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                ← Cancel and Go Back
              </button>
            </div>
          </form>
        </div>

        {/* Razorpay Logo */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
            <span className="text-gray-600 text-sm mr-2">Powered by</span>
            <div className="w-20 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">RAZORPAY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}