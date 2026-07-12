package com.rentsure.backend.payment.service;

import java.math.BigDecimal;

/**
 * Abstracts the real Paystack transfer of escrow funds to the Landlord's subaccount.
 */
public interface TransferService {
    void transfer(String recipientAccountId, BigDecimal amount, String reference);
}
