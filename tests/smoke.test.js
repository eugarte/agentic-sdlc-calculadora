const request = require('supertest');
const app = require('../src/app');

describe('Smoke Test', () => {
  it('should start the server and respond with 200 on GET /', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});
