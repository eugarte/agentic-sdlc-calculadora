const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database connection is ready
    await db.query('DELETE FROM calculations');
  });

  afterAll(async () => {
    await db.end();
  });

  test('GET / should return 200', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });

  test('POST /calculate should perform calculation and return result', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({ operation: 'sum', a: 5, b: 3 });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(response.body).toHaveProperty('id');
    expect(response.body.result).toBe(8);
  });

  test('POST /calculate should return 400 for invalid operation', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({ operation: 'invalid', a: 5, b: 3 });
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /calculate should return 400 for division by zero', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({ operation: 'divide', a: 5, b: 0 });
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('GET /history should return calculations ordered by date', async () => {
    // Add test data
    await db.query(`
      INSERT INTO calculations (operation, a, b, result)
      VALUES ('sum', 1, 2, 3),
             ('subtract', 5, 3, 2)
    `);

    const response = await request(app).get('/history');
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    expect(response.body[0].created_at).toBeGreaterThan(response.body[1].created_at);
  });

  test('DELETE /history/:id should remove calculation', async () => {
    // Add test data
    const [result] = await db.query(`
      INSERT INTO calculations (operation, a, b, result)
      VALUES ('multiply', 2, 3, 6)
    `);
    const id = result.insertId;

    const deleteResponse = await request(app).delete(`/history/${id}`);
    expect(deleteResponse.statusCode).toBe(200);

    const [rows] = await db.query('SELECT * FROM calculations WHERE id = ?', [id]);
    expect(rows.length).toBe(0);
  });

  test('DELETE /history/:id should return 404 for non-existent id', async () => {
    const response = await request(app).delete('/history/999999');
    expect(response.statusCode).toBe(404);
  });
});
