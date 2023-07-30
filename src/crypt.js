import bcrypt from "bcryptjs";



export const encriptar = async (texto) => {

    const hash = await bcrypt.hash(texto, 10);
    return hash;

}



export const comparar = async (texto, hash) => {

    return await bcrypt.compare(texto, hash);

}

//module.export = {encriptar, comparar}

