package com.aurelia.catering;

import com.aurelia.catering.util.PasswordUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for PasswordUtil (PBKDF2 Hashing and Legacy Migration).
 */
public class PasswordUtilTest {

    @Test
    @DisplayName("Should generate valid PBKDF2 hash with salt")
    void testHashFormat() {
        String hash = PasswordUtil.hash("Secret123!");
        assertNotNull(hash);
        assertTrue(hash.startsWith("pbkdf2$"), "Hash format must start with pbkdf2$");
        String[] parts = hash.split("\\$");
        assertEquals(4, parts.length, "Hash must contain prefix, iterations, salt, and hash components");
    }

    @Test
    @DisplayName("Matching password should verify successfully")
    void testMatchesSuccess() {
        String password = "CateringManager#2026";
        String hash = PasswordUtil.hash(password);
        assertTrue(PasswordUtil.matches(password, hash), "Correct password must match hash");
    }

    @Test
    @DisplayName("Incorrect password should fail verification")
    void testMatchesFailure() {
        String hash = PasswordUtil.hash("Password123");
        assertFalse(PasswordUtil.matches("WrongPassword", hash), "Incorrect password must return false");
    }

    @Test
    @DisplayName("Legacy plain-text passwords should match and trigger upgrade")
    void testLegacyPlainTextMigration() {
        String plain = "legacyAdminPass";
        assertTrue(PasswordUtil.matches(plain, plain), "Legacy plain text should match itself");
        assertTrue(PasswordUtil.needsUpgrade(plain), "Plain text must indicate need for upgrade");
        
        String hashed = PasswordUtil.hash(plain);
        assertFalse(PasswordUtil.needsUpgrade(hashed), "Hashed password should not need upgrade");
    }

    @Test
    @DisplayName("Null or empty password handling")
    void testNullOrEmptyHandling() {
        assertFalse(PasswordUtil.matches(null, "hash"), "Null password should return false");
        assertFalse(PasswordUtil.matches("pass", null), "Null hash should return false");
        assertThrows(IllegalArgumentException.class, () -> PasswordUtil.hash(null), "Null password to hash() should throw IllegalArgumentException");
    }
}
