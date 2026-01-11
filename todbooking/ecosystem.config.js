module.exports = {
  apps: [
    {
      name: "tod-api",
      exec_mode: "cluster",
      instances: 1, // Or a number of instances
      script: "server.js",
      args: "start",
      env: {
        PORT: 5050,
      },
    },
  ],
};
