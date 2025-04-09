import express from 'express';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs, { read } from 'fs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// ===================== Tipe Data =====================
interface PurchaseOrder {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  supplier: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Delivered';
}

interface Database {
  purchaseOrders: PurchaseOrder[];
}

// ===================== Helper Functions =====================
const readDB = (): Database => {
  try {
    const data = fs.readFileSync('./src/db/db.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { purchaseOrders: [] };
  }
};

const writeDB = (data: Database) => {
  fs.writeFileSync('./src/db/db.json', JSON.stringify(data, null, 2));
};

// ===================== Middleware =====================
app.use(express.json());

// ===================== Routes =====================

// 1. Membuat Purchase Orders
app.post('/purchase-orders', (req: Request, res: Response) => {
  const { itemName, category, quantity, supplier }: Partial<PurchaseOrder> = req.body;
  
  // Validasi
  if (!itemName || !category || !quantity || !supplier) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields (itemName, category, quantity, supplier) are required' 
    });
  }

  const db = readDB();
  const newOrder: PurchaseOrder = {
    id: uuidv4(),
    itemName,
    category,
    quantity,
    supplier,
    status: 'Pending'
  };

  db.purchaseOrders.push(newOrder);
  writeDB(db);

  res.status(201).json({
    success: true,
    message: 'Purchase order created successfully',
    purchaseOrder: newOrder
  });
});

// 2. Mendapatkan semua Orders
app.get('/purchase-orders', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ 
    success: true, 
    purchaseOrders: db.purchaseOrders 
  });
});

//6. query search
app.get('/purchase-orders/search', (req: Request, res: Response) => {
  // Mengambil query parameters yang bersifat optional
  const { itemName, category, supplier, status } = req.query;

  // Mengambil data dari database/in-memory
  const db = readDB();

  // Melakukan filter data berdasarkan setiap parameter yang diberikan
  const results = db.purchaseOrders.filter((order) => {
    let isMatch = true;
    if (itemName) {
      isMatch = isMatch && order.itemName.toLowerCase().includes((itemName as string).toLowerCase());
    }
    if (category) {
      isMatch = isMatch && order.category.toLowerCase().includes((category as string).toLowerCase());
    }
    if (supplier) {
      isMatch = isMatch && order.supplier.toLowerCase().includes((supplier as string).toLowerCase());
    }
    if (status) {
      isMatch = isMatch && order.status.toLowerCase().includes((status as string).toLowerCase());
    }
    return isMatch;
  });

  return res.json({
    success: true,
    purchaseOrders: results
  });
});


// 3. Mendapatkan Orders berdasarkan ID
app.get('/purchase-orders/:id', (req: Request, res: Response) => {
  const db = readDB();
  const order = db.purchaseOrders.find(x => x.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ 
      success: false, 
      message: 'Order not found' 
    });
  }
  
  res.json({ 
    success: true, 
    purchaseOrder: order 
  });
});

// 4. Update Order
app.put('/purchase-orders/:id', (req: Request, res: Response) => {
  const db = readDB();
  const index = db.purchaseOrders.findIndex(x => x.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Order not found' 
    });
  }

  const updatedOrder = { ...db.purchaseOrders[index], ...req.body };
  db.purchaseOrders[index] = updatedOrder;
  writeDB(db);

  res.json({ 
    success: true, 
    message: 'Purchase order updated successfully',
    purchaseOrder: updatedOrder
  });
});

// 5. Delete Purchase Order
app.delete('/purchase-orders/:id', (req: Request, res: Response) => {
  const db = readDB();
  const initialLength = db.purchaseOrders.length;
  db.purchaseOrders = db.purchaseOrders.filter(x => x.id === req.params.id);

  if(db.purchaseOrders.length === initialLength){
    return res.status(404).json({
      success: true,
      message: 'Order not Found'
    });
  }

  writeDB(db);
  res.json({
    success: true,
    message: 'Purchased Order Deleted'
  });
});





// ===================== Start Server =====================
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

