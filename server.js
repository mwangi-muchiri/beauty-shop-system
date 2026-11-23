const express = require('express'); // 1. Bring in the Express library
const app = express();              // 2. Create the backend application
const PORT = 3000;                  // 3. Define the port number

// Route 1: A simple welcome message for visitors
app.get('/', (req, res) => {
    res.send('Welcome to the Beauty Shop Backend System!');
});

// Route 2: A data endpoint that sends product details
app.get('/api/products', (req, res) => {
    const products = [
        { id: 1, name: 'Lipstick', price: 15.99 },
        { id: 2, name: 'Face Moisturizer', price: 24.99 }
    ];
    res.json(products); // Sends data back as clean JSON
});

// 4. Start the engine and tell it to listen for requests
app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});
