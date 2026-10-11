package com.aurelia.catering.factory;

import com.aurelia.catering.model.CateringPackage;

/**
 * Concrete Package class for Wedding occasions.
 * Encapsulates occasion-specific constraints and defaults.
 */
public class WeddingPackage extends CateringPackage {

    public WeddingPackage() {
        super();
        setPackageType(PackageType.WEDDING.getDisplayName());
        setMinGuestCount(PackageType.WEDDING.getDefaultMinGuests());
        setMaxGuestCount(PackageType.WEDDING.getDefaultMaxGuests());
    }

    public WeddingPackage(Integer id, String name, String description, Double price) {
        super(id, name, description != null ? description : PackageType.WEDDING.getDefaultDescription(), price, PackageType.WEDDING.getDisplayName());
        setMinGuestCount(PackageType.WEDDING.getDefaultMinGuests());
        setMaxGuestCount(PackageType.WEDDING.getDefaultMaxGuests());
    }
}
