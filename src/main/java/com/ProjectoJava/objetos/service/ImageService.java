package com.ProjectoJava.objetos.service;

import com.ProjectoJava.objetos.repository.GlobalConfigRepository;
import com.ProjectoJava.objetos.repository.ImageRepository;
import com.ProjectoJava.objetos.repository.ProductRepository;
import com.ProjectoJava.objetos.entity.GlobalConfig;
import com.ProjectoJava.objetos.entity.Image;
import com.ProjectoJava.objetos.entity.Product;
import java.util.List;
import java.io.IOException;
import java.util.Map;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageService {
    @Autowired
    private ImageRepository imageRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private GlobalConfigRepository globalConfigRepository;

    @Autowired
    private Cloudinary cloudinary;

    @Transactional
    public void deleteImage(Long imageId) {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Imagen no encontrada con ID: " + imageId));

        Product product = image.getProduct();
        if (product != null) {
            product.getImages().remove(image);
            if (product.getMainImage() != null && product.getMainImage().getId().equals(imageId)) {
                if (!product.getImages().isEmpty()) {
                    product.setMainImage(product.getImages().iterator().next());
                } else {
                    product.setMainImage(null);
                }
            }
        }
        try {
            String url = image.getUrl();
            if (url.contains("cloudinary.com")) {
                String publicId = url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf("."));
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
        } catch (Exception e) {
            System.err.println("Error al borrar en Cloudinary: " + e.getMessage());
        }

        imageRepository.delete(image);
    }

    @Transactional
    public void deleteAllImagesByProductId(Long productId) {
        List<Image> imagenes = imageRepository.findByProductId(productId);
        for (Image img : imagenes) {
            deleteImage(img.getId());
        }
    }

    @Transactional
    public void addImagesToProduct(Long productId, MultipartFile[] files) throws IOException {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Buscamos la carpeta o usamos Home
        String folder = globalConfigRepository.findById("CLOUDINARY_FOLDER")
                .map(GlobalConfig::getConfigValue)
                .orElse("Home");

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                // Usamos la configuración de carpeta
                Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), 
                        ObjectUtils.asMap("folder", folder));
                
                String publicId = uploadResult.get("public_id").toString();

                // Limpiamos el nombre para que no guarde "Home/foto1" sino solo "foto1"
                if (publicId.contains("/")) {
                    publicId = publicId.substring(publicId.lastIndexOf("/") + 1);
                }

                Image img = new Image();
                img.setUrl(publicId);
                img.setProduct(product);
                imageRepository.save(img);
            }
        }
    }
}