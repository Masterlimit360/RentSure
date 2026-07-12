package com.rentsure.backend.entity;

import com.rentsure.backend.entity.enums.MediaType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "property_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Enumerated(EnumType.STRING)
    @Column(length = 6, nullable = false)
    private MediaType mediaType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String url;

    private Integer sortOrder;
}
