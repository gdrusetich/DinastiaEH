package com.ProjectoJava.objetos.entity;
import jakarta.persistence.*;
@Entity
public class GlobalConfig {
    @Id
    private String configKey; // "WHATSAPP_NUMBER", "BANNER_URL", "DIRECCION", "LOCALIDAD", "BARRIO", "GOOGLE_MAPS_URL", "NOMBRE_LUGAR"
    private String configValue; // El texto o URL correspondiente

    public GlobalConfig() {
    }

    public GlobalConfig(String clave, String valor){
        this.configKey = clave;
        this.configValue = valor;        
    }
    public String getConfigKey() {
        return configKey;
    }
    public String getConfigValue() {
        return configValue;
    }
    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }
    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }
}