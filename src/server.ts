import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API route for Mercado Livre import (equivalent to Netlify Function)
  app.get("/api/importar-produtos", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const response = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query as string)}`);
      const data = await response.json();
      
      // Return top 10 products
      const products = data.results.slice(0, 10).map((item: any) => ({
        id: item.id,
        name: item.title,
        price: item.price,
        image: item.thumbnail.replace("-I.jpg", "-O.jpg"), // Better quality image
        link: item.permalink,
        category: "Importados"
      }));

      res.json(products);
    } catch (error) {
      console.error("Error importing products:", error);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
