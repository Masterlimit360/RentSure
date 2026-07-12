package com.rentsure.backend.payment.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Dev-only stub for simulating Escrow releases.
 */
@Service
@Profile("dev")
public class LoggingTransferService implements TransferService {

    @Override
    public void transfer(String recipientAccountId, BigDecimal amount, String reference) {
        // IMPORTANT: In prod, this must call Paystack Transfers API to physically move the money.
        System.out.println(">>> [DEV] SIMULATED TRANSFER of GHS " + amount + " to account " + recipientAccountId + " for ref " + reference);
    }
}
