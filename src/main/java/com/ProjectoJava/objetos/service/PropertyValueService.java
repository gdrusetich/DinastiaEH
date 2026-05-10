package com.ProjectoJava.objetos.service;

import com.ProjectoJava.objetos.DTO.request.PropertyValueRequestDTO;
import com.ProjectoJava.objetos.DTO.response.PropertyValueResponseDTO;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import java.util.List;

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

    @Transactional
    public PropertyValueResponseDTO crear(PropertyValueRequestDTO dto) {
        CoCategoryGroup grupo = groupRepository.findById(dto.getCoCategoryGroupId())
                .orElseThrow(() -> new RuntimeException("Grupo no encontrado"));

        PropertyValue nuevoValor = new PropertyValue();
        nuevoValor.setValue(dto.getValue());
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
}