import express from 'express';
import * as db from './database.js';
import { isUsingKeyVault } from './keyvault.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

await db.initializeDatabase();

console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Using Key Vault for db-password1: ${isUsingKeyVault() ? 'Yes (Managed Identity)' : 'No (using .env)'}`);


app.get('/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, price, quantity, description } = req.body;
    if (!name || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = await db.createProduct(name, price, quantity, description || '');
    res.status(201).json({ id, name, price, quantity, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const { name, price, quantity, description } = req.body;
    if (!name || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const changes = await db.updateProduct(req.params.id, name, price, quantity, description || '');
    if (changes > 0) {
      res.json({ id: req.params.id, name, price, quantity, description });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const changes = await db.deleteProduct(req.params.id);
    if (changes > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
