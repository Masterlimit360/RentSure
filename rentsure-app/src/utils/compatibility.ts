/**
 * Pure scoring spec. Any weight change MUST update the unit test fixtures 
 * in the same commit — the tests ARE the specification.
 * 
 * IMPORTANT: Dealbreaker cap. If ANY required amenity is missing, the 
 * TOTAL score is hard-capped at 40, overriding all other math.
 */

import { TenantPreferences, Property, CompatibilityScore, CompatibilityFactor } from '@/types';

export function computeCompatibility(prefs: TenantPreferences, property: Property): CompatibilityScore {
  let hasLocationPref = prefs.preferredCities.length > 0 || prefs.preferredAreas.length > 0;
  let hasTypePref = prefs.propertyTypes.length > 0;

  // Base Weights
  const BASE_WEIGHTS = {
    BUDGET: 30,
    LOCATION: 25,
    TYPE: 15,
    ROOMS: 10,
    AMENITIES: 20
  };

  let activeWeightSum = BASE_WEIGHTS.BUDGET + BASE_WEIGHTS.ROOMS + BASE_WEIGHTS.AMENITIES;
  if (hasLocationPref) activeWeightSum += BASE_WEIGHTS.LOCATION;
  if (hasTypePref) activeWeightSum += BASE_WEIGHTS.TYPE;

  const multiplier = 100 / activeWeightSum;

  const factors: CompatibilityFactor[] = [];
  let rawTotal = 0;
  let dealbreakerTriggered = false;
  let missingRequiredAmenity = '';

  // 1. BUDGET (30 base)
  // price <= 80% of budget -> 30; <= 100% -> linear 30->20; <= 115% -> linear 20->5; above -> 0.
  let budgetScore = 0;
  let budgetDetail = '';
  const price = property.pricePerYear;
  const budget = prefs.budgetMaxPerYear;
  
  if (budget <= 0) {
    budgetScore = 0;
    budgetDetail = 'Budget not set';
  } else if (price <= 0.8 * budget) {
    budgetScore = BASE_WEIGHTS.BUDGET;
    budgetDetail = `GHS ${price.toLocaleString()} fits well within your GHS ${budget.toLocaleString()} budget`;
  } else if (price <= budget) {
    // Linear 30 to 20 between 80% and 100%
    const ratio = (price - 0.8 * budget) / (0.2 * budget); // 0 at 80%, 1 at 100%
    budgetScore = 30 - (10 * ratio);
    budgetDetail = `GHS ${price.toLocaleString()} is within your GHS ${budget.toLocaleString()} budget`;
  } else if (price <= 1.15 * budget) {
    // Linear 20 to 5 between 100% and 115%
    const ratio = (price - budget) / (0.15 * budget); // 0 at 100%, 1 at 115%
    budgetScore = 20 - (15 * ratio);
    budgetDetail = `GHS ${price.toLocaleString()} is slightly above your GHS ${budget.toLocaleString()} budget`;
  } else {
    budgetScore = 0;
    budgetDetail = `GHS ${price.toLocaleString()} exceeds your budget significantly`;
  }
  
  factors.push({
    key: 'BUDGET',
    label: 'Budget',
    score: budgetScore * multiplier,
    maxScore: BASE_WEIGHTS.BUDGET * multiplier,
    detail: budgetDetail
  });
  rawTotal += budgetScore * multiplier;

  // 2. LOCATION (25 base)
  if (hasLocationPref) {
    let locScore = 0;
    let locDetail = '';
    
    const matchesArea = prefs.preferredAreas.includes(property.area);
    const matchesCity = prefs.preferredCities.includes(property.city) || matchesArea; // assuming area match implies city match

    if (matchesArea) {
      locScore = 25;
      locDetail = `Matches your preferred area (${property.area})`;
    } else if (matchesCity) {
      locScore = 15;
      locDetail = `Matches your preferred city (${property.city})`;
    } else {
      locScore = 0;
      locDetail = `Outside your preferred locations`;
    }

    factors.push({
      key: 'LOCATION',
      label: 'Location',
      score: locScore * multiplier,
      maxScore: BASE_WEIGHTS.LOCATION * multiplier,
      detail: locDetail
    });
    rawTotal += locScore * multiplier;
  }

  // 3. TYPE (15 base)
  if (hasTypePref) {
    let typeScore = 0;
    let typeDetail = '';
    if (prefs.propertyTypes.includes(property.propertyType)) {
      typeScore = 15;
      typeDetail = `Matches your preferred property type`;
    } else {
      typeScore = 0;
      typeDetail = `Not your preferred property type`;
    }

    factors.push({
      key: 'TYPE',
      label: 'Property Type',
      score: typeScore * multiplier,
      maxScore: BASE_WEIGHTS.TYPE * multiplier,
      detail: typeDetail
    });
    rawTotal += typeScore * multiplier;
  }

  // 4. ROOMS (10 base)
  let roomsScore = 0;
  let roomsDetail = '';
  if (property.bedrooms >= prefs.minBedrooms) {
    roomsScore = 10;
    roomsDetail = `Has the required number of bedrooms (${property.bedrooms})`;
  } else if (property.bedrooms === prefs.minBedrooms - 1) {
    roomsScore = 4;
    roomsDetail = `One bedroom short of your preference`;
  } else {
    roomsScore = 0;
    roomsDetail = `Too few bedrooms (${property.bedrooms})`;
  }

  factors.push({
    key: 'ROOMS',
    label: 'Bedrooms',
    score: roomsScore * multiplier,
    maxScore: BASE_WEIGHTS.ROOMS * multiplier,
    detail: roomsDetail
  });
  rawTotal += roomsScore * multiplier;

  // 5. AMENITIES (20 base)
  let amScore = 0;
  let amDetail = '';
  const propertyAmenities = property.amenities || [];
  
  if (propertyAmenities.length === 0 && (prefs.requiredAmenities.length > 0 || prefs.niceToHaveAmenities.length > 0)) {
    // Missing data edge case
    amScore = 0;
    amDetail = `No data from landlord`;
  } else {
    // Check dealbreakers
    for (const req of prefs.requiredAmenities) {
      if (!propertyAmenities.includes(req)) {
        dealbreakerTriggered = true;
        missingRequiredAmenity = req;
        break;
      }
    }

    if (dealbreakerTriggered) {
      amScore = 0;
      amDetail = `Missing: ${missingRequiredAmenity}`;
    } else {
      // Base 12 for having all required
      let baseAm = prefs.requiredAmenities.length > 0 ? 12 : 0;
      
      // Pro-rate the remaining 8 points for nice-to-haves
      let bonusAm = 0;
      if (prefs.niceToHaveAmenities.length > 0) {
        if (baseAm === 0) {
          // If no required amenities, the full 20 points come from nice-to-haves
          const matches = prefs.niceToHaveAmenities.filter(a => propertyAmenities.includes(a)).length;
          bonusAm = 20 * (matches / prefs.niceToHaveAmenities.length);
        } else {
          // If required exists, up to 8 points from nice-to-haves
          const matches = prefs.niceToHaveAmenities.filter(a => propertyAmenities.includes(a)).length;
          bonusAm = 8 * (matches / prefs.niceToHaveAmenities.length);
        }
      } else if (baseAm > 0) {
        // If no nice-to-haves but all required are met, give full 20
        baseAm = 20;
      } else {
        // No required, no nice-to-haves. 
        baseAm = 20; 
      }
      
      amScore = baseAm + bonusAm;
      amDetail = `Matches your amenity preferences`;
    }
  }

  factors.push({
    key: 'AMENITIES',
    label: 'Amenities',
    score: amScore * multiplier,
    maxScore: BASE_WEIGHTS.AMENITIES * multiplier,
    detail: amDetail
  });
  rawTotal += amScore * multiplier;

  // Dealbreaker Cap and Rounding
  let finalTotal = Math.round(rawTotal);
  if (dealbreakerTriggered && finalTotal > 40) {
    finalTotal = 40;
  }

  // Round individual factors to whole integers
  factors.forEach(f => {
    f.score = Math.round(f.score);
    f.maxScore = Math.round(f.maxScore);
  });

  return {
    total: finalTotal,
    factors
  };
}
