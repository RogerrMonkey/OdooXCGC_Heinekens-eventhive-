// Test script for Razorpay payment gateway
// Run this in browser console to test payment flow

async function testRazorpayConfig() {
  try {
    console.log('Testing Razorpay configuration...');
    
    const response = await fetch('/api/test/razorpay');
    const data = await response.json();
    
    console.log('Razorpay Config Test Result:', data);
    
    if (data.success) {
      console.log('✅ Razorpay is properly configured');
      console.log('Test Order Created:', data.testOrder);
    } else {
      console.log('❌ Razorpay configuration issue:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testPaymentOrderCreation() {
  try {
    console.log('Testing payment order creation...');
    
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100, // ₹100
        currency: 'INR',
        receipt: 'test_receipt_123',
        bookingId: 'test_booking_123'
      })
    });
    
    const data = await response.json();
    console.log('Payment Order Test Result:', data);
    
    if (data.success) {
      console.log('✅ Payment order creation working');
    } else {
      console.log('❌ Payment order creation failed:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Payment order test failed:', error);
  }
}

// Check if Razorpay script is loaded
function checkRazorpayScript() {
  console.log('Checking Razorpay script...');
  console.log('Razorpay available:', !!window.Razorpay);
  console.log('Razorpay object:', window.Razorpay);
  
  if (window.Razorpay) {
    console.log('✅ Razorpay script is loaded and available');
  } else {
    console.log('❌ Razorpay script not loaded');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Razorpay Payment Gateway Tests...\n');
  
  await testRazorpayConfig();
  console.log('\n');
  
  await testPaymentOrderCreation();
  console.log('\n');
  
  checkRazorpayScript();
  
  console.log('\n✅ All tests completed. Check results above.');
}

// Auto-run tests if this script is executed
if (typeof window !== 'undefined') {
  console.log('Razorpay test functions available:');
  console.log('- runAllTests()');
  console.log('- testRazorpayConfig()');
  console.log('- testPaymentOrderCreation()');
  console.log('- checkRazorpayScript()');
  console.log('\nRun runAllTests() to test everything');
}
