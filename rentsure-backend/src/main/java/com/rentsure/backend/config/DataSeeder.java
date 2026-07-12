package com.rentsure.backend.config;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.property.entity.Property;
import com.rentsure.backend.property.entity.enums.PropertyStatus;
import com.rentsure.backend.property.entity.enums.PropertyType;
import com.rentsure.backend.property.repository.PropertyRepository;
import com.rentsure.backend.review.entity.Review;
import com.rentsure.backend.review.repository.ReviewRepository;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.entity.enums.Role;
import com.rentsure.backend.user.entity.enums.UserStatus;
import com.rentsure.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Seeds the database with the exact mock data from the frontend.
 * Runs only when the "dev" profile is active and the DB is empty.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            System.out.println("Database already seeded. Skipping seeding process.");
            return;
        }

        System.out.println("Starting Database Seeding...");

        String defaultPasswordHash = passwordEncoder.encode("Test1234!");

        // 1. Create Users
        User tenant = User.builder()
                .id(UUID.randomUUID()) // The frontend used 'u-tenant-001', which isn't a valid UUID. We generate new ones.
                .fullName("Kwame Mensah")
                .email("tenant@rentsure.com")
                .phone("+233241234567")
                .passwordHash(defaultPasswordHash)
                .role(Role.TENANT)
                .isVerifiedEmail(true)
                .status(UserStatus.ACTIVE)
                .build();

        User landlord = User.builder()
                .id(UUID.randomUUID())
                .fullName("Abena Osei")
                .email("landlord@rentsure.com")
                .phone("+233551234567")
                .passwordHash(defaultPasswordHash)
                .role(Role.LANDLORD)
                .isVerifiedEmail(true)
                .status(UserStatus.ACTIVE)
                .build();

        User admin = User.builder()
                .id(UUID.randomUUID())
                .fullName("Yaw Boateng")
                .email("admin@rentsure.com")
                .phone("+233201234567")
                .passwordHash(defaultPasswordHash)
                .role(Role.ADMIN)
                .isVerifiedEmail(true)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.saveAll(List.of(tenant, landlord, admin));

        System.out.println("Users seeded successfully.");
        System.out.println("!!! PLEASE UPDATE FRONTEND MOCKS WITH THESE UUIDs !!!");
        System.out.println("Tenant ID: " + tenant.getId());
        System.out.println("Landlord ID: " + landlord.getId());
        System.out.println("Admin ID: " + admin.getId());

        // 2. Create Properties
        List<Property> properties = List.of(
            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Cozy Single Room near KNUST")
                .description("Affordable single room in Kotei, 5-minute walk to KNUST main gate. Shared bathroom and kitchen. Ideal for students.")
                .propertyType(PropertyType.SINGLE_ROOM)
                .region("Ashanti")
                .city("Kumasi")
                .area("Kotei")
                .gpsLat(new BigDecimal("6.6745"))
                .gpsLng(new BigDecimal("-1.5716"))
                .pricePerYear(new BigDecimal("3000"))
                .bedrooms(1)
                .bathrooms(0)
                .amenities(List.of("water", "electricity", "security"))
                .isVerified(true)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Self-Contained Studio in Ayeduase")
                .description("Modern self-contained room with private bath and kitchenette. Tiled floor, fan, and prepaid meter. Quiet residential area.")
                .propertyType(PropertyType.SELF_CONTAINED)
                .region("Ashanti")
                .city("Kumasi")
                .area("Ayeduase")
                .gpsLat(new BigDecimal("6.6830"))
                .gpsLng(new BigDecimal("-1.5650"))
                .pricePerYear(new BigDecimal("4800"))
                .bedrooms(1)
                .bathrooms(1)
                .amenities(List.of("water", "electricity", "fan", "tiled floor", "prepaid meter"))
                .isVerified(true)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("2-Bedroom Apartment in Bomso")
                .description("Spacious 2-bed apartment near Bomso junction. Master bedroom en-suite, living area, balcony with garden view. Close to amenities.")
                .propertyType(PropertyType.APARTMENT)
                .region("Ashanti")
                .city("Kumasi")
                .area("Bomso")
                .gpsLat(new BigDecimal("6.6802"))
                .gpsLng(new BigDecimal("-1.5768"))
                .pricePerYear(new BigDecimal("9600"))
                .bedrooms(2)
                .bathrooms(2)
                .amenities(List.of("water", "electricity", "security", "balcony", "parking"))
                .isVerified(false)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Executive 3-Bed House in Ahodwo")
                .description("Fully furnished executive house in the heart of Ahodwo. 3 bedrooms all en-suite, fitted kitchen, garage, and 24/7 security.")
                .propertyType(PropertyType.HOUSE)
                .region("Ashanti")
                .city("Kumasi")
                .area("Ahodwo")
                .gpsLat(new BigDecimal("6.6650"))
                .gpsLng(new BigDecimal("-1.6100"))
                .pricePerYear(new BigDecimal("22000"))
                .bedrooms(3)
                .bathrooms(3)
                .amenities(List.of("water", "electricity", "wifi", "security", "garage", "furnished", "AC"))
                .isVerified(true)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Affordable Room at KNUST Campus Area")
                .description("Budget-friendly single room within walking distance to KNUST campus. Shared facilities, good ventilation, prepaid electricity.")
                .propertyType(PropertyType.SINGLE_ROOM)
                .region("Ashanti")
                .city("Kumasi")
                .area("Kotei")
                .gpsLat(new BigDecimal("6.6739"))
                .gpsLng(new BigDecimal("-1.5725"))
                .pricePerYear(new BigDecimal("3200"))
                .bedrooms(1)
                .bathrooms(0)
                .amenities(List.of("electricity", "water", "fan"))
                .isVerified(false)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Modern Self-Contained in Ayeduase New Site")
                .description("Newly built self-contained with modern finishes. Private bathroom, small kitchen area, tiled throughout. Gated compound.")
                .propertyType(PropertyType.SELF_CONTAINED)
                .region("Ashanti")
                .city("Kumasi")
                .area("Ayeduase")
                .gpsLat(new BigDecimal("6.6855"))
                .gpsLng(new BigDecimal("-1.5630"))
                .pricePerYear(new BigDecimal("5500"))
                .bedrooms(1)
                .bathrooms(1)
                .amenities(List.of("water", "electricity", "security", "tiled floor", "gated compound"))
                .isVerified(true)
                .status(PropertyStatus.RENTED)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("1-Bedroom Apartment in East Legon")
                .description("Stylish 1-bedroom apartment in East Legon. Open-plan living, modern kitchen, 24/7 water, generator backup. Close to A&C Mall.")
                .propertyType(PropertyType.APARTMENT)
                .region("Greater Accra")
                .city("Accra")
                .area("East Legon")
                .gpsLat(new BigDecimal("5.6350"))
                .gpsLng(new BigDecimal("-0.1550"))
                .pricePerYear(new BigDecimal("18000"))
                .bedrooms(1)
                .bathrooms(1)
                .amenities(List.of("water", "electricity", "wifi", "AC", "generator", "gym", "parking"))
                .isVerified(true)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Budget Single Room in Madina")
                .description("Simple single room in a quiet Madina compound. Shared bath, close to Madina market and trotro station. Best for working singles.")
                .propertyType(PropertyType.SINGLE_ROOM)
                .region("Greater Accra")
                .city("Accra")
                .area("Madina")
                .gpsLat(new BigDecimal("5.6680"))
                .gpsLng(new BigDecimal("-0.1680"))
                .pricePerYear(new BigDecimal("3600"))
                .bedrooms(1)
                .bathrooms(0)
                .amenities(List.of("water", "electricity"))
                .isVerified(false)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Luxury 4-Bed House in Cantonments")
                .description("Premium 4-bedroom detached house in Cantonments. Swimming pool, boys quarters, landscaped garden, double garage. Diplomatic area.")
                .propertyType(PropertyType.HOUSE)
                .region("Greater Accra")
                .city("Accra")
                .area("Cantonments")
                .gpsLat(new BigDecimal("5.5760"))
                .gpsLng(new BigDecimal("-0.1780"))
                .pricePerYear(new BigDecimal("25000"))
                .bedrooms(4)
                .bathrooms(4)
                .amenities(List.of("water", "electricity", "wifi", "AC", "security", "pool", "garden", "garage", "furnished"))
                .isVerified(true)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("Self-Contained Room in Osu")
                .description("Vibrant Osu location near Oxford Street. Self-contained with private bath, close to restaurants and nightlife. Ideal for young professionals.")
                .propertyType(PropertyType.SELF_CONTAINED)
                .region("Greater Accra")
                .city("Accra")
                .area("Osu")
                .gpsLat(new BigDecimal("5.5570"))
                .gpsLng(new BigDecimal("-0.1830"))
                .pricePerYear(new BigDecimal("7200"))
                .bedrooms(1)
                .bathrooms(1)
                .amenities(List.of("water", "electricity", "wifi", "fan"))
                .isVerified(true)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("2-Bedroom Apartment in Madina")
                .description("Well-maintained 2-bedroom flat in Madina Zongo Junction area. Both rooms en-suite, spacious hall, fitted kitchen. On a tarred road.")
                .propertyType(PropertyType.APARTMENT)
                .region("Greater Accra")
                .city("Accra")
                .area("Madina")
                .gpsLat(new BigDecimal("5.6700"))
                .gpsLng(new BigDecimal("-0.1650"))
                .pricePerYear(new BigDecimal("10800"))
                .bedrooms(2)
                .bathrooms(2)
                .amenities(List.of("water", "electricity", "security", "parking", "prepaid meter"))
                .isVerified(false)
                .status(PropertyStatus.AVAILABLE)
                .build(),

            Property.builder()
                .id(UUID.randomUUID())
                .landlord(landlord)
                .title("3-Bedroom House in East Legon Hills")
                .description("Beautiful 3-bed semi-detached in East Legon Hills estate. Gated community, children's playground, 24/7 security and water. Family-friendly.")
                .propertyType(PropertyType.HOUSE)
                .region("Greater Accra")
                .city("Accra")
                .area("East Legon")
                .gpsLat(new BigDecimal("5.6420"))
                .gpsLng(new BigDecimal("-0.1480"))
                .pricePerYear(new BigDecimal("20000"))
                .bedrooms(3)
                .bathrooms(3)
                .amenities(List.of("water", "electricity", "wifi", "AC", "security", "parking", "playground", "gated community"))
                .isVerified(true)
                .status(PropertyStatus.AVAILABLE)
                .build()
        );

        propertyRepository.saveAll(properties);

        System.out.println("Properties seeded successfully. Found " + properties.size() + " properties.");

        // 3. Create Bookings and Reviews
        Booking booking1 = Booking.builder()
                .id(UUID.randomUUID())
                .property(properties.get(0))
                .tenant(tenant)
                .status(BookingStatus.COMPLETED)
                .moveInDate(java.time.LocalDate.now().minusMonths(6))
                .durationMonths(12)
                .totalAmount(new BigDecimal("3000"))
                .bookingRef("RS-123456")
                .build();
        
        bookingRepository.save(booking1);

        Review review1 = Review.builder()
                .booking(booking1)
                .reviewer(tenant)
                .reviewee(landlord)
                .rating(5)
                .comment("Great landlord, very responsive!")
                .build();
        
        reviewRepository.save(review1);
        
        Booking booking2 = Booking.builder()
                .id(UUID.randomUUID())
                .property(properties.get(1))
                .tenant(tenant)
                .status(BookingStatus.REQUESTED)
                .moveInDate(java.time.LocalDate.now().plusDays(10))
                .durationMonths(12)
                .totalAmount(new BigDecimal("4800"))
                .bookingRef("RS-654321")
                .build();

        bookingRepository.save(booking2);

        System.out.println("Bookings and Reviews seeded successfully.");
        System.out.println("Database Seeding Completed.");
    }
}
