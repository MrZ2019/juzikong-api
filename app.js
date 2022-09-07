
var port = 9001

const path = require('path')
const fs = require('fs')
const Koa = require('koa')

var router = require('koa-router')()
var koaBody = require('koa-body')

var serve = require('koa-static')

var collectionModule = require('./modules/collection')
var tagModule = require('./modules/tag')

const app = new Koa()

app.use(koaBody({multipart: true}))

let pathPublic = path.join(__dirname + '/public')
let pathUpload = path.join(pathPublic + '/uploads')

app.use(serve(pathPublic))

app.use(async(ctx,next)=>{
	ctx.set('Access-Control-Allow-Origin','*')
	ctx.set('Access-Control-Allow-Headers','Content-Type,Content-Length,Authorization,Accept,X-Requested-With,Cache-Control')
	ctx.set('Access-Control-Allow-Methods','PUT,POST,GET,DELETE,OPTIONS')
	if(ctx.method=='OPTIONS'){
		ctx.body = 200;
	}else{
		await next()
	}
})


var SqliteDB = require('./sqlite3.js').SqliteDB;
 
 
 
var file = "juzikong.db";
 
var sqliteDB = new SqliteDB(file, function(exist) {
	var db = this
	if (!exist) {

		db.createTable(`CREATE TABLE juzi (
			id       INTEGER      PRIMARY KEY AUTOINCREMENT,
			content     TEXT  NOT NULL
		);
		`)
	}
});


router.get('/',  (ctx) => {
    ctx.body = "hello koa"
})

async function add(content) {
	return new Promise((resolve, reject)=> {
		let sql = "INSERT INTO juzi (content) VALUES(?)"
	
		sqliteDB.insertData(sql, [[content]])

		resolve('success')
	})
}

router.post('/add',  async (ctx) => {
    let body = ctx.request.body
    ctx.body = await add(body.content)
})

async function list(search='') {
		let where = ''
		if (search) {
			where = ` WHERE juzi.content LIKE '%${search}%'`
		}	
		let sql = `SELECT juzi.*, group_concat(tag.name) as tags, group_concat(tag.id) as tags_id FROM juzi left join [tag-juzi] on [tag-juzi].juzi_id=juzi.id left join tag on [tag-juzi].tag_id=tag.id 
		${where} group by juzi.content order by juzi.id desc`

	
		let result = await sqliteDB.queryData(sql)
		return result

}

router.get('/list',  async (ctx) => {
	let result = await list(ctx.request.query.search)

	ctx.status = result.code
	ctx.body = result.data
})


// async function tag(tag) {
// 	return new Promise((resolve, reject)=> {
// 		let sql = `SELECT * FROM juzi WHERE tags like '%${tag}%'`
	
// 		sqliteDB.queryData(sql, (rows) => {
//             resolve(JSON.stringify(rows))
//         })

		
// 	})
// }

// router.get('/tag/:tag',  async (ctx) => {
//     ctx.body = await tag(ctx.request.params.tag)
// })


async function remove(id) {
		let sql = "DELETE FROM juzi WHERE id=" + id
	
		let result = await sqliteDB.executeSql(sql)

		let sql2 = "DELETE FROM [tag-juzi] WHERE juzi_id=" + id
	
		let result2 = await sqliteDB.executeSql(sql2)

		let sql3 = "DELETE FROM [collection-juzi] WHERE juzi_id=" + id
	
		let result3 = await sqliteDB.executeSql(sql3)

		return result
}

router.get('/remove',  async (ctx) => {
	let result = await remove(ctx.request.query.id)

	ctx.status = result.code
	ctx.body = result.data	
})


async function edit(id, content) {
	return new Promise((resolve, reject)=> {
		let sql = `UPDATE juzi SET content = '${content}' WHERE id=` + id
	
		sqliteDB.executeSql(sql, () => {
            resolve('success')
        })

		
	})
}

router.post('/edit',  async (ctx) => {
    ctx.body = await edit(ctx.request.body.id, ctx.request.body.content)
})

router.post('/upload', async (ctx, next)=> {

	var file = ctx.request.files.file
	var stream = fs.createReadStream(file.filepath)
	var filename = new Date() - 0 + '-' + file.originalFilename
	var write = fs.createWriteStream(path.join(pathUpload,filename))

	stream.pipe(write)

	ctx.body = await new Promise((resolve)=> {
		resolve(filename)
	})

	console.log("%s uploaded", filename)
	
})

collectionModule.init(router, sqliteDB)
tagModule.init(router, sqliteDB)

app.use(router.routes())
app.listen(port)