package com.ProjectoJava.objetos.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import com.ProjectoJava.objetos.entity.GlobalConfig;
import com.ProjectoJava.objetos.repository.GlobalConfigRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ConfigController {
    @Autowired
    private GlobalConfigRepository globalConfigRepository;

    @GetMapping("/configuraciones")
    public ResponseEntity<Map<String, String>> obtenerTodas() {
        List<GlobalConfig> lista = globalConfigRepository.findAll();
        Map<String, String> configMap = new HashMap<>();
        for (GlobalConfig c : lista) {
            configMap.put(c.getConfigKey(), c.getConfigValue());
        }
        
        return ResponseEntity.ok(configMap);
    }

    @PutMapping("/admin/configuraciones/actualizar")
    public ResponseEntity<?> actualizarConfiguracion(@RequestBody Map<String, String> nuevasConfigs) {
        nuevasConfigs.forEach((clave, valor) -> {
            GlobalConfig config = globalConfigRepository.findById(clave)
                    .orElse(new GlobalConfig(clave, valor));
            
            config.setConfigValue(valor);
            globalConfigRepository.save(config);
        });
        return ResponseEntity.ok("Configuraciones actualizadas con éxito");
    }
    
}