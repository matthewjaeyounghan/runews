const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;
const NEWS_API_KEY = 'b0d61cdfb4c1465ead26ac9e4bc0f04e';

app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, URL: ${req.url}`);
    next();
});

app.get('/top-headlines', async (req, res) => {
    try {
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: { country: 'us', apiKey: NEWS_API_KEY, pageSize: 5 }
        });
        const simplifiedArticles = response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name
        }));
        res.json(simplifiedArticles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching top headlines', error: error.message });
    }
});

app.get('/search-articles', async (req, res) => {
    try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: { q: req.query.query, apiKey: NEWS_API_KEY }
        });
        const simplifiedArticles = response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name
        }));
        res.json(simplifiedArticles);
    } catch (error) {
        res.status(500).json({ message: 'Error searching articles', error: error.message });
    }
});

// Dynamic category endpoint
app.get('/articles-by-category', async (req, res) => {
    const category = req.query.category; // Get category from query parameter
    if (!category) {
        return res.status(400).json({ message: 'Category is required' });
    }
    
    try {
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: { country: 'us', category: category, apiKey: NEWS_API_KEY }
        });
        const simplifiedArticles = response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name
        }));
        res.json(simplifiedArticles);
    } catch (error) {
        res.status(500).json({ message: `Error fetching articles in category ${category}`, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            console.log(`${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
        }
    });
});
