package com.ProjectoJava.objetos.service;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.entity.Category;
import com.ProjectoJava.objetos.DTO.response.CoCategoryGroupResponseDTO;
import com.ProjectoJava.objetos.DTO.request.CoCategoryGroupRequestDTO;
import com.ProjectoJava.objetos.repository.ProductRepository;

import com.ProjectoJava.objetos.repository.CoCategoryGroupRepository;
import com.ProjectoJava.objetos.repository.CategoryRepository;
import com.ProjectoJava.objetos.entity.Product;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CoCategoryGroupService {

    @Autowired
    private CoCategoryGroupRepository CoCategoryGroupRepository;

    @Autowired
    private CategoryRepository categoryRepository; // <--- Faltaba esta inyección

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public CoCategoryGroupResponseDTO crear(CoCategoryGroupRequestDTO dto) {
        CoCategoryGroup nueva = new CoCategoryGroup();
        nueva.setName(dto.getName());
        nueva.setType(dto.getType());
        if (dto.getCategoryIds() != null && !dto.getCategoryIds().isEmpty()) {
            Set<Category> categoriasObtenidas = dto.getCategoryIds().stream()
                .map(catId -> categoryRepository.findById(catId)
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada: " + catId)))
                .collect(Collectors.toSet());
            nueva.setCategories(categoriasObtenidas);
        }
        
        CoCategoryGroup guardada = CoCategoryGroupRepository.save(nueva);
        return convertToResponseDTO(guardada);
    }

    @Transactional
    public void eliminar(Long id) {
        CoCategoryGroup coCat = CoCategoryGroupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("No se encontró la co-categoría"));
        CoCategoryGroupRepository.delete(coCat);
    }

    @Transactional
    public CoCategoryGroupResponseDTO actualizar(Long id, CoCategoryGroupRequestDTO dto) {
        CoCategoryGroup cocat = CoCategoryGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Co-Categoría no encontrada"));

        cocat.setName(dto.getName());
        cocat.setType(dto.getType());

        if (dto.getCategoryIds() != null) {
            Set<Category> categoriasObtenidas = dto.getCategoryIds().stream()
                    .map(catId -> categoryRepository.findById(catId)
                        .orElseThrow(() -> new RuntimeException("Categoría no encontrada: " + catId)))
                    .collect(Collectors.toSet());
            
            // Limpiamos y cargamos para que Hibernate detecte el cambio de una
            cocat.getCategories().clear();
            cocat.getCategories().addAll(categoriasObtenidas);
        } else {
            cocat.getCategories().clear();
        }

        // Guardamos y forzamos la escritura en DB
        CoCategoryGroup guardada = CoCategoryGroupRepository.saveAndFlush(cocat);
        
        // IMPORTANTE: Imprimí esto en la consola del IDE para ver si Java tiene los IDs
        System.out.println("Categorías en la entidad antes de devolver: " + guardada.getCategories().size());

        return convertToResponseDTO(guardada);
    }

public List<CoCategoryGroupResponseDTO> listarTodas() {
    List<CoCategoryGroup> grupos = CoCategoryGroupRepository.findAll();   
    return grupos.stream()
            .map(grupo -> {
                return convertToResponseDTO(grupo); 
            })
            .collect(Collectors.toList());
}
    private CoCategoryGroupResponseDTO convertToResponseDTO(CoCategoryGroup cocat) {
        CoCategoryGroupResponseDTO response = new CoCategoryGroupResponseDTO();
        response.setId(cocat.getId());
        response.setName(cocat.getName());
        response.setType(cocat.getType());
        
        if (cocat.getCategories() != null) {
            // Extraemos los IDs
            List<Long> ids = cocat.getCategories().stream()
                    .map(Category::getId)
                    .collect(Collectors.toList());
            response.setCategoryIds(ids); // <--- ESTO ES LO QUE TILDARÁ LOS CHECKS

            // Extraemos los nombres (opcional para mostrar texto)
            List<String> nombres = cocat.getCategories().stream()
                    .map(Category::getName)
                    .collect(Collectors.toList());
            response.setCategoryNames(nombres);
        }
        return response;
    }
}