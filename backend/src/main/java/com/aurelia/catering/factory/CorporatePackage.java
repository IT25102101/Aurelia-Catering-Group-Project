package com.aurelia.catering.factory;

import com.aurelia.catering.model.CateringPackage;

/**
 * Concrete Package class for Corporate summits and business luncheons.
 * Encapsulates occasion-specific constraints and defaults.
 */
public class CorporatePackage extends CateringPackage {

    public CorporatePackage() {
        super();
        setPackageType(PackageType.CORPORATE.getDisplayName());
        setMinGuestCount(PackageType.CORPORATE.getDefaultMinGuests());
        setMaxGuestCount(PackageType.CORPORATE.getDefaultMaxGuests());
    }

    public CorporatePackage(Integer id, String name, String description, Double price) {
        super(id, name, description != null ? description : PackageType.CORPORATE.getDefaultDescription(), price, PackageType.CORPORATE.getDisplayName());
        setMinGuestCount(PackageType.CORPORATE.getDefaultMinGuests());
        setMaxGuestCount(PackageType.CORPORATE.getDefaultMaxGuests());
    }
}
