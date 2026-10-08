package com.aurelia.catering.factory;

import com.aurelia.catering.model.CateringPackage;
import org.springframework.stereotype.Component;

/**
 * Factory Pattern Implementation (Creational).
 *
 * Encapsulates object creation for CateringPackage subclasses based on the
 * database ISA discriminator PackageType ('Wedding', 'Birthday', 'Corporate', 'Gala', 'General').
 *
 * Reduces coupling between client/controller layers and concrete package subclasses,
 * ensuring occasion-specific business rules, defaults, and invariants are properly initialized.
 */
@Component
public class CateringPackageFactory {

    /**
     * Creates a concrete CateringPackage instance based on the given package type string.
     */
    public CateringPackage createPackage(String packageTypeStr, String name, String description, Double price) {
        PackageType type = PackageType.fromString(packageTypeStr);
        return createPackage(type, name, description, price);
    }

    /**
     * Creates a concrete CateringPackage instance based on the given PackageType enum.
     */
    public CateringPackage createPackage(PackageType type, String name, String description, Double price) {
        if (type == null) {
            type = PackageType.GENERAL;
        }

        CateringPackage pkg;
        switch (type) {
            case WEDDING:
                pkg = new WeddingPackage(null, name, description, price);
                break;
            case BIRTHDAY:
                pkg = new BirthdayPackage(null, name, description, price);
                break;
            case CORPORATE:
                pkg = new CorporatePackage(null, name, description, price);
                break;
            case GALA:
                pkg = new GalaPackage(null, name, description, price);
                break;
            case GENERAL:
            default:
                pkg = new GeneralPackage(null, name, description, price);
                break;
        }

        return pkg;
    }

    /**
     * Converts/initializes an existing CateringPackage entity into its appropriate concrete subclass.
     */
    public CateringPackage createFromExisting(CateringPackage source) {
        if (source == null) {
            return null;
        }

        PackageType type = PackageType.fromString(source.getPackageType());
        CateringPackage concretePkg;

        switch (type) {
            case WEDDING:
                concretePkg = new WeddingPackage(source.getId(), source.getName(), source.getDescription(), source.getPrice());
                break;
            case BIRTHDAY:
                concretePkg = new BirthdayPackage(source.getId(), source.getName(), source.getDescription(), source.getPrice());
                break;
            case CORPORATE:
                concretePkg = new CorporatePackage(source.getId(), source.getName(), source.getDescription(), source.getPrice());
                break;
            case GALA:
                concretePkg = new GalaPackage(source.getId(), source.getName(), source.getDescription(), source.getPrice());
                break;
            case GENERAL:
            default:
                concretePkg = new GeneralPackage(source.getId(), source.getName(), source.getDescription(), source.getPrice());
                break;
        }

        if (source.getMinGuestCount() != null) {
            concretePkg.setMinGuestCount(source.getMinGuestCount());
        }
        if (source.getMaxGuestCount() != null) {
            concretePkg.setMaxGuestCount(source.getMaxGuestCount());
        }

        return concretePkg;
    }

    /**
     * Creates a default template package for a given occasion type.
     */
    public CateringPackage createDefault(PackageType type) {
        String defaultName = "Standard " + type.getDisplayName() + " Package";
        return createPackage(type, defaultName, type.getDefaultDescription(), 25000.0);
    }
}
