package com.aurelia.catering.factory;

import com.aurelia.catering.model.CateringPackage;

/**
 * Concrete Package class for Birthday celebrations.
 * Encapsulates occasion-specific constraints and defaults.
 */
public class BirthdayPackage extends CateringPackage {

    public BirthdayPackage() {
        super();
        setPackageType(PackageType.BIRTHDAY.getDisplayName());
        setMinGuestCount(PackageType.BIRTHDAY.getDefaultMinGuests());
        setMaxGuestCount(PackageType.BIRTHDAY.getDefaultMaxGuests());
    }

    public BirthdayPackage(Integer id, String name, String description, Double price) {
        super(id, name, description != null ? description : PackageType.BIRTHDAY.getDefaultDescription(), price, PackageType.BIRTHDAY.getDisplayName());
        setMinGuestCount(PackageType.BIRTHDAY.getDefaultMinGuests());
        setMaxGuestCount(PackageType.BIRTHDAY.getDefaultMaxGuests());
    }
}
