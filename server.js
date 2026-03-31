const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(cors());

app.use('/api', createProxyMiddleware({
  target: 'https://api.themoviedb.org/3',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
