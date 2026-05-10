package com.ProjectoJava.objetos.controller;

import com.ProjectoJava.objetos.service.PropertyValueService;
import java.util.List;
import org.springframework.http.ResponseEntity;

import com.ProjectoJava.objetos.DTO.request.PropertyValueRequestDTO;
import com.ProjectoJava.objetos.DTO.response.PropertyValueResponseDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/property-values")
public class PropertyValueController {

    @Autowired
    private PropertyValueService service;

    @PostMapping("/add")
    public ResponseEntity<PropertyValueResponseDTO> crear(@RequestBody PropertyValueRequestDTO dto) {
        return ResponseEntity.ok(service.crear(dto));
    }

    @GetMapping("/group/{grupoId}")
    public ResponseEntity<List<PropertyValueResponseDTO>> listarPorGrupo(@PathVariable Long grupoId) {
        return ResponseEntity.ok(service.listarPorGrupo(grupoId));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}