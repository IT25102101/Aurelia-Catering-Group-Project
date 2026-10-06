package com.aurelia.catering.model;

/**
 * Model representing a catering package from the CATERING_PACKAGE table in AureliaCatering2.
 * Columns: PackageID, PackageName, Description, Price
 */
public class CateringPackage {

    private Integer id;
    private String name;
    private String description;
    private Double price;

    public CateringPackage() {
    }

    public CateringPackage(Integer id, String name, String description, Double price) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getPackageId() {
        return id;
    }

    public void setPackageId(Integer packageId) {
        this.id = packageId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPackageName() {
        return name;
    }

    public void setPackageName(String packageName) {
        this.name = packageName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}
