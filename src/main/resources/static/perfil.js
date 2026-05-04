let esVisible = false;

function inicializarPass() {
    const pText = document.getElementById('pass-text');
    const pass = window.userCurrentPass;
    if (pText && pass) {
        pText.innerText = "*".repeat(pass.length);
    }
}

function toggleOjoPass() {
    const pText = document.getElementById('pass-text');
    const pass = window.userCurrentPass;
    
    esVisible = !esVisible;
    
    if (esVisible) {
        pText.innerText = pass; // Muestra la clave real
        pText.style.color = "#00ff88"; // Verde
    } else {
        pText.innerText = "*".repeat(pass.length); // Vuelve a asteriscos
        pText.style.color = "white";
    }
}

function abrirEdicion() {
    document.getElementById('contenedor-edicion').classList.remove('hidden');
    document.getElementById('botones-principales').classList.add('hidden');
}

function cerrarEdicion() {
    document.getElementById('contenedor-edicion').classList.add('hidden');
    document.getElementById('botones-principales').classList.remove('hidden');
}

function actualizarPerfil() {
    const user = document.getElementById('nuevo-nombre').value;
    const pass = document.getElementById('nueva-pass').value;
    const params = new URLSearchParams();
    params.append('nuevoUser', user);
    params.append('nuevoPass', pass);

    fetch('/usuarios/actualizar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    }).then(res => {
        if (res.ok) {
            alert("¡Perfil actualizado con éxito!");
            window.location.reload(); 
        } else {
            alert("Error al actualizar");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosNegocio();
});

async function cargarDatosNegocio() {
    try {
        const response = await fetch('/api/configuraciones');
        const config = await response.json();
        document.getElementById('val-whatsapp').innerText = config.WHATSAPP_NUMBER || "No cargado";
        document.getElementById('val-nombre').innerText = config.NOMBRE_LUGAR || "Mi Negocio";
        document.getElementById('val-direccion').innerText = config.DIRECCION || "Dirección no disponible";

        document.getElementById('edit-whatsapp').value = config.WHATSAPP_NUMBER || "";
        document.getElementById('edit-nombre').value = config.NOMBRE_LUGAR || "";
        document.getElementById('edit-banner').value = config.BANNER_URL || "/images/banner-default.webp";
        
        document.getElementById('edit-direccion').value = config.DIRECCION || "";
        document.getElementById('edit-barrio').value = config.BARRIO || "";
        document.getElementById('edit-localidad').value = config.LOCALIDAD || "";
        document.getElementById('edit-maps').value = config.GOOGLE_MAPS_URL || "";
        document.getElementById('edit-cloudinary-name').value = config.CLOUDINARY_NAME || "";
        document.getElementById('edit-cloudinary-preset').value = config.CLOUDINARY_PRESET || "";

    } catch (error) {
        console.error("Error cargando configuración:", error);
    }
}

function abrirEdicionNegocio() {
    document.getElementById('info-negocio-body').classList.add('hidden');
    document.getElementById('form-negocio-edicion').classList.remove('hidden');
}

function cerrarEdicionNegocio() {
    document.getElementById('info-negocio-body').classList.remove('hidden');
    document.getElementById('form-negocio-edicion').classList.add('hidden');
}

async function guardarConfiguracion() {
    const payload = {
            WHATSAPP_NUMBER: document.getElementById('edit-whatsapp').value,
            NOMBRE_LUGAR: document.getElementById('edit-nombre').value,
            BANNER_URL: document.getElementById('edit-banner').value,
            CLOUDINARY_NAME: document.getElementById('edit-cloudinary-name').value,
            CLOUDINARY_PRESET: document.getElementById('edit-cloudinary-preset').value,  
            DIRECCION: document.getElementById('edit-direccion').value,
            BARRIO: document.getElementById('edit-barrio').value,
            LOCALIDAD: document.getElementById('edit-localidad').value,
            GOOGLE_MAPS_URL: document.getElementById('edit-maps').value
        };

    try {
        const response = await fetch('/api/admin/configuraciones/actualizar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("¡Negocio actualizado!");
            location.reload(); // Recargamos para ver los cambios
        } else {
            alert("Error al actualizar");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function subirBannerCloudinary(input) {
    const status = document.getElementById('status-subida');
    const file = input.files[0];
    if (!file) return;

    status.innerText = "⏳ Subiendo...";

    // 1. Obtenemos los valores desde los inputs del formulario de negocio
    const cloudName = document.getElementById('edit-cloudinary-name').value;
    const uploadPreset = document.getElementById('edit-cloudinary-preset').value;

    if (!cloudName || !uploadPreset) {
        alert("Primero configurá el Cloud Name y el Preset en la tarjeta de negocio.");
        status.innerText = "❌ Falta configuración";
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset); // Aquí irá "preset_standard"

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.secure_url) {
            document.getElementById('edit-banner').value = data.secure_url;
            status.innerText = "✅ ¡Foto lista para guardar!";
            status.style.color = "#00ff88";
        } else {
            console.error("Error Cloudinary:", data);
            status.innerText = "❌ Error en la subida";
        }
    } catch (error) {
        console.error("Error:", error);
        status.innerText = "❌ Error de conexión";
    }
}