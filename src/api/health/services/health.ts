export default () => ({
  check() {
    return { status: "ok", uptime: process.uptime() };
  },
});
