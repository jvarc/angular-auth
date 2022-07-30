const { response } = require('express');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const {generarJWT} = require('../helpers/jwt');
const { validarJWT } = require('../middlewares/validar-jwt');

//Crear Usuario
const crearUsuario = async(req, res = response) =>{

    const {email, name, password} = req.body

    try {  
        // Verificar el email unico
        const usuario = await Usuario.findOne({email});
        if(usuario){
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe un usuario con ese email'
            });
        }

        // Crear usuario con el modelo
        const dbUser = new Usuario( req.body);

        // Hashear la contraseña
        const salt = bcrypt.genSaltSync();
        dbUser.password = bcrypt.hashSync(password, salt);
   

        // Generar el JWT
        const token = await generarJWT(dbUser.id, dbUser.name);

        // Crear usuario de BD
        await dbUser.save();

        // Generar respuesa exitosa
        return res.status(201).json({
            ok: true,
            uid: dbUser.id,
            name,
            email,
            token
        })

  
    } catch (error) {

        console.log('Surgio el error:', error)
        return res.status(500).json({
            ok: false,
            msg: 'Comunicarse con el administrador'
        });
        
    }
};


//Login Usuario
const loginUsuario = async(req, res = response) =>{

    const {email, password} = req.body

    try {
        const dbUser = await Usuario.findOne({email})

        //Confirmar email hace match
        if(!dbUser){
            return res.status(400).json({
                ok: false,
                msg: 'Usuario o contraseña invalida'
            });
        }

        //confirmar password hace match
        const validPassword = bcrypt.compareSync( password, dbUser.password)

        if(!validPassword){
            return res.status(400).json({
                ok: false,
                msg: 'Usuario o contraseña invalida'
            }); 
        }

        // Generar el JWT
        const token = await generarJWT(dbUser.id, dbUser.name);

        // Generar respuesta exitosa
        return res.status(201).json({
            ok: true,
            uid: dbUser.id,
            name: dbUser.name,
            email,
            token
        })

        
    } catch (error) {
        console.log('Surgio el error: ', error);
        return res.status(500).json({
            ok: false,
            msg: 'Comuniquese con el administrador'
        });
    }

}

// Renovar token
const renovarToken = async(req, res = response) =>{

    const {uid} = req;
    
    // Leer la base de datos
    const dbUser = await Usuario.findById(uid);

    // Generar el JWT
    const token = await generarJWT(uid, dbUser.name);    

    return res.json({
        ok: true,
        name: dbUser.name,
        email: dbUser.email,
        uid,
        token
    });
}

//Exportacion de modulos
module.exports = {
    crearUsuario,
    loginUsuario,
    renovarToken
}