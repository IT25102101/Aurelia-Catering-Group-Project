
package com.aurelia.catering;

public class TestRunner {
    public static void main(String[] args) {
        int passed = 0;
        int failed = 0;

        System.out.println("==================================================");
        System.out.println(" RUNNING DESIGN PATTERN UNIT TESTS");
        System.out.println("==================================================");

        // 1. Factory Pattern Tests
        try {
            CateringPackageFactoryTest factoryTest = new CateringPackageFactoryTest();
            factoryTest.setUp();
            factoryTest.testCreateWeddingPackage();
            factoryTest.setUp();
            factoryTest.testCreateCorporatePackage();
            factoryTest.setUp();
            factoryTest.testCreateBirthdayPackage();
            factoryTest.setUp();
            factoryTest.testCreateGalaPackage();
            factoryTest.setUp();
            factoryTest.testFallbackToGeneralPackage();
            factoryTest.setUp();
            factoryTest.testCreateFromExisting();

            System.out.println(" [PASS] CateringPackageFactoryTest (6/6 assertions passed)");
            passed += 6;
        } catch (Throwable t) {
            System.err.println(" [FAIL] CateringPackageFactoryTest: " + t.getMessage());
            t.printStackTrace();
            failed++;
        }

        // 2. Strategy Pattern Tests
        try {
            PackagePricingStrategyTest strategyTest = new PackagePricingStrategyTest();
            strategyTest.setUp();
            strategyTest.testFixedPricingStrategy();
            strategyTest.setUp();
            strategyTest.testPerGuestPricingStrategyWithDiscount();
            strategyTest.setUp();
            strategyTest.testOccasionTieredPricingStrategy();
            strategyTest.setUp();
            strategyTest.testFoodValueCostingStrategy();
            strategyTest.setUp();
            strategyTest.testContextDynamicStrategySwitching();

            System.out.println(" [PASS] PackagePricingStrategyTest (5/5 assertions passed)");
            passed += 5;
        } catch (Throwable t) {
            System.err.println(" [FAIL] PackagePricingStrategyTest: " + t.getMessage());
            t.printStackTrace();
            failed++;
        }

        // 3. Staff Strategy Pattern Tests
        try {
            StaffStrategyPatternTest staffStrategyTest = new StaffStrategyPatternTest();
            staffStrategyTest.setUp();
            staffStrategyTest.testKitchenStrategy();
            staffStrategyTest.setUp();
            staffStrategyTest.testDeliveryStrategy();
            staffStrategyTest.setUp();
            staffStrategyTest.testSupervisorStrategy();
            staffStrategyTest.setUp();
            staffStrategyTest.testContextDynamicResolution();

            System.out.println(" [PASS] StaffStrategyPatternTest (4/4 assertions passed)");
            passed += 4;
        } catch (Throwable t) {
            System.err.println(" [FAIL] StaffStrategyPatternTest: " + t.getMessage());
            t.printStackTrace();
            failed++;
        }

        System.out.println("==================================================");
        System.out.println(" TEST SUMMARY: " + passed + " PASSED, " + failed + " FAILED");
        System.out.println("==================================================");

        if (failed > 0) {
            System.exit(1);
        }
    }
}
