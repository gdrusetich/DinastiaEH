package com.ProjectoJava.objetos.service;

import com.ProjectoJava.objetos.DTO.request.PropertyValueRequestDTO;
import com.ProjectoJava.objetos.DTO.response.PropertyValueResponseDTO;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.entity.Product;

import java.util.List;
import java.util.Set;

import com.ProjectoJava.objetos.repository.CoCategoryGroupRepository;
import com.ProjectoJava.objetos.repository.PropertyValueRepository;
import com.ProjectoJava.objetos.repository.ProductRepository;
import com.ProjectoJava.objetos.entity.PropertyValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

@Service
public class PropertyValueService {

    @Autowired
    private PropertyValueRepository repository;

    @Autowired
    private CoCategoryGroupRepository groupRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public PropertyValueResponseDTO crear(PropertyValueRequestDTO dto) {
        CoCategoryGroup grupo = groupRepository.findById(dto.getCoCategoryGroupId())
                .orElseThrow(() -> new RuntimeException("Grupo no encontrado"));
        String valorLimpio = dto.getValue().trim();
        boolean yaExiste = repository.existsByValueIgnoreCaseAndCoCategoryGroupId(valorLimpio, dto.getCoCategoryGroupId());
        
        if (yaExiste) {
            throw new IllegalArgumentException("¡Error! El valor '" + valorLimpio + "' ya está registrado en esta propiedad.");
        }

        PropertyValue nuevoValor = new PropertyValue();
        nuevoValor.setValue(valorLimpio);
        nuevoValor.setCoCategoryGroup(grupo);

        PropertyValue guardado = repository.save(nuevoValor);
        return new PropertyValueResponseDTO(guardado.getId(), guardado.getValue(), grupo.getName());
    }

    public List<PropertyValueResponseDTO> listarPorGrupo(Long grupoId) {
        return repository.findByCoCategoryGroupId(grupoId).stream()
                .map(v -> new PropertyValueResponseDTO(
                    v.getId(), 
                    v.getValue(), 
                    v.getCoCategoryGroup().getName()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminar(Long id) {
        repository.deleteById(id);
    }

    public List<PropertyValueResponseDTO> obtenerTodas() {
        return repository.findAll().stream()
                .map(v -> new PropertyValueResponseDTO(
                    v.getId(), 
                    v.getValue(), 
                    v.getCoCategoryGroup() != null ? v.getCoCategoryGroup().getName() : "Sin Grupo"
                ))
                .collect(Collectors.toList());
    }

    public List<PropertyValueResponseDTO> listarPorProductoCategorias(Long productoId) {
        Product producto = productRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        Set<Long> gruposIds = producto.getCategories().stream()
                .filter(c -> c.getCoCategoriesGroup() != null)
                .flatMap(c -> c.getCoCategoriesGroup().stream())
                .map(g -> g.getId())
                .collect(Collectors.toSet());
        return repository.findAll().stream()
                .filter(pv -> pv.getCoCategoryGroup() != null && gruposIds.contains(pv.getCoCategoryGroup().getId()))
                .map(pv -> new PropertyValueResponseDTO(
                    pv.getId(), 
                    pv.getValue(), 
                    pv.getCoCategoryGroup().getName()
                ))
                .collect(Collectors.toList());
    }

}