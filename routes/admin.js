const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require("../models/Categoria");
require("../models/Postagem");
const Categoria = mongoose.model("categorias");
const Postagem = mongoose.model("postagens");
const {eAdmin} = require('../helpers/eAdmin');

router.get('/', (req, res) => {
    res.render("admin/index");
})

router.get('/categorias', eAdmin, (req, res) => {
    Categoria.find().sort({date:'desc'}).then((categorias) => {

        res.render("admin/categorias", {categorias: categorias.map(Categoria => Categoria.toJSON())});

    }).catch((err) => {

        req.flash("error_msg", "Houve um erro ao listar as categorias");
        res.render("/admin");

    });
})

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render("admin/addcategoria");
})

router.post('/categorias/nova', eAdmin, (req, res) => {

    //Validação do formulário
    var erros = [];

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: "Nome inválido"});
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.nome == null) {
        erros.push({texto: "Slug inválido"});
    }

    if(req.body.nome.length < 2) {
        erros.push({texto: "O nome da categoria é muito curto"});
    }

    if(erros.length > 0) {
        res.render("admin/addcategoria", {erros: erros});
    } else {
        
        //Criação da categoria no banco de dados
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        }

        new Categoria(novaCategoria).save().then(() => {

            req.flash('success_msg', "Categoria registrada com sucesso");
            res.redirect("/admin/categorias");

        }).catch(() => {

            req.flash('error_msg', "Erro ao salvar a categoria");
            res.redirect('admin/categorias');

        })
    }
})

router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categoria.findOne({_id:req.params.id}).then((categoria) => {
        res.render('admin/editcategorias', 
        {
            id: categoria._id, 
            nome: categoria.nome, 
            slug: categoria.slug
        });
    }).catch((err) => {
        req.flash('error_msg', "Esta categoria não existe");
        res.redirect('/admin/categorias');
    })
})

router.post('/categorias/edit', eAdmin, (req, res) => {

    const categoryId = req.body.id;

    if (!categoryId) {
        req.flash('error_msg', 'ID da categoria não fornecido');
        return res.redirect('/admin/categorias');
    }

    Categoria.findOne({_id:req.body.id}).then((categoria) => {
        
        categoria.nome = req.body.nome;
        categoria.slug = req.body.slug;

        categoria.save().then(() => {

            req.flash('success_msg', "Categoria alterada com sucesso");
            res.redirect('/admin/categorias');

        }).catch((err) => {

            req.flash('error_msg', "Erro ao editar categoria");
            res.redirect('/admin/categorias');

        })

    }).catch((err) => {

        req.flash('error_msg', "Houve um erro ao editar a categoria");
        res.redirect('/admin/categorias');
        
    })
})

router.post('/categorias/delete/:id', eAdmin, (req, res) => {
    Categoria.findOneAndDelete({ _id: req.params.id }).then(() => {
        req.flash("success_msg","Categoria deletada com sucesso!");
        res.redirect("/admin/categorias");
    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao deletar a categoria");
        res.redirect("/admin/categorias");
    })
})

router.get('/postagens', eAdmin, (req, res) => {
    Postagem.find().populate('categoria').sort({data:'desc'}).then((postagens) => {
        res.render("admin/postagens", {postagens: postagens.map(Postagem => Postagem.toJSON())});
    }).catch((err) => {
        req.flash('error_msg','Houve um erro ao listar as postagens');
    })
})

router.get('/postagens/add', eAdmin, (req, res) => {

    Categoria.find().then((categorias) => {
        res.render("admin/addpostagem", {categorias : categorias.map(Categoria => Categoria.toJSON())});
    }).catch((err) => {
        req.flash('error_msg', "Erro ao obter categorias");
    })
})

router.post('/postagens/nova', eAdmin,(req, res) => {

    errors = [];

    if (!req.body.titulo) {
        errors.push({texto:"Preencha o titulo da postagem"});
    }
    if (!req.body.descricao) {
        errors.push({texto:"Preencha a descrição da postagem"});
    }
    if (!req.body.slug) {
        errors.push({texto:"Adicione um slug para a postagem"});
    }
    if (!req.body.conteudo) {
        errors.push({texto:"Adicione um conteudo para a postagem"});
    }
    if (!req.body.categoria) {
        errors.push({texto:"Selecione uma opção de categoria"}); 
    }
    if (errors.length > 0){

        Categoria.find().then((categorias) => {
            res.render("admin/addpostagem", {errors: errors, categorias : categorias.map(Categoria => Categoria.toJSON())});
        }).catch((err) => {
            req.flash('error_msg', "Erro ao obter categorias");
        })

    } else {

        const novaPostagem = {
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria
        }
    
        new Postagem(novaPostagem).save().then(() => {
            req.flash('success_msg', 'Nova postagem criado com sucesso!');
            res.redirect('/admin/postagens');
        }).catch(() => {
            req.flash('error_msg', "Erro ao postar");
            res.redirect('/admin/postagens');
        })
    }
})

router.get('/postagens/edit/:id', eAdmin, (req, res) => {

    Postagem.findOne({_id:req.params.id}).lean().then((postagem) => {

        Categoria.find().lean().then((categorias) => {
            res.render('admin/editpostagens', {categorias : categorias, postagem: postagem });
        })

    }).catch((err) => {
        req.flash('error_msg', "Erro ao encontrar postagem");
        res.redirect('/admin/postagens');
    }) 
})

router.post('/postagens/edit', eAdmin, (req, res) => {

    Postagem.findOne({_id:req.body.id}).then((postagem) => {

        postagem.titulo = req.body.titulo;
        postagem.slug = req.body.slug;
        postagem.descricao = req.body.descricao;
        postagem.conteudo = req.body.conteudo;
        postagem.categoria = req.body.categoria; 

        postagem.save().then(() => {
            req.flash('success_msg', 'Postagem editada com sucesso');
            res.redirect('/admin/postagens');
        }).catch((err) => {
            req.flash('error_msg', "Erro ao editar postagem");
            res.redirect('/admin/postagens');
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro interno do servidor");
        console.log(err);
        res.redirect('/admin/postagens');
    })
})

router.get('/postagens/delete/:id', eAdmin, (req, res) => {
    Postagem.findOneAndDelete({_id:req.params.id}).then(() => {
        req.flash('success_msg', "Postagem deletada com sucesso");
        res.redirect('/admin/postagens');
    }).catch((err) => {
        req.flash('error_msg', "Erro ao deletar postagem");
    })
})

module.exports = router;