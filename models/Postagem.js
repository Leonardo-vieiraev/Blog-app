const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Postagem = new Schema({
    titulo: {
        type: String, 
        required: true
        },
    slug: {
        type: String, 
        required: true
    },
    descricao: {
        type: String, 
        required: true
    },
    conteudo: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    categoria: {
        type: Schema.Types.ObjectId,
        ref: "categorias",
        required: true
    }

})

mongoose.model("postagens", Postagem);