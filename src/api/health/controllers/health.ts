export default {
  async check(ctx) {
    ctx.body = { status: "ok", uptime: process.uptime() };
  },
};
