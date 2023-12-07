var express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    multiparty = require('connect-multiparty');

const { MongoClient, ObjectId } = require("mongodb");
const objectId = require('mongodb').ObjectId;

var app = express();

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());

app.use(function(req, res, next){

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

var port = 8080;

app.listen(port);

// Server path
const url = 'mongodb://127.0.0.1:27017/';

// Name of the database
const dbName = "instagram";

const client = new MongoClient(url);

console.log('Servidor HTTP esta escutando na porta ' + port);

app.get('/', function (req, res) {

    res.send({ msg: 'Olá' })

});

// POST (create)
app.post('/api', function (req, res) {

    
    var date = new Date();
    time_stamp = date.getTime();

    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;

    fs.rename(path_origem, path_destino, function (err) {
        if (err) {
            res.status(500).json({ error: err });
            return
        }

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }

        async function run() {

            try {

                client.connect();

                const database = client.db(dbName);
                const collection = database.collection('postagens');
                const query = dados;

                const result = await collection.insertOne(query);

                console.log(`Foi inserido um documento com o _id: ${result.insertedId}`);

                res.json(`Foi inserido um documento com o _id: ${result.insertedId}`);

            } finally {

                await client.close();

            }
        }

        run().catch(console.dir);
    });

});

// GET (ready)
app.get('/api', function (req, res) {

    

    async function run() {
        try {

            client.connect();

            const database = client.db(dbName);
            const collection = database.collection('postagens');

            const cursor = collection.find({});
            const allValues = await cursor.toArray();

            if ((await collection.countDocuments()) === 0) {
                console.log("No documents found!");
            }

            console.log(allValues);
            res.json(allValues);

        } finally {

            await client.close();

        }
    }

    run().catch(console.dir);

});

// GET by ID (ready)
app.get('/api/:id', function (req, res) {

    async function run() {
        try {

            client.connect();

            const database = client.db(dbName);
            const collection = database.collection('postagens');

            const options = new objectId(req.params.id);
            const cursor = collection.findOne(options);

            if ((await collection.countDocuments()) === 0) {
                console.log("No documents found!");
            }

            console.log(await cursor);
            res.json(await cursor);

        } finally {

            await client.close();

        }
    }

    run().catch(console.dir);

});

app.get('/imagens/:imagem', function(req, res){

    var img = req.params.imagem;

    fs.readFile('./uploads/' + img, function(err, content) {
        if(err) {
            res.status(400).json(err);
            return
        }

        res.writeHead(200, {
            'content-type' : 'image/jpg'
        });
        res.end(content);
    });

});

// PUT by ID (update)
app.put('/api/:id', function (req, res) {

    var dados = req.body;

    async function run() {
        try {

            client.connect();

            const database = client.db(dbName);
            const collection = database.collection('postagens');

            const filter = { _id: new objectId(req.params.id) };

            const options = { upsert: true };

            const updateDoc = {
                $push: {
                    comentarios : {
                        id_comentario : new ObjectId(),
                        comentario : dados.comentario
                    }
                }
            };

            const result = await collection.updateOne(filter, updateDoc, options);

            console.log(result);
            res.json(result);

        } finally {

            await client.close();

        }
    }

    run().catch(console.dir);

});

// DELETE by ID (delete)
app.delete('/api/:id', function (req, res) {

    async function run() {
        try {

            client.connect();

            const database = client.db(dbName);
            const collection = database.collection('postagens');

            const result = await collection.updateOne(
                { },
                { $pull : {
                        comentarios: { id_comentario : new objectId(req.params.id) }
                    }
                },
                {multi: true}
            );

            res.json(result);

        } finally {

            await client.close();

        }
    }

    run().catch(console.dir);

});