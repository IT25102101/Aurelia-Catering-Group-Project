package com.aurelia.catering.factory;

import com.aurelia.catering.model.CateringPackage;

/**
 * Concrete Package class for General / versatile catering occasions.
 * Encapsulates standard default values.
 */
public class GeneralPackage extends CateringPackage {

    public GeneralPackage() {
        super();
        setPackageType(PackageType.GENERAL.getDisplayName());
        setMinGuestCount(PackageType.GENERAL.getDefaultMinGuests());
        setMaxGuestCount(PackageType.GENERAL.getDefaultMaxGuests());
    }

    public GeneralPackage(Integer id, String name, String description, Double price) {
        super(id, name, description != null ? description : PackageType.GENERAL.getDefaultDescription(), price, PackageType.GENERAL.getDisplayName());
        setMinGuestCount(PackageType.GENERAL.getDefaultMinGuests());
        setMaxGuestCount(PackageType.GENERAL.getDefaultMaxGuests());
    }
}
