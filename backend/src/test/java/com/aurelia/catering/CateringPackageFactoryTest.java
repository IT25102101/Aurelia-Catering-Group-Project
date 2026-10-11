package com.aurelia.catering;

import com.aurelia.catering.factory.*;
import com.aurelia.catering.model.CateringPackage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for Factory Pattern Implementation.
 */
public class CateringPackageFactoryTest {

    private CateringPackageFactory factory;

    @BeforeEach
    public void setUp() {
        factory = new CateringPackageFactory();
    }

    @Test
    @DisplayName("Factory should create a WeddingPackage with proper defaults and constraints")
    public void testCreateWeddingPackage() {
        CateringPackage pkg = factory.createPackage("Wedding", "Grand Wedding Feast", "Exclusive wedding menu", 65000.0);

        assertNotNull(pkg);
        assertTrue(pkg instanceof WeddingPackage, "Instance must be a WeddingPackage");
        assertEquals("Wedding", pkg.getPackageType());
        assertEquals(50, pkg.getMinGuestCount());
        assertEquals(500, pkg.getMaxGuestCount());
        assertEquals("Grand Wedding Feast", pkg.getName());
        assertEquals(65000.0, pkg.getPrice());
    }

    @Test
    @DisplayName("Factory should create a CorporatePackage with corporate defaults")
    public void testCreateCorporatePackage() {
        CateringPackage pkg = factory.createPackage("Corporate", "Executive Lunch", "Conference buffet", 40000.0);

        assertNotNull(pkg);
        assertTrue(pkg instanceof CorporatePackage, "Instance must be a CorporatePackage");
        assertEquals("Corporate", pkg.getPackageType());
        assertEquals(30, pkg.getMinGuestCount());
        assertEquals(350, pkg.getMaxGuestCount());
    }

    @Test
    @DisplayName("Factory should create a BirthdayPackage with birthday defaults")
    public void testCreateBirthdayPackage() {
        CateringPackage pkg = factory.createPackage("Birthday", "Fun Birthday Buffet", "Birthday cake & snacks", 25000.0);

        assertNotNull(pkg);
        assertTrue(pkg instanceof BirthdayPackage, "Instance must be a BirthdayPackage");
        assertEquals("Birthday", pkg.getPackageType());
        assertEquals(15, pkg.getMinGuestCount());
        assertEquals(80, pkg.getMaxGuestCount());
    }

    @Test
    @DisplayName("Factory should create a GalaPackage with gala defaults")
    public void testCreateGalaPackage() {
        CateringPackage pkg = factory.createPackage("Gala", "Annual Gala Dinner", "Fine dining 5-course", 90000.0);

        assertNotNull(pkg);
        assertTrue(pkg instanceof GalaPackage, "Instance must be a GalaPackage");
        assertEquals("Gala", pkg.getPackageType());
        assertEquals(100, pkg.getMinGuestCount());
        assertEquals(1000, pkg.getMaxGuestCount());
    }

    @Test
    @DisplayName("Factory should fallback to GeneralPackage for unknown types")
    public void testFallbackToGeneralPackage() {
        CateringPackage pkg = factory.createPackage("UnknownType", "Standard Catering", "All occasions", 15000.0);

        assertNotNull(pkg);
        assertTrue(pkg instanceof GeneralPackage, "Instance must be a GeneralPackage");
        assertEquals("General", pkg.getPackageType());
    }

    @Test
    @DisplayName("Factory should convert existing POJO into correct concrete subclass")
    public void testCreateFromExisting() {
        CateringPackage pojo = new CateringPackage(5, "Existing Wedding", "Test desc", 50000.0, "Wedding");
        CateringPackage converted = factory.createFromExisting(pojo);

        assertNotNull(converted);
        assertTrue(converted instanceof WeddingPackage);
        assertEquals(5, converted.getId());
        assertEquals("Wedding", converted.getPackageType());
    }
}
