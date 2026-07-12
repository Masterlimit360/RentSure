package com.rentsure.backend.booking.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class BookingMovedInEvent extends ApplicationEvent {
    private final UUID bookingId;

    public BookingMovedInEvent(Object source, UUID bookingId) {
        super(source);
        this.bookingId = bookingId;
    }
}
