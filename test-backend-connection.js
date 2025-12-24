// Simple backend connection test
import fetch from 'node-fetch';

async function testBackend() {
  console.log('Testing FaceWhiz Backend Connection...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing /api/health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✓ Success: ${JSON.stringify(healthData, null, 2)}\n`);
    } else {
      console.log(`   ✗ Error: ${healthResponse.status} ${healthResponse.statusText}\n`);
    }
    
    // Test people endpoint
    console.log('2. Testing /api/people endpoint...');
    const peopleResponse = await fetch('http://localhost:3000/api/people');
    console.log(`   Status: ${peopleResponse.status}`);
    
    if (peopleResponse.ok) {
      const peopleData = await peopleResponse.json();
      console.log(`   ✓ Success: Found ${peopleData.length} people\n`);
    } else {
      console.log(`   ✗ Error: ${peopleResponse.status} ${peopleResponse.statusText}\n`);
    }
    
    // Test recognize endpoint (with empty data)
    console.log('3. Testing /api/recognize endpoint...');
    const recognizeResponse = await fetch('http://localhost:3000/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descriptor: [] })
    });
    console.log(`   Status: ${recognizeResponse.status}`);
    
    if (recognizeResponse.ok) {
      const recognizeData = await recognizeResponse.json();
      console.log(`   ✓ Success: ${JSON.stringify(recognizeData, null, 2)}\n`);
    } else {
      const errorText = await recognizeResponse.text();
      console.log(`   Expected error (empty descriptor): ${errorText}\n`);
    }
    
    console.log('Backend connection test completed!');
    
  } catch (error) {
    console.error('Connection Error:', error.message);
    console.log('\nPossible causes:');
    console.log('- Backend server is not running');
    console.log('- Port 3000 is being used by another application');
    console.log('- Firewall blocking the connection');
  }
}

testBackend();