package com.ProjectoJava.objetos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

@SpringBootApplication
@EnableScheduling
public class ClaseSpringbootApplication {
	public static void main(String[] args) {
		SpringApplication.run(ClaseSpringbootApplication.class, args);
		
		}

	@Bean
	public Cloudinary cloudinaryConfig() {
		String name = System.getenv("CLOUDINARY_CLOUD_NAME");
		String key = System.getenv("CLOUDINARY_API_KEY");
		String secret = System.getenv("CLOUDINARY_API_SECRET");
		System.out.println("Configurando Cloudinary con Cloud Name: " + name);

		if (name == null || key == null || secret == null) {
			System.err.println("¡ERROR: Faltan variables de entorno de Cloudinary!");
		}

		return new Cloudinary(ObjectUtils.asMap(
		"cloud_name", (name != null) ? name : "dzkfjusut",
        "api_key", (key != null) ? key : "831124813753864",
        "api_secret", (secret != null) ? secret : "z8aacKfwpPY2JYvM_PJfTSCvsAI",
        "secure", true
		));
	}
}