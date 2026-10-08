package com.aurelia.catering.factory;

/**
 * Enumeration of supported catering package types.
 * Matches the CHECK constraint in table CateringPackage:
 * ('Wedding', 'Birthday', 'Corporate', 'Gala', 'General')
 */
public enum PackageType {
    WEDDING("Wedding", 50, 500, "Grand celebratory banquet featuring multi-course plated dining and formal reception service."),
    BIRTHDAY("Birthday", 15, 80, "Intimate party celebration catering with customizable dessert and cocktail grazing options."),
    CORPORATE("Corporate", 30, 350, "Engineered for executive summits, conferences, business luncheons, and retreats."),
    GALA("Gala", 100, 1000, "Formal black-tie gala dinner banquet with multi-station culinary showcases."),
    GENERAL("General", 20, 250, "Standard versatile catering package suitable for all general occasions.");

    private final String displayName;
    private final int defaultMinGuests;
    private final int defaultMaxGuests;
    private final String defaultDescription;

    PackageType(String displayName, int defaultMinGuests, int defaultMaxGuests, String defaultDescription) {
        this.displayName = displayName;
        this.defaultMinGuests = defaultMinGuests;
        this.defaultMaxGuests = defaultMaxGuests;
        this.defaultDescription = defaultDescription;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getDefaultMinGuests() {
        return defaultMinGuests;
    }

    public int getDefaultMaxGuests() {
        return defaultMaxGuests;
    }

    public String getDefaultDescription() {
        return defaultDescription;
    }

    public static PackageType fromString(String text) {
        if (text == null || text.trim().isEmpty()) {
            return GENERAL;
        }
        for (PackageType type : PackageType.values()) {
            if (type.name().equalsIgnoreCase(text.trim()) || type.displayName.equalsIgnoreCase(text.trim())) {
                return type;
            }
        }
        return GENERAL;
    }
}
