#!/usr/bin/env node

// Simple test script for FaceWhiz system
import fetch from 'node-fetch';

console.log('Testing FaceWhiz System');
console.log('======================');

async function testHealthEndpoint() {
  try {
    console.log('Testing backend health endpoint...');
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Backend is running');
      console.log(`   Service: ${data.service}`);
      console.log(`   Timestamp: ${data.timestamp}`);
    } else {
      console.log('❌ Backend health check failed');
    }
  } catch (error) {
    console.log('❌ Backend is not accessible');
    console.log('   Make sure the backend server is running on port 3000');
  }
}

async function testPeopleEndpoint() {
  try {
    console.log('\nTesting people endpoint...');
    const response = await fetch('http://localhost:3000/api/people');
    
    if (response.ok) {
      console.log('✅ People endpoint is accessible');
      const people = await response.json();
      console.log(`   Found ${people.length} people in database`);
    } else {
      console.log('⚠️  People endpoint returned status:', response.status);
    }
  } catch (error) {
    console.log('⚠️  Could not access people endpoint');
    console.log('   This is expected if no people are registered yet');
  }
}

async function runTests() {
  await testHealthEndpoint();
  await testPeopleEndpoint();
  
  console.log('\nTest completed!');
  console.log('\nTo fully test the system:');
  console.log('1. Make sure the backend is running (npm start)');
  console.log('2. Start the frontend (npm run frontend)');
  console.log('3. Open your browser to http://localhost:5173');
  console.log('4. Allow camera access and test face recognition');
}

runTests();