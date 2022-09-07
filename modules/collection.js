
var collection = require('koa-router')()


module.exports = {
    init(router, sqliteDB) {
        
        
        async function create(name, desc, cover_file) {
            let sql = "INSERT INTO collection (name, desc, cover_file) VALUES(?, ?, ?)"
            let result = await sqliteDB.insertData(sql, [[name, desc, cover_file]])
            return result
        }

        collection.post('/create', async (ctx) => {
            let body = ctx.request.body
            let result = await create(body.name, body.desc, body.cover_file)

            ctx.status = result.code
            ctx.body = result.data
        })

        // 收藏句子
        async function addToCollection(juzi_id, collection_id) {
            let sql = "INSERT INTO [collection-juzi] (juzi_id, collection_id) VALUES(?, ?)"
            let result = await sqliteDB.insertData(sql, [[juzi_id, collection_id]])
            return result
        }

        collection.post('/addToCollection', async (ctx) => {
            let query = ctx.request.query
            let result = await addToCollection(query.juzi_id, query.collection_id)

            ctx.status = result.code
            ctx.body = result.data
        })
        
        // 移除收藏句子
        async function removeFromCollection(juzi_id, collection_id) {
            let sql = `DELETE FROM [collection-juzi] WHERE juzi_id=${juzi_id} AND collection_id=${collection_id}`
            let result = await sqliteDB.executeSql(sql)
            return result
        }

        collection.post('/removeFromCollection', async (ctx) => {
            let query = ctx.request.query
            let result = await removeFromCollection(query.juzi_id, query.collection_id)

            ctx.status = result.code
            ctx.body = result.data
        })

        // 获取collection
        async function getCollectionJuziById(id) {
            let sql = `SELECT juzi.* FROM juzi left join [collection-juzi] on [collection-juzi].collection_id=${id} WHERE juzi.id=[collection-juzi].juzi_id
            group by juzi.content`
            let result = await sqliteDB.queryData(sql)
            return result
        }

        collection.get('/juzi/:id', async (ctx) => {
            let params = ctx.request.params
            let result = await getCollectionJuziById(params.id)

            ctx.status = result.code
            ctx.body = result.data
        })

        // 获取collection列表
        async function getCollectionById(id) {
            let sql = `SELECT * FROM collection WHERE id=${id}`
            let result = await sqliteDB.queryData(sql)
            return result
        }

        collection.get('/get/:id', async (ctx) => {
            let params = ctx.request.params
            let result = await getCollectionById(params.id)

            ctx.status = result.code
            ctx.body = result.data
        })

        async function query(juzi_id) {
            let sql = `SELECT collection_id, collection.*, count(*) as rows FROM [collection-juzi]  left join collection on [collection-juzi].collection_id = collection.id 
            left join juzi on [collection-juzi].juzi_id=juzi.id group by collection_id
            `
            let result = await sqliteDB.queryData(sql)
            
            let sql2 = `SELECT * FROM collection`
            
            let result2 = await sqliteDB.queryData(sql2)

            if (juzi_id) {
                var sql3 = `SELECT * FROM [collection-juzi] WHERE juzi_id=
                ${juzi_id}`
                
                var result3 = await sqliteDB.queryData(sql3)
            }
            var obj =  {
                data: {
                    data: result2.data,
                    countData: result.data
                },
                code: result.code
            }

            if (juzi_id) {
                obj.data.juziData = result3.data
            }

            return obj
        }

        collection.get('/query', async (ctx) => {
            let queryObj = ctx.request.query
            let result = await query(queryObj.juzi_id)

            ctx.status = result.code
            ctx.body = result.data
        })

        router.use('/collection', collection.routes())
    }
}