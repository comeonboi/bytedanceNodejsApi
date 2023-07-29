const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser')
const mysql = require('mysql')
const app = new Koa();
const router = new Router();
const authenticateToken = require('./src/authenticate')
// 我还没建表呢,别急
const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'apicat',
  port: '3306'
});

app.use(bodyParser());  // 解析请求体
// 身份验证中间件
app.use(authenticateToken);

// 存储接口信息的对象
const apiBasicData = {};
// 处理创建接口请求
router.post('/api/projects/:projectId/apis', async ctx => {
  const currentTime = new Date();
  const formattedTime = currentTime.toISOString().slice(0, 19).replace('T', ' ');

  const { projectId } = ctx.params;
  // 请注意,现在还没有做后面的功能,所以后面两个参数暂时还没用上!
  const { apiName, apiPath, httpMethod, requestParams, responseParams } = ctx.request.body;
  // 项目id 跟接口id不是一个概念,看好一点.这个项目id你需要把项目数据插入数据库之后让他给你返回一个,然后你再返回给前端奥.
  apiBasicData.ProjectID = projectId
  apiBasicData.ApiName = apiName
  apiBasicData.Endpoint = apiPath
  apiBasicData.RequestMethod = httpMethod
  apiBasicData.CreatedAt = formattedTime

  db.query('insert into APIs values ? ', apiData, (err, results) => {
    if (err) {
      console.log(err);
    }
    else {
      // results.insertId是mysql给我们返回的id(注意 数据库需要给这个字段开自增) 用模板字符串,只是为了防止报错(懒得调试)
      ctx.body = {
        "message": "API created successfully",
        "apiId": `${results.insertId}`
      }
    }
  })


});
router.get('/api/projects/:projectId/apis', async ctx => {
  db.query('select ApiID,ApiName,Endpoint,RequestMethod from APIS where ProjectID = ? ', ctx.params.projectId, (err, results) => {
    if (err) {
      console.log(err);
    }
    else {
      ctx.body = {
        "apis": results
      }
    }
  })
})

router.put('/api/projects/:projectId/apis/:apiId', async ctx => {
  const { projectId, apiId } = ctx.params;
  const { apiName, apiPath, httpMethod, requestParams, responseParams } = ctx.request.body;
  // 这里要修改多个表的 很显然,不只是一个表!
  db.query('update xxx', (err, results) => {
    if (err) {
      console.log(err);
    }
    else {
      ctx.body = 'API updated successfully'
    }
  })
})

router.delete('/api/projects/:projectId/apis/:apiId', async ctx => {
  const { projectId, apiId } = ctx.params;
  // 很显然 删也要删多个表的,一个表肯定不够.这里还需要修改
  db.query('delete from APIs where apiId = ?', apiId, (err, results) => {
    if (err) {
      console.log(err);
    }
    else {
      ctx.body = 'API delete successfully'
    }
  })
})
app.use(router.routes());  // 路由处理
app.use(router.allowedMethods());  // 允许使用HTTP方法

app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});