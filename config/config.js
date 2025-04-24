module.exports = {
  JWT_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Y4YWZkMzllNGJlZTRiYWVlZmIzNGIiLCJyb2xlIjoiYWRtaW4iLCJzY2hvb2xJZCI6IjY3ZjhhZmI0OWU0YmVlNGJhZWVmYjMzZiIsInByb2plY3QiOiJBQ1QiLCJpYXQiOjE3NDU0ODk3NzQsImV4cCI6MTc0NTUwNzc3NH0.oaKLWWBSCL4m5Yd3zTfkHGm0eyBVQjV0EEizMY1zSy8",
  API_BASE_URL: "http://localhost:5000/v1",
  HEADERS: (form) => ({
    Authorization: `Bearer ${module.exports.JWT_TOKEN}`,
    ...form.getHeaders(),
  }),
};
