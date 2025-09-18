export default {
  routes: [
    {
      method: "GET",
      path: "/_health",
      handler: "health.check",
      config: {
        auth: false, // sin auth, accesible públicamente
      },
    },
  ],
};
