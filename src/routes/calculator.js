import express from 'express';
import { pool } from '../db.js';
import { validateCalculationInput } from '../validators/calculator.js';

const router = express.Router();

// POST /calculate
router.post('/calculate', async (req, res) => {
    try {
        const { operation, a, b } = req.body;
        
        // Validate input
        const validationError = validateCalculationInput(operation, a, b);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Perform calculation
        let result;
        switch (operation) {
            case 'sum':
                result = a + b;
                break;
            case 'subtract':
                result = a - b;
                break;
            case 'multiply':
                result = a * b;
                break;
            case 'divide':
                if (b === 0) {
                    return res.status(400).json({ error: 'Division by zero is not allowed' });
                }
                result = a / b;
                break;
            default:
                return res.status(400).json({ error: 'Invalid operation' });
        }

        // Save to database
        const [insertResult] = await pool.query(
            'INSERT INTO calculations (operation, a, b, result) VALUES (?, ?, ?, ?)',
            [operation, a, b, result]
        );

        return res.json({ 
            result,
            id: insertResult.insertId
        });

    } catch (error) {
        console.error('Calculation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /history
router.get('/history', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, operation, a, b, result, created_at FROM calculations ORDER BY created_at DESC'
        );
        return res.json(rows);
    } catch (error) {
        console.error('History retrieval error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /history/:id
router.delete('/history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM calculations WHERE id = ?', [id]);
        return res.status(204).end();
    } catch (error) {
        console.error('History deletion error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
