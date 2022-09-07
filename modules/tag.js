
var tag = require('koa-router')()


module.exports = {
    init(router, sqliteDB) {
        
       
        async function query() {
            
            let sql = `SELECT * FROM tag`
            
            let result = await sqliteDB.queryData(sql)

            return result
        }

        tag.get('/query', async (ctx) => {
            let queryObj = ctx.request.query
            let result = await query()

            ctx.status = result.code
            ctx.body = result.data
        })
        
        async function add(juzi_id, tags) {
            let sql = `DELETE FROM [tag-juzi] WHERE juzi_id=${juzi_id}`

            await sqliteDB.executeSql(sql)

            let sql2 = `INSERT INTO [tag-juzi] (juzi_id, tag_id) VALUES (?, ?)`
            
            let array = []
            tags = tags.split(',')
            for (let index = 0; index < tags.length; index++) {
                const element = tags[index];
                array.push([juzi_id, element])
            }
            let result2 = await sqliteDB.insertData(sql2, array)

            return result2
        }

        tag.get('/add', async (ctx) => {
            let queryObj = ctx.request.query
            let result = await add(queryObj.juzi_id, queryObj.tags)

            ctx.status = result.code
            ctx.body = result.data
        })

        // 获取 tag 句子
        async function getTagJuziById(id) {
            let sql = `SELECT * FROM juzi LEFT JOIN [tag-juzi] ON [tag-juzi].[juzi_id]=juzi.id LEFT JOIN [tag] ON [tag-juzi].tag_id=tag.id WHERE tag.id=${id}`
            let result = await sqliteDB.queryData(sql)
            return result
        }

        tag.get('/juzi/:id', async (ctx) => {
            let params = ctx.request.params
            let result = await getTagJuziById(params.id)

            ctx.status = result.code
            ctx.body = result.data
        })
        router.use('/tag', tag.routes())
    }
}