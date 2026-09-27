const config = require('../config');

module.exports = async (ctx, next) => {
  // Hanya proses jika pengirimnya ada dan id-nya sama dengan OWNER_ID
  if (ctx.from && String(ctx.from.id) === String(config.OWNER_ID)) {
    return next();
  }
  
  // Jika bukan owner, kita abaikan saja diam-diam (silent drop)
  // Console.log opsional jika ingin melihat ada yang iseng:
  // console.log(`Ignored message from non-owner: ${ctx.from?.id}`);
};
