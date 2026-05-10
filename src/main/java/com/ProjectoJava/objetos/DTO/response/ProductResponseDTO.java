package com.ProjectoJava.objetos.DTO.response;
import com.ProjectoJava.objetos.entity.Product;
import com.ProjectoJava.objetos.entity.CoCategoryGroup;
import com.ProjectoJava.objetos.DTO.response.CategoryResponseDTO;
import com.ProjectoJava.objetos.DTO.response.PropertyValueResponseDTO;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ProductResponseDTO {
    private Long id;
    private String title;
    private double price;
    private LocalDate fechaUltimoPrecio;
    private Boolean oculto = false;
    private Boolean featured;
    private Integer stock;
    private String description;
    private List<CategoryResponseDTO> categories;
    private List<PropertyValueResponseDTO> propertyValues;
    private ImageResponseDTO mainImage;
    private List<ImageResponseDTO> images;

    public ProductResponseDTO(Product p) {
        this.id = p.getId();
        this.title = p.getTitle();
        this.price = p.getPrice();
        this.fechaUltimoPrecio = p.getFechaUltimoPrecio();
        this.oculto = p.isOculto();
        this.stock = p.getStock();
        this.featured = (p.isFeatured() != null) ? p.isFeatured() : false;
        this.description = p.getDescription();

        this.images = (p.getImages() != null) 
                        ? p.getImages().stream()
                            .map(img -> new ImageResponseDTO(img.getId(), img.getUrl()))
                            .collect(Collectors.toList())
                        : new ArrayList<>();

        if (p.getMainImage() != null) {
            this.mainImage = new ImageResponseDTO(
                p.getMainImage().getId(), 
                p.getMainImage().getUrl()
            );
        }

        this.categories = (p.getCategories() != null) 
            ? p.getCategories().stream()
                .map(cat -> new CategoryResponseDTO(cat.getId(), cat.getName()))
                .collect(Collectors.toList())
            : new ArrayList<>();

        this.propertyValues = (p.getPropertyValues() != null) 
            ? p.getPropertyValues().stream()
                .map(v -> new PropertyValueResponseDTO(v.getId(), v.getValue(), v.getCoCategoryGroup().getName()))
                .collect(Collectors.toList())
            : new ArrayList<>();

    }
    
    
    public Long getId() {return this.id;}
    public String getTitle() {return this.title;}
    public double getPrice() {return this.price;}
    public LocalDate getFechaUltimoPrecio(){return this.fechaUltimoPrecio;}
    public Boolean isOculto(){return oculto;}
    public int getStock() {return this.stock;}
    public boolean isFeatured() {return this.featured;}
    public String getDescription() {return this.description;}
    public List<CategoryResponseDTO> getCategories(){return this.categories;}
    public List<PropertyValueResponseDTO> getPropertyValues(){return this.propertyValues;} // NUEVO
    public ImageResponseDTO getMainImage(){return this.mainImage;}
    public List<ImageResponseDTO> getImages(){return this.images;}
}

