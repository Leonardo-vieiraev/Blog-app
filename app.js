//Carregando módulos
const express = require('express');
const handlebars = require('express-handlebars');
const bodyparser = require('body-parser');
const admin = require("./routes/admin");
const usuarios = require("./routes/usuario");
const mongoose = require('mongoose');
const path = require("path");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require("./config/auth")(passport);
require("./models/Postagem");
require("./models/Categoria");
const Postagem = mongoose.model("postagens");
const Categoria = mongoose.model("categorias");

const app = express();

//Configurações

    //Sessão
    app.use(session({
        secret: "cursodenode",
        resave: true,
        saveUninitialized: true
    }));
    
    //Autenticação com o passport. Deve ser feita entre o bloco que configura a sessão e o bloco que configura o flash
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    //Middleware
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.error = req.flash('error');
        res.locals.user = req.user || null;
        next();
    });

    //Bodyparser
    app.use(bodyparser.urlencoded({extended: true}));
    app.use(bodyparser.json());

    //handlebars
    app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}));
    app.set('view engine', 'handlebars');

    //Mongoose
    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://127.0.0.1:27017/blogapp").then(() => {
         console.log("Conectado ao banco de dados");
    }).catch((err) => {
        console.log("Erro ao conectar com o banco de dados: " + err);
    });

    //Public
    app.use(express.static(path.join(__dirname, "public")));
    
    //Rotas
    app.use('/admin', admin);
    app.use('/usuarios', usuarios);

    app.get('/', (req, res) => {

    // Fetch all posts
    Postagem.find().lean().populate("categoria").sort({data: "desc"}).then((postagens) => {

        // Render the posts
        res.render("index", {postagens: postagens});

    // Error handling
    }).catch((err) => {

        // Display error message
        req.flash('error_msg', "Houve um erro interno");

        // Redirect to 404 page
        res.redirect('/404');
        })
    })

    app.get('/postagem/:slug', (req, res) => {
        
    // Fetch the post with the specified slug
    Postagem.findOne({slug: req.params.slug}).lean().populate("categoria").then((postagem) => {
        // If post exists, render the page
        if(postagem) {
            res.render('postagem/index', {postagem: postagem});
        } else {
            // If post doesn't exist, display an error message and redirect to the homepage
            req.flash('error_msg', "Essa postagem não existe");
            res.redirect('/');
        }
    }).catch((err) => {
        // If an error occurs, display an error message and redirect to the homepage
        req.flash('error_msg', "Houve um erro interno");
        res.redirect('/');
        })
    })

    app.get('/categorias', (req, res) => {

        Categoria.find().lean().then((categorias) => {
            res.render("categorias/index", {categorias: categorias});
        }).catch((err) => {
            req.flash('error_msg', "Houve um erro ao renderizar a página");
            res.redirect('/');
        })
    })

    app.get('/categorias/:slug', (req, res) => {

        Categoria.findOne({slug: req.params.slug}).then((categoria) => {
            
            if(categoria) { 

                Postagem.find({categoria: categoria._id}).lean().populate("categoria").then((postagens) => {
                    res.render("categorias/posts", {categoria: categoria, postagens: postagens});
                })
                
            } else {
                req.flash('error_msg', 'Categoria não encontrada!');
                res.redirect('/categorias');
            }

        }).catch((err) => {
            req.flash('error_msg', "Houve um erro interno ao renderizar esta página");
            res.redirect('/categorias');
        })
    })


//Outros
const PORT = 8081
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}) 