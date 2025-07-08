const axios = require('axios');

async function testRoutes() {
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Backend health check passed:', response.data);
  } catch (error) {
    console.log('❌ Backend not running or health check failed');
  }
}

testRoutes();
