// Test script to verify destination tag implementation
// Run with: node test-destination-tags.js

const testCases = [
  {
    name: 'XRP Destination Tag Validation',
    currency: 'XRP',
    address: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
    extra_id: '123456789',
    expected: 'valid'
  },
  {
    name: 'XRP Invalid Destination Tag (too long)',
    currency: 'XRP',
    address: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
    extra_id: '12345678901',
    expected: 'invalid'
  },
  {
    name: 'XLM Memo Validation',
    currency: 'XLM',
    address: 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6',
    extra_id: 'cryptrac_merchant_001',
    expected: 'valid'
  },
  {
    name: 'XLM Invalid Memo (too long)',
    currency: 'XLM',
    address: 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6',
    extra_id: 'this_memo_is_way_too_long_for_stellar_requirements',
    expected: 'invalid'
  },
  {
    name: 'HBAR Memo Validation',
    currency: 'HBAR',
    address: '0.0.12345',
    extra_id: 'cryptrac_hbar_001',
    expected: 'valid'
  },
  {
    name: 'BTC No Extra ID Required',
    currency: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    extra_id: '',
    expected: 'valid'
  }
];

async function runTests() {
  const API_URL = 'http://localhost:3009/api/wallets/validate';
  
  console.log('🧪 Running destination tag validation tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currency: test.currency,
          address: test.address,
          extra_id: test.extra_id
        })
      });
      
      const result = await response.json();
      const isValid = result.validation?.valid ? 'valid' : 'invalid';
      
      if (isValid === test.expected) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Expected: ${test.expected}, Got: ${isValid}`);
        console.log(`   Error: ${result.validation?.error || 'None'}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Destination tag implementation is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.');
  }
}

// Run tests if API is available
console.log('⚠️ Make sure the Next.js dev server is running on http://localhost:3000');
console.log('Run with: npm run dev\n');

// Try to import fetch for Node.js environments
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch for testing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install node-fetch@2', { stdio: 'inherit' });
    global.fetch = require('node-fetch');
  } catch (error) {
    console.error('Failed to install node-fetch. Please install it manually: npm install node-fetch@2');
    process.exit(1);
  }
}

runTests().catch(console.error);