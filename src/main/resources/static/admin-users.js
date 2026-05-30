function cargarUsuarios() {
    fetch('/api/usuarios/listar') 
        .then(res => {
            if (!res.ok) throw new Error("Error en la respuesta del servidor");
            return res.text();
        })
        .then(texto => texto ? JSON.parse(texto) : [])
        .then(usuarios => {
            const tabla = document.getElementById('tabla-usuarios-body');
            if (!tabla) return;
            
            tabla.innerHTML = ""; 
            if (usuarios.length === 0) {
                tabla.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No tienes permisos o no hay usuarios.</td></tr>";
                return;
            }

            usuarios.forEach(u => {
                tabla.innerHTML += `
                    <tr style="border-bottom: 1px solid #444;">
                        <td>${u.id}</td>
                        <td>${u.username}</td>
                        <td>${u.password}</td> 
                        <td><span class="badge">${u.role}</span></td>
                        <td>
                            <button onclick="prepararEdicionUsuario(${u.id}, '${u.username}')" style="color:#ff9800; cursor:pointer; background:none; border:1px solid #ff9800; border-radius:4px; padding:2px 5px; margin-right:5px;">✏️ Editar</button>
                            <button onclick="eliminarUsuario(${u.id})" style="color:#ff5252; cursor:pointer; background:none; border:none;">🗑️ Borrar</button>
                        </td>
                    </tr>`;
            });
        })
        .catch(err => console.error("Error cargando usuarios:", err));
}

function crearUsuarioDesdeAdmin() {
    const user = document.getElementById('new-username').value;
    const pass = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    if (!user || !pass) {
        alert("Por favor, completa usuario y contraseña.");
        return;
    }

    const params = new URLSearchParams();
    params.append('username', user);
    params.append('password', pass);
    params.append('role', role);

    fetch('/api/usuarios/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(res => {
        if (res.ok) {
            alert("Usuario creado con éxito");
            document.getElementById('new-username').value = "";
            document.getElementById('new-password').value = "";
            cargarUsuarios();
        } else {
            alert("Error al crear el usuario. Quizás ya existe.");
        }
    });
}

function prepararEdicionUsuario(id, nombreActual) {
    const nuevoNombre = prompt("Nuevo nombre de usuario:", nombreActual);
    const nuevaClave = prompt("Nueva contraseña:");

    if (nuevoNombre && nuevaClave) {
        const params = new URLSearchParams();
        params.append('id', id);
        params.append('username', nuevoNombre);
        params.append('password', nuevaClave);

        fetch('/api/usuarios/editar-desde-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        }).then(res => {
            if (res.ok) {
                alert("Usuario actualizado");
                cargarUsuarios();
            }
        });
    }
}

function eliminarUsuario(id) {
    if (confirm("¿Estás seguro de que querés eliminar a este usuario?")) {
        fetch(`/api/usuarios/eliminar/${id}`, { method: 'POST' })
        .then(res => {
            if (res.ok) {
                alert("Usuario eliminado con éxito");
                cargarUsuarios();
            } else {
                alert("No tenés permisos para hacer esto");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("No se pudo eliminar el usuario");
        });
    }
}