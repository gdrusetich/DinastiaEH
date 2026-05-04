package com.ProjectoJava.objetos.controller;

import com.ProjectoJava.objetos.DTO.response.ProductResponseDTO;
import com.ProjectoJava.objetos.entity.Product;
import com.ProjectoJava.objetos.entity.GlobalConfig;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.entity.User;
import com.ProjectoJava.objetos.entity.Role;

import com.ProjectoJava.objetos.repository.CategoryRepository;
import com.ProjectoJava.objetos.repository.GlobalConfigRepository;
import com.ProjectoJava.objetos.repository.ProductRepository;
import com.ProjectoJava.objetos.repository.UserRepository;
import com.ProjectoJava.objetos.service.FeaturedProductService;
import java.util.List;
import java.util.Map;
import java.util.Comparator;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.ui.Model;
import jakarta.servlet.http.HttpSession;

@Controller
public class ViewController {

    @Autowired
    GlobalConfigRepository globalConfigRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    CategoryRepository categoryRepository;
    @Autowired
    ProductRepository productRepository;
    @Autowired
    FeaturedProductService featuredService;

    @GetMapping("/detalle") 
    public String verDetalle(@RequestParam("id") Long id, Model model, HttpSession session) {
        Product producto = productRepository.findById(id).orElse(null);
        if (producto == null) {
            return "redirect:/";
        }
        
        ProductResponseDTO productoDTO = new ProductResponseDTO(producto);
        model.addAttribute("producto", productoDTO);
        List<GlobalConfig> configs = globalConfigRepository.findAll();
        Map<String, String> configMap = new HashMap<>();
        for (GlobalConfig c : configs) {
            configMap.put(c.getConfigKey(), c.getConfigValue());
        }

        model.addAttribute("config", configMap); 
        model.addAttribute("rolActual", session.getAttribute("rol"));
        return "detalle"; 
    }
    
    @GetMapping("/nosotros")
    public String verNosotros(Model model) {
        List<GlobalConfig> configs = globalConfigRepository.findAll();
        Map<String, String> configMap = new HashMap<>();
        for (GlobalConfig c : configs) {
            configMap.put(c.getConfigKey(), c.getConfigValue());
        }
        model.addAttribute("config", configMap); 
        return "nosotros"; 
    }

    @GetMapping("/home")
    public String mostrarHome(HttpSession session, Model model) {
        var destacados = featuredService.getAllFeaturedDTOs();
        model.addAttribute("destacados", destacados);

        List<GlobalConfig> configs = globalConfigRepository.findAll();
        Map<String, String> configMap = new HashMap<>();
        for (GlobalConfig c : configs) {
            configMap.put(c.getConfigKey(), c.getConfigValue());
        }
        model.addAttribute("config", configMap);

        return "home";
    }

    @GetMapping("/")
    public String index(HttpSession session, Model model) {
        return mostrarHome(session, model);
    }

    @GetMapping("/perfil")
    public String verPerfil(HttpSession session, Model model) {
        User usuario = (User) session.getAttribute("userLogger");
        if (usuario == null) {
            return "redirect:/home"; 
        }

        List<GlobalConfig> configs = globalConfigRepository.findAll();
        Map<String, String> configMap = new HashMap<>();
        for (GlobalConfig c : configs) {
            configMap.put(c.getConfigKey(), c.getConfigValue());
        }
        
        model.addAttribute("usuario", usuario); // Para mostrar nombre/email del usuario
        model.addAttribute("config", configMap); // Para el footer dinámico
        model.addAttribute("rolActual", session.getAttribute("rol"));

        return "perfil"; 
    }

    @GetMapping("/products/prices") // Podés dejar la ruta así para que coincida con tu botón
    public String editarPrecios(HttpSession session) {
        User usuario = (User) session.getAttribute("userLogger");

        if (usuario == null || usuario.getRole() != Role.ADMIN) {
            return "redirect:/home"; 
        }
        
        return "prices"; // Busca templates/prices.html
    }

    @GetMapping("/admin")
    public String vistaAdmin(HttpSession session, Model model) {
        User usuario = (User) session.getAttribute("userLogger");
        if (usuario == null || usuario.getRole() != Role.ADMIN) {
            return "redirect:/home"; 
        }
        List<Category> padres = categoryRepository.findByParentIsNull();
        padres.sort(Comparator.comparing(Category::getName, 
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
        model.addAttribute("categoriasPadre", padres);
        return "admin"; 
    }

    @GetMapping("/detalle-admin")
    public String detalleAdmin() {
        return "detalleadmin"; 
    }

    @GetMapping("/actualizar")
    public String verPaginaActualizar(HttpSession session) {
        Object roleAttr = session.getAttribute("userRole"); 
        if (roleAttr == null || !roleAttr.toString().equals(Role.ADMIN.name())) {
            return "redirect:/login"; 
        }
        
        return "actualizar";
    }
}