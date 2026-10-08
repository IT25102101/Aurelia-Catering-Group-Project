package com.aurelia.catering.factory;

import com.aurelia.catering.model.CateringPackage;

/**
 * Concrete Package class for Gala and Grand Balls.
 * Encapsulates occasion-specific constraints and defaults.
 */
public class GalaPackage extends CateringPackage {

    public GalaPackage() {
        super();
        setPackageType(PackageType.GALA.getDisplayName());
        setMinGuestCount(PackageType.GALA.getDefaultMinGuests());
        setMaxGuestCount(PackageType.GALA.getDefaultMaxGuests());
    }

    public GalaPackage(Integer id, String name, String description, Double price) {
        super(id, name, description != null ? description : PackageType.GALA.getDefaultDescription(), price, PackageType.GALA.getDisplayName());
        setMinGuestCount(PackageType.GALA.getDefaultMinGuests());
        setMaxGuestCount(PackageType.GALA.getDefaultMaxGuests());
    }
}
