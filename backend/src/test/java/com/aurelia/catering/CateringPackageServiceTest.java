package com.aurelia.catering;

import com.aurelia.catering.dao.CateringPackageDao;
import com.aurelia.catering.dao.PackageMenuItemDao;
import com.aurelia.catering.factory.*;
import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import com.aurelia.catering.service.CateringPackageService;
import com.aurelia.catering.strategy.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Comprehensive Unit Tests for CateringPackageService.
 * User's Individual Contribution: Catering Package Management.
 */
public class CateringPackageServiceTest {

    private CateringPackageDao packageDao;
    private PackageMenuItemDao itemDao;
    private CateringPackageFactory factory;
    private PackagePricingContext pricingContext;
    private CateringPackageService service;

    @BeforeEach
    void setUp() {
        packageDao = Mockito.mock(CateringPackageDao.class);
        itemDao = Mockito.mock(PackageMenuItemDao.class);
        factory = new CateringPackageFactory();

        List<PackagePricingStrategy> strategies = List.of(
                new FixedPackagePricingStrategy(),
                new PerGuestPackagePricingStrategy(),
                new OccasionTieredPricingStrategy(),
                new FoodValueCostingStrategy()
        );
        pricingContext = new PackagePricingContext(strategies);

        service = new CateringPackageService(packageDao, itemDao, factory, pricingContext);
    }

    @Test
    @DisplayName("getAllPackages should map all raw entities via Factory into concrete subclasses")
    void testGetAllPackages() {
        List<CateringPackage> rawList = new ArrayList<>();
        rawList.add(new CateringPackage(1, "Royal Wedding", "Desc", 85000.0, "Wedding"));
        rawList.add(new CateringPackage(2, "Boardroom Lunch", "Desc", 35000.0, "Corporate"));
        when(packageDao.getAll()).thenReturn(rawList);

        List<CateringPackage> result = service.getAllPackages();

        assertEquals(2, result.size());
        assertTrue(result.get(0) instanceof WeddingPackage);
        assertTrue(result.get(1) instanceof CorporatePackage);
        assertEquals("Royal Wedding", result.get(0).getName());
        verify(packageDao, times(1)).getAll();
    }

    @Test
    @DisplayName("getPackageById should return concrete subclass for existing ID")
    void testGetPackageByIdFound() {
        CateringPackage gala = new CateringPackage(10, "Charity Gala", "Desc", 120000.0, "Gala");
        gala.setMinGuestCount(100);
        gala.setMaxGuestCount(1000);
        when(packageDao.getById(10)).thenReturn(gala);

        CateringPackage result = service.getPackageById(10);

        assertNotNull(result);
        assertTrue(result instanceof GalaPackage);
        assertEquals(10, result.getId());
        assertEquals(100, result.getMinGuestCount());
        assertEquals(1000, result.getMaxGuestCount());
    }

    @Test
    @DisplayName("getPackageById should return null when package does not exist")
    void testGetPackageByIdNotFound() {
        when(packageDao.getById(999)).thenReturn(null);

        CateringPackage result = service.getPackageById(999);

        assertNull(result);
        verify(packageDao, times(1)).getById(999);
    }

    @Test
    @DisplayName("createPackage should validate required name")
    void testCreatePackageValidationMissingName() {
        CateringPackage req = new CateringPackage();
        req.setName("");
        req.setPrice(5000.0);

        assertThrows(IllegalArgumentException.class, () -> service.createPackage(req));
        verify(packageDao, never()).create(any());
    }

    @Test
    @DisplayName("createPackage should validate non-negative price")
    void testCreatePackageValidationNegativePrice() {
        CateringPackage req = new CateringPackage();
        req.setName("Discount Package");
        req.setPrice(-100.0);

        assertThrows(IllegalArgumentException.class, () -> service.createPackage(req));
        verify(packageDao, never()).create(any());
    }

    @Test
    @DisplayName("createPackage should create concrete subclass and delegate to DAO")
    void testCreatePackageSuccess() {
        CateringPackage req = new CateringPackage();
        req.setName("Birthday Party Blast");
        req.setDescription("Kids and family");
        req.setPrice(30000.0);
        req.setPackageType("Birthday");
        req.setMinGuestCount(20);
        req.setMaxGuestCount(90);

        when(packageDao.create(any(CateringPackage.class))).thenAnswer(invocation -> {
            CateringPackage p = invocation.getArgument(0);
            p.setId(42);
            return p;
        });

        CateringPackage created = service.createPackage(req);

        assertNotNull(created);
        assertEquals(42, created.getId());
        assertTrue(created instanceof BirthdayPackage);
        assertEquals(20, created.getMinGuestCount());
        assertEquals(90, created.getMaxGuestCount());
        verify(packageDao, times(1)).create(any(CateringPackage.class));
    }

    @Test
    @DisplayName("updatePackage should return null when package does not exist")
    void testUpdatePackageNotFound() {
        when(packageDao.getById(55)).thenReturn(null);

        CateringPackage updateReq = new CateringPackage();
        updateReq.setName("New Name");
        updateReq.setPrice(1000.0);

        CateringPackage result = service.updatePackage(55, updateReq);
        assertNull(result);
        verify(packageDao, never()).update(eq(55), any());
    }

    @Test
    @DisplayName("updatePackage should update existing package successfully")
    void testUpdatePackageSuccess() {
        CateringPackage existing = new CateringPackage(5, "Old Name", "Old Desc", 20000.0, "General");
        when(packageDao.getById(5)).thenReturn(existing);

        CateringPackage updateReq = new CateringPackage();
        updateReq.setName("Updated Package");
        updateReq.setDescription("Updated Desc");
        updateReq.setPrice(25000.0);
        updateReq.setPackageType("Wedding");

        when(packageDao.update(eq(5), any(CateringPackage.class))).thenAnswer(inv -> {
            CateringPackage p = inv.getArgument(1);
            p.setId(5);
            return p;
        });

        CateringPackage result = service.updatePackage(5, updateReq);

        assertNotNull(result);
        assertEquals(5, result.getId());
        assertEquals("Updated Package", result.getName());
        assertTrue(result instanceof WeddingPackage);
        verify(packageDao, times(1)).update(eq(5), any());
    }

    @Test
    @DisplayName("deletePackage should delegate to DAO delete")
    void testDeletePackage() {
        doNothing().when(packageDao).delete(15);

        service.deletePackage(15);

        verify(packageDao, times(1)).delete(15);
    }

    @Test
    @DisplayName("calculatePackagePrice should throw IllegalArgumentException when package not found")
    void testCalculatePackagePriceNotFound() {
        when(packageDao.getById(888)).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () ->
                service.calculatePackagePrice(888, "fixed", 100));
    }

    @Test
    @DisplayName("calculatePackagePrice should compute breakdown using Strategy Pattern")
    void testCalculatePackagePriceSuccess() {
        CateringPackage gala = new CateringPackage(3, "Annual Gala", "Desc", 100000.0, "Gala");
        when(packageDao.getById(3)).thenReturn(gala);
        when(itemDao.getByPackageId(3)).thenReturn(new ArrayList<>());

        PricingBreakdown breakdown = service.calculatePackagePrice(3, "occasion", 150);

        assertNotNull(breakdown);
        assertEquals("occasion", breakdown.getStrategyCode());
        assertEquals(125000.0, breakdown.getFinalTotalPrice());
        assertEquals(25000.0, breakdown.getSurchargeAmount());
    }

    @Test
    @DisplayName("getAvailablePricingStrategies should return all 4 registered strategies")
    void testGetAvailablePricingStrategies() {
        List<Map<String, String>> strategies = service.getAvailablePricingStrategies();

        assertEquals(4, strategies.size());
        assertTrue(strategies.stream().anyMatch(s -> "fixed".equals(s.get("code"))));
        assertTrue(strategies.stream().anyMatch(s -> "per_guest".equals(s.get("code"))));
        assertTrue(strategies.stream().anyMatch(s -> "occasion".equals(s.get("code"))));
        assertTrue(strategies.stream().anyMatch(s -> "food_value".equals(s.get("code"))));
    }
}
