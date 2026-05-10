package com.ProjectoJava.objetos.controller;

import com.ProjectoJava.objetos.repository.UserRepository;
import com.ProjectoJava.objetos.entity.User;
import com.ProjectoJava.objetos.entity.Role;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;

@Controller
@RequestMapping("/api/usuarios") // Todas las rutas empezarán con /usuarios
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/gestion")
    public String gestionarUsuarios(Model model, HttpSession session) {
        if (!"ADMIN".equals(session.getAttribute("rol"))) {
            return "redirect:/login.html";
        }
        model.addAttribute("listaUsuarios", userRepository.findAll());
        return "gestion-usuarios"; // Crearemos este HTML después
    }

    @Transactional
    @PostMapping("/guardar")
    public ResponseEntity<String> guardarUsuario(@RequestParam String username, 
                                                @RequestParam String password, 
                                                @RequestParam String role, 
                                                HttpSession session) {

        Object roleSesion = session.getAttribute("userRole");
        if (roleSesion == null || !roleSesion.toString().equals("ADMIN")) {
            System.err.println(">>> INTENTO DE CREACIÓN NO AUTORIZADO. Rol: " + roleSesion);
            return ResponseEntity.status(403).body("No autorizado");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.status(400).body("El usuario ya existe");
        }
        try {
            User usuario = new User();
            usuario.setUsername(username);
            usuario.setPassword(password);
            usuario.setRole(Role.valueOf(role.toUpperCase()));
            userRepository.save(usuario);
            System.err.println(">>> USUARIO CREADO: " + username);
            return ResponseEntity.ok("success"); 
        } catch (Exception e) {
            System.err.println(">>> ERROR AL GUARDAR: " + e.getMessage());
            return ResponseEntity.status(500).body("Error en el servidor");
        }
    }

    @Transactional
    @PostMapping("/actualizar-perfil") // Asegurate que esta ruta coincida con el fetch
    public ResponseEntity<String> actualizarPerfil(@RequestParam String nuevoUser, 
                                                @RequestParam String nuevoPass, 
                                                HttpSession session) {        
        
        Long id = (Long) session.getAttribute("userId");        
        System.err.println(">>> DEBUG: Procesando actualización para ID: " + id);
        
        if (id != null) {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                u.setUsername(nuevoUser);
                
                if (nuevoPass != null && !nuevoPass.trim().isEmpty()) {
                    u.setPassword(nuevoPass);
                }
                
                userRepository.save(u);
                
                session.setAttribute("userName", nuevoUser);
                session.setAttribute("userLogger", u); 
                
                return ResponseEntity.ok("success"); // <--- Esto es lo que causaba el Type Mismatch
            }
        }
        return ResponseEntity.status(400).body("No se pudo actualizar");
    }

    @org.springframework.transaction.annotation.Transactional // Fundamental para que el save() impacte
    @PostMapping("/editar-desde-admin")
    @ResponseBody
    public String editarDesdeAdmin(@RequestParam Long id, 
                                    @RequestParam String username, 
                                    @RequestParam String password, 
                                    HttpSession session) {

        Object roleAttr = session.getAttribute("userRole");
        
        if (roleAttr == null || !roleAttr.toString().equals("ADMIN")) {
            System.err.println(">>> ACCESO DENEGADO: El usuario intentó editar sin ser ADMIN. Rol encontrado: " + roleAttr);
            return "No autorizado";
        }

        try {
            User u = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            u.setUsername(username);
            u.setPassword(password);
            
            userRepository.save(u);
            
            System.err.println(">>> ÉXITO: Admin actualizó al usuario ID " + id);
            return "success";
        } catch (Exception e) {
            System.err.println(">>> ERROR EN EDICIÓN ADMIN: " + e.getMessage());
            return "error";
        }
    }

    @PostMapping("/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("Acceso denegado: Se requiere rol de Administrador");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private boolean esAdmin(HttpSession session) {
    Object role = session.getAttribute("userRole");
    return role != null && role.toString().equalsIgnoreCase("ADMIN");
}

    @GetMapping("/listar")
    @ResponseBody
    public List<User> listarUsuarios(HttpSession session) {
        String rolEnSesion = (String) session.getAttribute("userRole");

        if (!"ADMIN".equals(rolEnSesion)) {
            return new ArrayList<>(); 
        }
        return userRepository.findAll();
    }
}