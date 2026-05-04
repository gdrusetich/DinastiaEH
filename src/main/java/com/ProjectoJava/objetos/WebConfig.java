package com.ProjectoJava.objetos;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry; // Opcional, por si tienes problemas de CORS
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import com.ProjectoJava.objetos.repository.GlobalConfigRepository; // Ajustá a tu ruta
import com.ProjectoJava.objetos.entity.GlobalConfig;
import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/products/images/**") // La URL que usás en el HTML
                .addResourceLocations("file:images/")      // La carpeta real en el servidor
                .setCachePeriod(0);

        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
    }

    @Override
    public void addCorsMappings(@SuppressWarnings("null") CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }

    @Bean
    public CommandLineRunner initData(GlobalConfigRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.saveAll(Arrays.asList(
                    new GlobalConfig("WHATSAPP_NUMBER", ""),
                    new GlobalConfig("CLOUDINARY_NAME", "dzkfjusut"),
                    new GlobalConfig("CLOUDINARY_FOLDER", "Home"),
                    new GlobalConfig("BANNER_URL", ""),
                    new GlobalConfig("NOMBRE_LUGAR", ""),
                    new GlobalConfig("LOCALIDAD", ""),
                    new GlobalConfig("BARRIO", ""),
                    new GlobalConfig("DIRECCION", ""),
                    new GlobalConfig("GOOGLE_MAPS_URL", "")
                ));
                System.out.println(">> Configuración inicial de la Demo cargada.");
            }
        };
    }
}