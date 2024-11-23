import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { initSupabase } from "./utils/supabase.js";
import { pingRouter } from "./routes/pingRoute.js";
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

initSupabase();

// Middleware
app.use(cors());
app.use(express.json());

// This is above the auth middleware so that it can be accessed without it
app.get("/ping", (_, res) => {
  res.json({ message: "pong" });
});


app.get("/top-headlines", async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY; // Make sure your API key is set in the environment variable
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing' });
  }

  const url = 'https://newsapi.org/v2/top-headlines';
  const params = {
    country: 'us',
    pageSize: 5,
  };

  // Create URL with query parameters
  const urlWithParams = new URL(url);
  Object.keys(params).forEach(key => urlWithParams.searchParams.append(key, params[key]));

  try {
    const response = await fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,  // Include API key in the header
      },
    });

    if (!response.ok) {
      console.error('Error from News API:', response.status, await response.text());
      return res.status(502).json({ error: 'Bad Gateway, failed to fetch headlines' });
    }

    const data = await response.json();

    if (data.status === 'ok') {
      return res.json({ data: data.articles });
    } else {
      console.error('Error in response:', data);
      return res.status(500).json({ error: 'Failed to fetch top headlines' });
    }
  } catch (error) {
    console.error('Error fetching data from News API:', error);
    return res.status(502).json({ error: 'Bad Gateway, failed to fetch headlines' });
  }
});

app.get("/article-by-category", async (req, res) => {
  const category = req.query.category;
  if (!category) {
    return res.status(400).json({ error: 'Category parameter is required' });
  }

  try {
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=${encodeURIComponent(category)}&apiKey=aa5b5a9486af4d338af4a12821a90ac9`;
    const response = await fetch(url);
    const jsonUrlResponse = await response.json();

    if (jsonUrlResponse.status === 'ok') {
      return res.json({ "data": jsonUrlResponse["articles"] }); // Send articles for the category
    } else {
      res.status(500).json({ error: `Failed to load ${category} articles` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search Articles
app.get('/api/search-articles', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${API_KEY}`;
    const response = await fetch(url);
    const jsonResponse = await response.json();

    if (jsonResponse.status === 'ok') {
      return res.json({ data: jsonResponse["articles"] }); // Send articles from search
    } else {
      res.status(500).json({ error: 'Failed to search articles' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use(authMiddleware);

// add routers to the app
app.use(pingRouter);

// Error handler
app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
