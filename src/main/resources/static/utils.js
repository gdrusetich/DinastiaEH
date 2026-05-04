function obtenerUrlFinal(nombreArchivo) {
    if (!nombreArchivo || typeof nombreArchivo !== 'string')
        return rutaDefault;
    if (nombreArchivo.startsWith('http'))
        return nombreArchivo.replace("http://", "https://");
    if (nombreArchivo.startsWith('images/') || nombreArchivo.startsWith('/images'))
        return nombreArchivo.startsWith('/') ? nombreArchivo : `/${nombreArchivo}`;
    const cloudName = (window.globalConfig && window.globalConfig.CLOUDINARY_NAME) || 'dzkfjusut';
    
    const folder = (window.globalConfig && window.globalConfig.CLOUDINARY_FOLDER) || 'Home';
    
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${folder}/${nombreArchivo}`;
}