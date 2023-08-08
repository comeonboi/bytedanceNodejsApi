import Router from 'koa-router';
import util from 'util';
import { createPool } from 'mysql2';
const router = new Router();

const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: '123456789qw',
  database: 'apicat',
  port: '3306'
});

const queryPromise = util.promisify(pool.query).bind(pool);

// 处理创建接口请求
router.post('/api/projects/:projectId/apis', async ctx => {
  // 这里不用手动获取时间,可以让数据库自动生成
  const { projectId } = ctx.params;
  const { apiName, apiPath, httpMethod, requestParams, responseParams, paramType, paramName, paramLocation, createdBy, createDescription } = ctx.request.body;
  // 项目id 跟接口id不是一个概念,看好一点.这个项目id你需要把项目数据插入数据库之后让他给你返回一个,然后你再返回给前端奥.
  // 存储接口信息的对象
  const apiBasicData = {
    ProjectID: projectId,
    ApiName: apiName,
    Endpoint: apiPath,
    RequestMethod: httpMethod,

  };
  const apiParamsData = {
    ApiId: null,
    ParamName: paramName,
    ParamType: paramType,
    ParamLocation: paramLocation,
    UpdatedAt: null,
  }
  const apiResponseData = {
    ApiId: null,
    ResponseBody: responseParams,
  }
  const apiLogData = {
    ApiId: null,
    ChangeDescription: createDescription,
    ChangedBy: createdBy
  }
  const apiVersionData = {
    ApiId: null,
    VersionNumber: '0.1.0',
    CreatedBy: createdBy,
  }
  const createFn = async (id) => {
    ctx.body =
    {
      "success": true,
      "code": 200,
      "message": "API created successfully",
      "status": null,
      "data": {
        "apiId": id,
        "responseType": typeof responseParams === 'object' ? 'json' : typeof responseParams, //responseType | string | 返回数据类型,取值,或许是:JSON XML HTML 文本格式 二进制格式(gpt说的)
        "responseBody": responseParams //responseBody | any    | 取决于返回数据类型
      }
    }
  }
  try {
    queryPromise('insert into APIs set ?', apiBasicData).then((result) => {
      const id = result.insertId;
      // 更新相关数据中的 ApiId 字段
      apiParamsData.ApiId = id;
      apiResponseData.ApiId = id;
      apiLogData.ApiId = id;
      apiVersionData.ApiId = id;
    })


    await Promise.all([
      queryPromise('insert into RequestParams set ?', apiParamsData),
      queryPromise('insert into APIResponses set ?', apiResponseData),
      queryPromise('insert into APIChangeLog set ?', apiLogData),
      queryPromise('insert into APIVersions set ?', apiVersionData)
    ]);
    await createFn(apiLogData.ApiId);
  } catch (error) {
    console.log(error);
    ctx.body = {
      "success": false,
      "code": 401,
      "message": "database Error",
      "status": null,
      "data": null
    }
  }

});
// 查询接口(已测试完成)
router.get('/api/projects/:projectId/apis', async ctx => {
  const replyFn = async (result) => {
    ctx.body = {
      "success": true,
      "code": 200,
      "message": "API update successfully",
      "status": null,
      "data": {
        "apis": result[0]
      }
    }
  }
  const result = await queryPromise('select ApiID,ApiName,Endpoint,RequestMethod from APIs where ProjectID = ? ', ctx.params.projectId)
  await replyFn(result)
})

router.put('/api/projects/:projectId/apis/:apiId', async ctx => {
  const { apiId } = ctx.params;
  const { apiName, apiPath, httpMethod, requestParams, responseParams, changedBy, changeDescription, versionNumber } = ctx.request.body;
  const ChangeFn = async () => {
    ctx.body =
    {
      "success": true,
      "code": 200,
      "message": "API update successfully",
      "status": null,
      "data": null
    }
  }
  try {
    await Promise.all([
      queryPromise('update APIs set ApiName = ?,EndPoint = ?,RequestMethod = ? where ApiId = ?', [apiName, apiPath, httpMethod, apiId]),
      queryPromise('update APIResponses set ResponseBody = ? where ApiId = ?', [responseParams, apiId]),
      queryPromise('insert into APIChangeLog (ApiId,ChangeDescription, ChangedBy) VALUES (?, ?, ?)', [apiId, changeDescription, changedBy]),
      queryPromise('insert into APIVersions (ApiId,VersionNumber, CreatedBy) VALUES (?, ?, ?)', [apiId, versionNumber, changedBy])
    ]);
    await ChangeFn()
  } catch (error) {
    ctx.body = {
      "success": false,
      "code": 401,
      "message": "database Error",
      "status": null,
      "data": null
    }
  }
})

router.delete('/api/projects/:projectId/apis/:apiId', async ctx => {
  const { apiId } = ctx.params;
  // 这里并不需要传入projectid 为什么呢,因为开启了级联删除,而且apiid是唯一的
  const deleteFn = async () => {
    ctx.body = {
      "success": true,
      "code": 200,
      "message": "API delete successfully",
      "status": null,
      "data": null
    }
  }
  await queryPromise('delete from APIs where apiId = ? ', [apiId])
  await deleteFn()
})

export default router