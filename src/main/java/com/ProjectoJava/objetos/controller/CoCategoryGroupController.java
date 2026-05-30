package com.ProjectoJava.objetos.controller;

import com.ProjectoJava.objetos.DTO.response.CoCategoryGroupResponseDTO;
import com.ProjectoJava.objetos.DTO.request.CoCategoryGroupRequestDTO;
import com.ProjectoJava.objetos.service.CoCategoryGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/co-category-group")
public class CoCategoryGroupController {

    @Autowired
    private CoCategoryGroupService coCategoryGroupService;

    @PostMapping("/add")
    public ResponseEntity<?> crear(@RequestBody CoCategoryGroupRequestDTO dto) {
        try {
            return ResponseEntity.ok(coCategoryGroupService.crear(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error interno: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<CoCategoryGroupResponseDTO> actualizar(@PathVariable Long id, @RequestBody CoCategoryGroupRequestDTO dto) {
        return ResponseEntity.ok(coCategoryGroupService.actualizar(id, dto));
    }

    @GetMapping("/all")
    public ResponseEntity<List<CoCategoryGroupResponseDTO>> listarTodas() {
        return ResponseEntity.ok(coCategoryGroupService.listarTodas());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            coCategoryGroupService.eliminar(id);
            return ResponseEntity.noContent().build(); 
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar: " + e.getMessage());
        }
    }
}