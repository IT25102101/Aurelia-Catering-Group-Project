package com.aurelia.catering.model;

/**
 * Model representing a catering package from the CateringPackage table in AureliaCatering2.
 * Columns: PackageID, PackageName, Description, Price, PackageType
 */
public class CateringPackage {

    private Integer id;
    private String name;
    private String description;
    private Double price;
    private String packageType = "General";
    private Integer minGuestCount = 50;
    private Integer maxGuestCount = 300;

    public CateringPackage() {
    }

    public CateringPackage(Integer id, String name, String description, Double price) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.packageType = "General";
    }

    public CateringPackage(Integer id, String name, String description, Double price, String packageType) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.packageType = packageType != null ? packageType : "General";
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

    public String getPackageType() {
        return packageType;
    }

    public void setPackageType(String packageType) {
        this.packageType = packageType != null ? packageType : "General";
    }

    public Integer getMinGuestCount() {
        return minGuestCount;
    }

    public void setMinGuestCount(Integer minGuestCount) {
        this.minGuestCount = minGuestCount;
    }

    public Integer getMaxGuestCount() {
        return maxGuestCount;
    }

    public void setMaxGuestCount(Integer maxGuestCount) {
        this.maxGuestCount = maxGuestCount;
    }
}

