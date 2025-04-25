module.exports = {
  JWT_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Y4YWZkMzllNGJlZTRiYWVlZmIzNGIiLCJyb2xlIjoiYWRtaW4iLCJzY2hvb2xJZCI6IjY3ZjhhZmI0OWU0YmVlNGJhZWVmYjMzZiIsInByb2plY3QiOiJBQ1QiLCJpYXQiOjE3NDU1Nzk3ODAsImV4cCI6MTc0NTU5Nzc4MH0.2N6Ios4MlWuavuUBBeYw_abUcI9tLQLrRg0zTetW0_k",
  API_BASE_URL: "http://localhost:5000/v1",
  HEADERS: (form) => ({
    Authorization: `Bearer ${module.exports.JWT_TOKEN}`,
    ...form.getHeaders(),
  }),
};
