package com.rentsure.backend.payment.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class BookingPaidEvent extends ApplicationEvent {
    private final UUID bookingId;

    public BookingPaidEvent(Object source, UUID bookingId) {
        super(source);
        this.bookingId = bookingId;
    }
}
