const express = require('express');
const path = require('path');
const calculatorRouter = require('./routes/calculator');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mount calculator router
app.use('/', calculatorRouter);

// Export the Express instance
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
