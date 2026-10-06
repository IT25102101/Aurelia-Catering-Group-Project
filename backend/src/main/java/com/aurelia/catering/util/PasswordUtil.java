package com.aurelia.catering.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;

/**
 * Password hashing helper (no extra library needed - uses the JDK only).
 *
 * Stored format:  pbkdf2$<iterations>$<salt base64>$<hash base64>
 * Example length: about 90 characters, which fits the VARCHAR(255) PasswordHash columns.
 *
 * Old accounts that still hold a plain-text password keep working:
 * matches() accepts both formats, and AuthController re-saves a hashed
 * version the first time such a user logs in successfully.
 */
public final class PasswordUtil {

    private static final String PREFIX = "pbkdf2";
    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int ITERATIONS = 120_000;
    private static final int SALT_BYTES = 16;
    private static final int KEY_BITS = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordUtil() {
    }

    /** Hashes a plain password with a fresh random salt. */
    public static String hash(String plain) {
        if (plain == null) {
            throw new IllegalArgumentException("Password cannot be null.");
        }
        byte[] salt = new byte[SALT_BYTES];
        RANDOM.nextBytes(salt);
        byte[] derived = derive(plain, salt, ITERATIONS);
        return PREFIX + "$" + ITERATIONS + "$"
                + Base64.getEncoder().encodeToString(salt) + "$"
                + Base64.getEncoder().encodeToString(derived);
    }

    /** True when the value already looks like output of hash(). */
    public static boolean isHashed(String stored) {
        if (stored == null) {
            return false;
        }
        String[] parts = stored.split("\\$");
        if (parts.length != 4 || !PREFIX.equals(parts[0])) {
            return false;
        }
        try {
            Integer.parseInt(parts[1]);
            Base64.getDecoder().decode(parts[2]);
            Base64.getDecoder().decode(parts[3]);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /** Hashes the value unless it is already hashed (safe to call twice). */
    public static String hashIfNeeded(String value) {
        return isHashed(value) ? value : hash(value);
    }

    /** True when the stored value is still an old plain-text password. */
    public static boolean needsUpgrade(String stored) {
        return stored != null && !isHashed(stored);
    }

    /** Checks a typed password against the stored value (hashed or legacy plain text). */
    public static boolean matches(String plain, String stored) {
        if (plain == null || stored == null) {
            return false;
        }
        if (!isHashed(stored)) {
            // legacy plain-text row: compare in constant time
            return MessageDigest.isEqual(
                    plain.getBytes(StandardCharsets.UTF_8),
                    stored.getBytes(StandardCharsets.UTF_8));
        }
        String[] parts = stored.split("\\$");
        int iterations = Integer.parseInt(parts[1]);
        byte[] salt = Base64.getDecoder().decode(parts[2]);
        byte[] expected = Base64.getDecoder().decode(parts[3]);
        byte[] actual = derive(plain, salt, iterations);
        return MessageDigest.isEqual(expected, actual);
    }

    private static byte[] derive(String plain, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(plain.toCharArray(), salt, iterations, KEY_BITS);
            return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Password hashing is not available: " + e.getMessage(), e);
        }
    }
}
