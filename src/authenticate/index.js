import redis from 'redis'
const client = redis.createClient();
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();
const authenticateToken = async (ctx, next) => {
  const authHeader = ctx.request.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // 根据实际情况获取令牌(传过来的token格式是Bearer xxxxx)
    const val = await client.get(token)
    if (!val) {
      ctx.status = 401; // 未授权
      ctx.body = {
        "success": true,
        "code": 401,
        "message": "失败",
        "status": null,
        "data": {
          "error": "Unauthorized"
        }
      }
    }
    else {
      return next()
    }
  } else {
    ctx.status = 401; // 未授权
    ctx.body = {
      "success": true,
      "code": 401,
      "message": "失败",
      "status": null,
      "data": {
        "error": "Authentication token required"
      }
    }
  }
}
export default authenticateToken