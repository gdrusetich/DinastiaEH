package com.ProjectoJava.objetos.service;

import com.ProjectoJava.objetos.repository.CategoryRepository;
import com.ProjectoJava.objetos.repository.CoCategoryGroupRepository;
import com.ProjectoJava.objetos.repository.ProductRepository;
import com.ProjectoJava.objetos.DTO.request.CategoryRequestDTO;
import com.ProjectoJava.objetos.DTO.response.CategoryResponseDTO;
import com.ProjectoJava.objetos.DTO.response.CoCategoryGroupResponseDTO;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.entity.Product;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;


@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private CoCategoryGroupRepository coCategoryGroupRepository;
    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public CategoryResponseDTO guardarOActualizar(CategoryRequestDTO dto, Long id) {
        Category cat = (id != null) ? buscarPorId(id) : new Category();
        
        cat.setName(dto.getName());
        cat.setParent(dto.getParentId() != null ? buscarPorId(dto.getParentId()) : null);
        cat = categoryRepository.save(cat);
        List<CoCategoryGroup> gruposAnteriores = coCategoryGroupRepository.findByCategoriesContaining(cat);
        for (CoCategoryGroup grupo : gruposAnteriores) {
            grupo.getCategories().remove(cat);
        }
        coCategoryGroupRepository.saveAll(gruposAnteriores);
        if (dto.getCoCategoryGroupIds() != null && !dto.getCoCategoryGroupIds().isEmpty()) {
            List<CoCategoryGroup> nuevosGrupos = coCategoryGroupRepository.findAllById(dto.getCoCategoryGroupIds());
            for (CoCategoryGroup grupo : nuevosGrupos) {
                grupo.getCategories().add(cat);
            }
            coCategoryGroupRepository.saveAll(nuevosGrupos);
        }

        return new CategoryResponseDTO(cat);
    }
    
    public Category buscarPorId(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("La categoría con ID " + id + " no existe."));
    }

    public List<Category> obtenerCategoriasPadre() {
        return categoryRepository.findByParentIsNull();
    }

    public List<Category> obtenerSubcategorias(Long padreId) {
        return categoryRepository.findByParent_Id(padreId);
    }

    public List<Category> obtenerAncestros(Long categoryId) {
        List<Category> ancestros = new ArrayList<>();
        
        Category actual = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        
        ancestros.add(actual);
        
        while (actual.getParent() != null) {
            actual = actual.getParent();
            ancestros.add(actual);
        }
        return ancestros;
    }

    public List<Long> obtenerIdsDeDescendencia(Long categoriaId) {
        List<Long> idsResultantes = new ArrayList<>();
        idsResultantes.add(categoriaId);
        List<Category> hijas = categoryRepository.findByParent_Id(categoriaId);
        for (Category hija : hijas) {
            idsResultantes.addAll(obtenerIdsDeDescendencia(hija.getId()));
        }
        return idsResultantes;
    }
    
    @GetMapping("/all")
    public List<Category> listarTodas() {
        return categoryRepository.findAllByOrderByNameAsc();
    }

    public List<CategoryResponseDTO> obtenerAncestrosDTO(Long categoryId) {
        List<Category> entidades = obtenerAncestros(categoryId); // Usás la lógica que ya tenías
        return entidades.stream()
                        .map(CategoryResponseDTO::new)
                        .collect(Collectors.toList());
    }

    @Transactional
    public void borrarCategoria(Long id) {
        Category categoriaABorrar = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        List<CoCategoryGroup> grupos = coCategoryGroupRepository.findByCategoriesContaining(categoriaABorrar);
        for (CoCategoryGroup grupo : grupos) {
            grupo.getCategories().remove(categoriaABorrar);
            coCategoryGroupRepository.save(grupo); 
        }

        Category abuelo = categoriaABorrar.getParent();
        List<Category> hijas = categoryRepository.findByParent_Id(id);
        for (Category hija : hijas) {
            hija.setParent(abuelo);
        }
        categoryRepository.saveAll(hijas);

        List<Product> productosAsociados = productRepository.findByCategoriesContaining(categoriaABorrar);
        for (Product producto : productosAsociados) {
            producto.getCategories().remove(categoriaABorrar);
            if (abuelo != null) {
                producto.getCategories().add(abuelo);
            }
        }
        productRepository.saveAll(productosAsociados);
        categoryRepository.delete(categoriaABorrar);
    }

    public Map<Long, Integer> cantidadProductosPorCategoria(boolean soloVisibles) {
        List<Category> categorias = categoryRepository.findAll();
        List<Product> productos = productRepository.findAll();
        Map<Long, Integer> contadores = new HashMap<>();
        
        for (Category cat : categorias) {
            contadores.put(cat.getId(), 0);
        }

        for (Product prod : productos) {
            if (soloVisibles && prod.isOculto()) {
                continue; 
            }

            Set<Long> idsCategoriasAfectadas = new HashSet<>();

            for (Category catDirecta : prod.getCategories()) {
                Category actual = catDirecta;
                while (actual != null) {
                    idsCategoriasAfectadas.add(actual.getId());
                    actual = actual.getParent();
                }
            }

            for (Long id : idsCategoriasAfectadas) {
                if (contadores.containsKey(id)) {
                    contadores.put(id, contadores.get(id) + 1);
                }
            }
        }
        return contadores;
    }


    public CategoryResponseDTO obtenerCategoriaConGrupos(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        CategoryResponseDTO dto = new CategoryResponseDTO(cat);
        List<CoCategoryGroup> grupos = coCategoryGroupRepository.findByCategoriesContaining(cat);
        dto.setCoCategoriesGroup(grupos.stream()
                .map(CoCategoryGroupResponseDTO::new)
                .collect(Collectors.toList()));

        return dto;
    }

}