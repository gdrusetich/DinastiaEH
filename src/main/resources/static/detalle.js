let campoActual = ''; 
let urlActual = '';
let productoActual = null;
let categoriasSeleccionadas = [];
let imagenSeleccionadaIndex = 0;
let currentIndex = 0;
let quillEditor = null;
window.FOLDER_SYSTEM = FOLDER_SYSTEM;

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    await cargarConfiguracion();
    window.productId = productId;
    configurarInterfazUsuario();
    configurarBotonInicio();
    if (productId) {
        await cargarDatosDelProducto(productId);
    } else {
        console.error("No se encontró el ID del producto en la URL");
    }
    inicializarLupa();
});

let globalConfig = {};

async function cargarConfiguracion() {
    try {
        const res = await fetch(`${API_URL}/api/configuraciones`); 
        if (!res.ok) throw new Error("No se pudo obtener la configuración");
        globalConfig = await res.json();
        console.log("Configuración cargada:", globalConfig);        
    } catch (e) {
        console.error("Error cargando configuración global:", e);
    }
}

async function cargarSimilares(categoriaId, idActual) {
    try {
        const res = await fetch(`${API_URL}/products/categoria/${categoriaId}`);
        const data = await res.json();
        const similares = Array.isArray(data) ? data : (data.content || []);
        const esUsuarioReal = (window.nombreUsuario && window.nombreUsuario !== 'Invitado');
        const filtrados = similares.filter(p => {
            return Number(p.id) !== Number(idActual) && p.oculto !== true && p.oculto !== "true";
        });

        const container = document.getElementById('related-container');
        container.innerHTML = "";

        filtrados.forEach(p => {
            const mainImgObj = p.images.find(i => i.isMain) || p.images[0];
            const rawUrl = mainImgObj ? (mainImgObj.url || mainImgObj) : null;
            let imgUrl = obtenerUrlFinal(rawUrl);
            const card = document.createElement('div');
            card.className = 'related-card';
            const contenidoPrecio = esUsuarioReal 
                ? `<span class="currency">$</span><span class="amount">${p.price.toLocaleString('es-AR')}</span>`
                : `<button class="btn-ingresar-link" onclick="window.location.href='/login'">Ingresar</button>`;

            card.innerHTML = `
                <img src="${imgUrl}" alt="${p.title}" onclick="window.location.href='/detalle?id=${p.id}'" onerror="this.src='${rutaDefault}';">
                <div class="related-info">
                    <h4>${p.title}</h4>
                    <div class="price-tag">
                        ${contenidoPrecio}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        if (filtrados.length === 0) {
            container.innerHTML = "<p>No hay productos similares por ahora.</p>";
        } else {
            setTimeout(iniciarAnimacionSlider, 500); 
        }
    } catch (e) {
        console.error("Error en similares:", e);
    }
}

function iniciarAnimacionSlider() {
    const slider = document.getElementById("related-container");
    if (!slider) return;

    const necesitaSlider = () => {
        return slider.scrollWidth > slider.offsetWidth;
    };

    if (!necesitaSlider()) {
        console.log("No hace falta slider, entran todos en pantalla.");
        return;
    }

    setInterval(() => {
        if (!necesitaSlider()) return;
        const firstChild = slider.firstElementChild;
        if (!firstChild) return;
        const estilo = window.getComputedStyle(slider);
        const gap = parseInt(estilo.columnGap) || 20; 
        const desplazamiento = firstChild.offsetWidth + gap;
        slider.style.transition = "transform 0.5s ease";
        slider.style.transform = `translateX(-${desplazamiento}px)`;
        setTimeout(() => {
            slider.style.transition = "none";
            slider.style.transform = "translateX(0)";
            slider.appendChild(firstChild);
        }, 500);
    }, 3000);
}

function irAlLoginConRetorno() {
    localStorage.setItem("returnUrl", window.location.pathname + window.location.search);
    window.location.href = '/login';
}

function cerrarModalCategorias() {
    const modal = document.getElementById("modal-categorias");
    if(modal) modal.style.display = "none";
}

async function abrirEditorCategorias() {
    const modal = document.getElementById("modal-categorias");
    const container = document.getElementById("lista-todas-categorias");
    
    if (!productoActual) return alert("Error: Producto no cargado");
    try {
        const resAll = await fetch(`${API_URL}/categories/all`);
        const todas = await resAll.json();        
        const actualesIds = productoActual.categories ? productoActual.categories.map(c => c.id) : [];
        container.innerHTML = "";
        todas.forEach(cat => {
            const isChecked = actualesIds.includes(cat.id) ? "checked" : "";
            const div = document.createElement("div");
            div.className = "cat-item-admin"; // Cambié el nombre para no chocar con tu CSS viejo
            div.innerHTML = `
                <input type="checkbox" id="cat-${cat.id}" value="${cat.id}" ${isChecked}>
                <label for="cat-${cat.id}">${cat.name}</label>
            `;
            container.appendChild(div);
        });

        modal.style.display = "flex";
    } catch (error) {
        console.error("Error al abrir editor:", error);
    }
}

async function guardarCategorias() {
    const checkboxes = document.querySelectorAll('#lista-todas-categorias input[type="checkbox"]:checked');
    const nuevosIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    const response = await fetch(`${API_URL}/products/${productoActual.id_producto || productoActual.id}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevosIds)
    });

    if (response.ok) {
        alert("¡Categorías actualizadas!");
        location.reload();
    }
}

function configurarInterfazUsuario() {
    const nombreUsuario = localStorage.getItem("userName");
    const display = document.getElementById("username-display");
    const userGreeting = document.getElementById("user-greeting");
    const btnPerfil = document.getElementById("btn-perfil");
    const btnCerrarSesion = document.getElementById("btn-logout");
    const btnLogin = document.getElementById("btn-login");

    const esLogueado = nombreUsuario && nombreUsuario !== "null";

    if (display) display.innerText = esLogueado ? nombreUsuario : "Invitado";
    if (userGreeting) userGreeting.innerText = esLogueado ? `Hola, ${nombreUsuario}` : "Hola, Invitado";
    
    if (btnPerfil) btnPerfil.style.display = esLogueado ? "inline-block" : "none";
    if (btnCerrarSesion) btnCerrarSesion.style.display = esLogueado ? "inline-block" : "none";
    if (btnLogin) btnLogin.style.display = esLogueado ? "none" : "inline-block";
}

function configurarBotonInicio() {
    const btnInicio = document.querySelector(".logo-title"); // Cambiado de .brand a .logo-title
    if (btnInicio) {
        btnInicio.style.cursor = "pointer"; 
        btnInicio.onclick = () => {
            const role = localStorage.getItem("role");
            window.location.href = (role === "ADMIN") ? "/admin" : "/home";
        };
    }
}

async function cargarDatosDelProducto(productId) {
    try {
        const response = await fetch(`${API_URL}/products/find-id/${productId}`);
        const producto = await response.json();
        if (!response.ok) throw new Error("Producto no encontrado");
        productoActual = producto;
        window.productoActual = producto;

        renderizarInformacionBasica(productoActual);
        renderizarCategorias(productoActual.categories);
        renderizarGaleria(productoActual.images);
        configurarBotonWhatsApp(productoActual.title);
        if (producto.categories && producto.categories.length > 0) {
            const categoriaIdParaSimilares = producto.categories[producto.categories.length - 1].id;
            await cargarSimilares(categoriaIdParaSimilares, producto.id);
             const container = document.getElementById('related-container');
            if (container.children.length > 4) {
                iniciarAnimacionSlider();
            }
        }
    } catch (error) {
        console.error("Error cargando el producto:", error);
    }
}

function renderizarInformacionBasica(producto) {
    const titleEl = document.querySelector(".product-info h1");
    const descEl = document.getElementById("product-description");
    const priceEl = document.getElementById("product-price");

    if (titleEl) titleEl.innerText = producto.title;
    if (descEl) descEl.innerHTML = producto.description;
    
    if (priceEl) {
        priceEl.innerText = `$ ${producto.price}`;
    }
}

function renderizarCategorias(categories) {
    const catContainer = document.getElementById("categories-container");
    if (!catContainer || !Array.isArray(categories)) return;

    catContainer.innerHTML = "";
    categories.forEach(cat => {
        const span = document.createElement("span");
        span.className = "category-badge";
        span.innerText = (typeof cat === 'object') ? cat.name : cat;
        catContainer.appendChild(span);
    });
}

function renderizarGaleria(images) {
    const thumbContainer = document.getElementById("thumbnails-container");
    const mainImg = document.getElementById("main-product-image");
    
    if (!thumbContainer || !mainImg || !images || !Array.isArray(images)) return;
    
    thumbContainer.innerHTML = ""; 
    const idsVistos = new Set();
    const idPrincipal = productoActual.mainImageId;
    
    const imagenesOrdenadas = [...images].sort((a, b) => {
        if (a.id === idPrincipal) return -1;
        if (b.id === idPrincipal) return 1;
        return 0;
    });

    imagenesOrdenadas.forEach((img, index) => {
        if (!img || idsVistos.has(img.id)) return;
        idsVistos.add(img.id);
        const imgElement = document.createElement("img");
        const urlFinal = obtenerUrlFinal(img.url);
        imgElement.src = urlFinal;
        imgElement.className = "thumb-box";
        imgElement.setAttribute('data-image-id', img.id);

        if (index === 0) { 
            mainImg.src = urlFinal;
            mainImg.setAttribute('data-image-id', img.id);
        }

        imgElement.onclick = () => { 
            mainImg.src = urlFinal; 
            mainImg.setAttribute('data-image-id', img.id);
        };         
        thumbContainer.appendChild(imgElement);
    });

    mainImg.style.cursor = "zoom-in";
    mainImg.onclick = null; 

    mainImg.addEventListener('click', () => {
        const idActual = mainImg.getAttribute('data-image-id');
        const index = productoActual.images.findIndex(i => i.id == idActual);
        if (typeof window.abrirModalZoom === 'function') {
            window.abrirModalZoom(index);
        } else {
            console.error("La función abrirModalZoom no está disponible.");
        }
    });
}

function configurarBotonWhatsApp(titulo) {
    const waBtn = document.getElementById("whatsapp-btn");
    if (waBtn && globalConfig.WHATSAPP_NUMBER) {
        waBtn.onclick = () => {
            const mensaje = `Hola! Me interesa el producto: ${titulo}`;
            window.open(`https://wa.me/${globalConfig.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, "_blank");
        };
    }
}

async function guardarCambioUnico() {
    let nuevoValor = "";

    if (campoActual === 'description') {
        nuevoValor = tinymce.get('editor-admin').getContent();
    } else {
        const inputComun = document.getElementById('input-dinamico');
        nuevoValor = inputComun ? inputComun.value : ""; 
    }
    if (!nuevoValor || nuevoValor.trim() === "") {
        return alert("El campo no puede estar vacío");
    }

    try {
        const response = await fetch(urlActual + encodeURIComponent(nuevoValor), { 
            method: 'PUT' 
        });

        if (response.ok) {
            if (campoActual === 'description') {
                tinymce.remove('#editor-admin');
            }
            location.reload(); 
        } else {
            alert("Error al actualizar. Status: " + response.status);
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de conexión al servidor.");
    }
}

function cerrarModalUnico() {
    if (window.campoEditando === 'description') {
        tinymce.remove('#editor-admin');
    }
    document.getElementById('modal-edicion-unica').style.display = 'none';
}

function habilitarEdicion(campo) {
    const modal = document.getElementById('modal-edicion-unica');
    const tituloModal = document.getElementById('modal-titulo');
    const contenedor = document.getElementById('contenedor-input');
    campoActual = campo;

    if (!modal) return;

    let valorActual = "";

    switch (campo) {
        case 'title':
            tituloModal.innerText = "Editar Título";
            urlActual = `${API_URL}/products/update-title/${window.productId}?title=`;
            valorActual = document.querySelector(".product-info h1")?.innerText || "";
            contenedor.innerHTML = `<input type="text" id="input-dinamico" style="width:100%; padding:8px;" value="${valorActual}">`;
        break;
            
        case 'price':
            tituloModal.innerText = "Editar Precio";
            urlActual = `${API_URL}/products/update-price/${window.productId}?price=`;
            let pPrecio = document.getElementById("product-price");
            valorActual = pPrecio.innerText.replace('$', '').replace(/\./g, '').replace(',', '.').trim();
            contenedor.innerHTML = `<input type="number" id="input-dinamico" style="width:100%; padding:8px;" value="${valorActual}">`;
        break;            

        case 'stock':
            tituloModal.innerText = "Editar Stock";
            urlActual = `${API_URL}/products/update-stock/${window.productId}?stock=`;
            valorActual = document.getElementById("display-stock")?.innerText || "0";
            contenedor.innerHTML = `<input type="number" id="input-dinamico" style="width:100%; padding:8px;" value="${valorActual}">`;
        break;
            
        case 'description':
            tituloModal.innerText = "Editar Descripción";
            urlActual = `${API_URL}/products/update-description/${window.productId}?description=`;
            valorActual = document.getElementById('product-description')?.innerHTML || ""; 
            contenedor.innerHTML = `<textarea id="editor-admin"></textarea>`;
            if (tinymce.get('editor-admin')) {
                tinymce.remove('#editor-admin');
            }

            tinymce.init({
                selector: '#editor-admin',
                setup: function (editor) {
                    editor.on('init', function () {
                        editor.setContent(valorActual); // Setea el texto apenas arranca
                        editor.focus();
                    });
                },
            height: 300,
            menubar: false
            });
        break;
    }
    modal.style.display = 'flex';
}

function cerrarModalUnico() {
    const modal = document.getElementById('modal-edicion-unica');
    if (modal) modal.style.display = 'none';
}


async function guardarCambiosFotos() {
    const listaUrls = productData.images.map(img => typeof img === 'string' ? img : img.url);

    try {
        const response = await fetch(`/products/${window.productId}/images`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listaUrls)
        });
        
        if (response.ok) console.log("Prioridad actualizada en el servidor");
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

async function marcarComoPrincipal() {
    const imgElement = document.getElementById('main-product-image');
    const imagenId = imgElement.getAttribute('data-image-id'); 
    const pId = productoActual.idProducto || productoActual.id;

    if (!imagenId || imagenId === "null") {
        alert("Error: Esta imagen no tiene un ID válido en la base de datos.");
        return;
    }

    try {
        const response = await fetch(`/products/${pId}/main-image/${imagenId}`, {
            method: 'PUT'
        });

        if (response.ok) {
            alert("¡Portada actualizada!");
            location.reload();
        } else {
            alert("Error al actualizar la portada.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function borrarImagenActual() {
    const mainImg = document.getElementById('main-product-image');
    const imageId = mainImg.getAttribute('data-image-id'); 

    if(!imageId) return alert("No se puede identificar la imagen para borrar");

    if(confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
        try {
            // USAR API_URL para que pegue al puerto 8081
            const response = await fetch(`${API_URL}/products/images/${imageId}`, {
                method: 'DELETE'
            });

            if(response.ok) {
                alert("Imagen eliminada con éxito");
                location.reload(); 
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert("Error al borrar: " + (errorData.message || "Consulte al administrador"));
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    }
}

async function subirNuevaImagen(input) {
    if (input.files && input.files[0]) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        
        if (!productId) {
            alert("No se encontró el ID del producto.");
            return;
        }

        const file = input.files[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", productId);

        try {
            const response = await fetch(`${API_URL}/products/images/uploads`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert("¡Imagen subida con éxito!");
                location.reload(); 
            } else {
                const errorData = await response.text();
                alert("Error al subir: " + errorData);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        }
    }
}

tinymce.init({
    selector: '#editor-admin',
    license_key: 'gpl',
    height: 300,
    menubar: false,
    plugins: 'lists link image table code help wordcount',
    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | code',
    setup: function (editor) {
    }
});

function inicializarLupa() {
    const mainImg = document.getElementById("main-product-image");
    const zoomResult = document.getElementById("zoom-result");
    const infoOriginal = document.getElementById("info-original");
    const container = document.querySelector(".main-image-container");

    if (!mainImg || !zoomResult || !infoOriginal || !container) return;

    if (window.innerWidth < 768) {
        zoomResult.style.display = "none";
        return;
    }

    container.addEventListener("mouseenter", () => {
        zoomResult.style.display = "block";
        infoOriginal.style.opacity = "0";
        infoOriginal.style.pointerEvents = "none";        
        zoomResult.style.backgroundImage = `url('${mainImg.src}')`;
        zoomResult.style.backgroundSize = `${mainImg.offsetWidth * 3}px auto`;
    });

    container.addEventListener("mouseleave", () => {
        zoomResult.style.display = "none";
        infoOriginal.style.opacity = "1";
        infoOriginal.style.pointerEvents = "auto";
    });

    container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        zoomResult.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    });

    const observer = new MutationObserver(() => {
        const thumbnails = document.querySelectorAll(".thumb-box");
        thumbnails.forEach(thumb => {
            thumb.addEventListener("mouseenter", () => {
                mainImg.src = thumb.src;
                if (zoomResult.style.display === "block") {
                    zoomResult.style.backgroundImage = `url('${thumb.src}')`;
                }
            });
        });
    });

    const thumbsContainer = document.getElementById("thumbnails-container");
    if (thumbsContainer) {
        observer.observe(thumbsContainer, { childList: true });
    }
}