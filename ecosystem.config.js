module.exports = {
  apps: [
    {
      name: "board-ai",
      cwd: "/var/www/board_ai",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
