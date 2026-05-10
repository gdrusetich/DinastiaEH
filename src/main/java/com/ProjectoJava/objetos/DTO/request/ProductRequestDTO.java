package com.ProjectoJava.objetos.DTO.request;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.HashSet;

public class ProductRequestDTO {
    private String title;
    private Double price;
    private LocalDate fechaUltimoPrecio;
    private Boolean oculto = false;
    private Boolean featured = false;
    private Integer stock;
    private String description;
    @JsonProperty("idCategories")
    private Set<Long> idCategories = new HashSet<>();
    @JsonProperty("idPropertyValues")
    private Set<Long> idPropertyValues = new HashSet<>();
    private Long mainImage;
    private List<String> imagesNames = new ArrayList<>();
    private List<String> categoryNames = new ArrayList<>();

    public ProductRequestDTO() {
    }
    public ProductRequestDTO(String title, Double price, LocalDate fecha, Boolean oculto, Boolean featured, 
                             Integer stock, String description, Set<Long> idCategories, Set<Long> idPropertyValues,
                             Long mainImage, List<String> imagesNames) {
        this.title = title;
        this.price = price;
        this.fechaUltimoPrecio = fecha;
        this.oculto = oculto;
        this.featured = (featured != null) ? featured : false;
        this.stock = stock;
        this.description = description;
        this.idCategories = idCategories;
        this.idPropertyValues = idPropertyValues;
        this.mainImage = mainImage;
        this.imagesNames = imagesNames;
    }

    public String getTitle() { return title; }
    public double getPrice() { return price != null ? price : 0.0; }
    public LocalDate getFechaUltimoPrecio() { return fechaUltimoPrecio; }
    public Boolean isOculto() { return oculto; }
    public Boolean isFeatured() { return featured; }
    public int getStock() { return stock != null ? stock : 0; }
    public String getDescription() { return description; }
    public Set<Long> getCategories() { return idCategories; }
    public Set<Long> getPropertyValues() { return idPropertyValues; }
    public Long getMainImage() { return mainImage; }
    public List<String> getImageURL() { return imagesNames; }
    public List<String> getCategoryNames() { return categoryNames; }

    public void setTitle(String aTitle) { this.title = aTitle; }
    public void setPrice(double aPrice) { this.price = aPrice; }
    public void setFechaUltimoPrecio(LocalDate fecha) { this.fechaUltimoPrecio = fecha; }
    public void setOculto(Boolean oculto) { this.oculto = oculto; }
    public void setFeatured(Boolean featured) { this.featured = featured; }
    public void setStock(int stock) { this.stock = stock; }
    public void setDescription(String description) { this.description = description; }
    public void setCategories(Set<Long> idCategories) { this.idCategories = idCategories; }
    public void setPropertyValues(Set<Long> idPropertyValues) { this.idPropertyValues = idPropertyValues; }
    public void setImages(List<String> imagesNames) { this.imagesNames = imagesNames; }
    public void setMainImage(Long nuevaImagenId) { this.mainImage = nuevaImagenId; }
    public void setCategoryNames(List<String> categoryNames) { this.categoryNames = categoryNames; }
}