import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import authenticateToken from './src/authenticate/index.js';
import router from './src/persist/index.js'
const app = new Koa();

app.use(bodyParser());  // 解析请求体
app.use(authenticateToken); // 身份验证中间件

app.use(router.routes());  // 路由处理
app.use(router.allowedMethods());  // 允许使用HTTP方法

app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});