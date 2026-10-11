package com.aurelia.catering.service;

import com.aurelia.catering.dao.CateringPackageDao;
import com.aurelia.catering.dao.PackageMenuItemDao;
import com.aurelia.catering.factory.CateringPackageFactory;
import com.aurelia.catering.factory.PackageType;
import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import com.aurelia.catering.strategy.PackagePricingContext;
import com.aurelia.catering.strategy.PricingBreakdown;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service Layer for Catering Package Management.
 *
 * Integrates:
 * 1. Factory Pattern (CateringPackageFactory) to instantiate occasion-specific package subclasses.
 * 2. Strategy Pattern (PackagePricingContext) to calculate dynamic pricing and cost breakdowns.
 * 3. Data Access Layer (CateringPackageDao, PackageMenuItemDao).
 */
@Service
public class CateringPackageService {

    private final CateringPackageDao cateringPackageDao;
    private final PackageMenuItemDao packageMenuItemDao;
    private final CateringPackageFactory cateringPackageFactory;
    private final PackagePricingContext pricingContext;

    @Autowired
    public CateringPackageService(
            CateringPackageDao cateringPackageDao,
            PackageMenuItemDao packageMenuItemDao,
            CateringPackageFactory cateringPackageFactory,
            PackagePricingContext pricingContext) {
        this.cateringPackageDao = cateringPackageDao;
        this.packageMenuItemDao = packageMenuItemDao;
        this.cateringPackageFactory = cateringPackageFactory;
        this.pricingContext = pricingContext;
    }

    /**
     * Retrieves all packages, wrapping each through the Factory into its concrete subclass.
     */
    public List<CateringPackage> getAllPackages() {
        List<CateringPackage> packages = cateringPackageDao.getAll();
        return packages.stream()
                .map(cateringPackageFactory::createFromExisting)
                .toList();
    }

    /**
     * Retrieves a single package by ID.
     */
    public CateringPackage getPackageById(int id) {
        CateringPackage raw = cateringPackageDao.getById(id);
        if (raw == null) {
            return null;
        }
        return cateringPackageFactory.createFromExisting(raw);
    }

    /**
     * Creates a new package using the Factory Pattern.
     */
    public CateringPackage createPackage(CateringPackage request) {
        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getPrice() == null || request.getPrice() < 0) {
            throw new IllegalArgumentException("Package name is required and price must be non-negative.");
        }

        // Use Factory to build the proper concrete subclass
        CateringPackage concretePkg = cateringPackageFactory.createPackage(
                request.getPackageType(),
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getPrice()
        );

        // Preserve customized guest limits if supplied
        if (request.getMinGuestCount() != null) {
            concretePkg.setMinGuestCount(request.getMinGuestCount());
        }
        if (request.getMaxGuestCount() != null) {
            concretePkg.setMaxGuestCount(request.getMaxGuestCount());
        }

        return cateringPackageDao.create(concretePkg);
    }

    /**
     * Updates an existing package.
     */
    public CateringPackage updatePackage(int id, CateringPackage request) {
        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getPrice() == null || request.getPrice() < 0) {
            throw new IllegalArgumentException("Package name is required and price must be non-negative.");
        }

        CateringPackage existing = cateringPackageDao.getById(id);
        if (existing == null) {
            return null;
        }

        CateringPackage concretePkg = cateringPackageFactory.createPackage(
                request.getPackageType(),
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getPrice()
        );

        if (request.getMinGuestCount() != null) {
            concretePkg.setMinGuestCount(request.getMinGuestCount());
        }
        if (request.getMaxGuestCount() != null) {
            concretePkg.setMaxGuestCount(request.getMaxGuestCount());
        }

        return cateringPackageDao.update(id, concretePkg);
    }

    /**
     * Deletes a package by ID.
     */
    public void deletePackage(int id) {
        cateringPackageDao.delete(id);
    }

    /**
     * Dynamic Price Calculation using the Strategy Pattern.
     */
    public PricingBreakdown calculatePackagePrice(int packageId, String strategyCode, int guestCount) {
        CateringPackage pkg = getPackageById(packageId);
        if (pkg == null) {
            throw new IllegalArgumentException("Package not found with ID: " + packageId);
        }

        List<PackageMenuItem> assignedItems = packageMenuItemDao.getByPackageId(packageId);
        return pricingContext.executeBreakdown(strategyCode, pkg, guestCount, assignedItems);
    }

    /**
     * Returns list of available pricing strategies for dynamic selection in frontend/API.
     */
    public List<Map<String, String>> getAvailablePricingStrategies() {
        return pricingContext.getAvailableStrategies();
    }
}
