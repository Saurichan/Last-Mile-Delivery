import { BusinessType, BusinessRules } from '../types';

export const BUSINESS_TYPE_METADATA: Record<BusinessType, {
  label: string;
  category: string;
  icon: string;
  description: string;
  defaultRules: BusinessRules;
}> = {
  bakery: {
    label: 'Bakery & Pastries',
    category: 'Food & Beverage',
    icon: 'Cake',
    description: 'Prioritizes rapid delivery to maintain oven freshness and fragile handling.',
    defaultRules: {
      timeSensitivityWeight: 9,
      freshnessWeight: 9,
      priorityWeight: 8,
      distanceEfficiencyWeight: 7,
      urgencyWeight: 7,
      customerAvailabilityWeight: 8,
      batchDeliveryWeight: 5,
      capacityWeight: 6,
      waitingTimeToleranceMin: 10,
      defaultServiceTimeMin: 3,
    }
  },
  pharmacy: {
    label: 'Pharmacy & Medicine',
    category: 'Healthcare',
    icon: 'Pill',
    description: 'Prioritizes urgent prescriptions and tight customer availability windows.',
    defaultRules: {
      timeSensitivityWeight: 10,
      freshnessWeight: 4,
      priorityWeight: 10,
      distanceEfficiencyWeight: 5,
      urgencyWeight: 10,
      customerAvailabilityWeight: 9,
      batchDeliveryWeight: 4,
      capacityWeight: 4,
      waitingTimeToleranceMin: 5,
      defaultServiceTimeMin: 4,
    }
  },
  grocery: {
    label: 'Grocery Store & Supermarket',
    category: 'Retail',
    icon: 'ShoppingBag',
    description: 'Heavy batching, high vehicle capacity management, and route efficiency.',
    defaultRules: {
      timeSensitivityWeight: 6,
      freshnessWeight: 7,
      priorityWeight: 6,
      distanceEfficiencyWeight: 9,
      urgencyWeight: 5,
      customerAvailabilityWeight: 7,
      batchDeliveryWeight: 10,
      capacityWeight: 10,
      waitingTimeToleranceMin: 15,
      defaultServiceTimeMin: 6,
    }
  },
  tiffin_service: {
    label: 'Tiffin & Meal Box Service',
    category: 'Food & Beverage',
    icon: 'UtensilsCrossed',
    description: 'Strict lunch/dinner meal-time windows with tight neighborhood clustering.',
    defaultRules: {
      timeSensitivityWeight: 10,
      freshnessWeight: 9,
      priorityWeight: 7,
      distanceEfficiencyWeight: 8,
      urgencyWeight: 8,
      customerAvailabilityWeight: 10,
      batchDeliveryWeight: 9,
      capacityWeight: 7,
      waitingTimeToleranceMin: 5,
      defaultServiceTimeMin: 2,
    }
  },
  flower_shop: {
    label: 'Flower Shop & Florist',
    category: 'Retail',
    icon: 'Flower2',
    description: 'Strict event deadlines, high fragile care, and timed delivery windows.',
    defaultRules: {
      timeSensitivityWeight: 9,
      freshnessWeight: 10,
      priorityWeight: 8,
      distanceEfficiencyWeight: 6,
      urgencyWeight: 8,
      customerAvailabilityWeight: 9,
      batchDeliveryWeight: 5,
      capacityWeight: 7,
      waitingTimeToleranceMin: 10,
      defaultServiceTimeMin: 4,
    }
  },
  restaurant: {
    label: 'Restaurant Delivery',
    category: 'Food & Beverage',
    icon: 'Utensils',
    description: 'Ultra-fast delivery for hot meals and short radius dispatches.',
    defaultRules: {
      timeSensitivityWeight: 10,
      freshnessWeight: 10,
      priorityWeight: 9,
      distanceEfficiencyWeight: 6,
      urgencyWeight: 9,
      customerAvailabilityWeight: 7,
      batchDeliveryWeight: 6,
      capacityWeight: 5,
      waitingTimeToleranceMin: 8,
      defaultServiceTimeMin: 3,
    }
  },
  cloud_kitchen: {
    label: 'Cloud Kitchen',
    category: 'Food & Beverage',
    icon: 'Flame',
    description: 'Multi-brand food dispatch with high peak-hour volume and rapid fulfillment.',
    defaultRules: {
      timeSensitivityWeight: 9,
      freshnessWeight: 9,
      priorityWeight: 8,
      distanceEfficiencyWeight: 7,
      urgencyWeight: 8,
      customerAvailabilityWeight: 7,
      batchDeliveryWeight: 8,
      capacityWeight: 6,
      waitingTimeToleranceMin: 10,
      defaultServiceTimeMin: 3,
    }
  },
  cafe: {
    label: 'Café & Beverage',
    category: 'Food & Beverage',
    icon: 'Coffee',
    description: 'Hot/cold beverage delivery requiring fast transit times.',
    defaultRules: {
      timeSensitivityWeight: 9,
      freshnessWeight: 9,
      priorityWeight: 7,
      distanceEfficiencyWeight: 7,
      urgencyWeight: 8,
      customerAvailabilityWeight: 7,
      batchDeliveryWeight: 6,
      capacityWeight: 5,
      waitingTimeToleranceMin: 8,
      defaultServiceTimeMin: 2,
    }
  },
  dairy: {
    label: 'Dairy & Milk Delivery',
    category: 'Food & Beverage',
    icon: 'Milk',
    description: 'Early morning high-density neighborhood routes with heavy crate loads.',
    defaultRules: {
      timeSensitivityWeight: 8,
      freshnessWeight: 9,
      priorityWeight: 6,
      distanceEfficiencyWeight: 10,
      urgencyWeight: 6,
      customerAvailabilityWeight: 8,
      batchDeliveryWeight: 10,
      capacityWeight: 9,
      waitingTimeToleranceMin: 5,
      defaultServiceTimeMin: 1,
    }
  },
  medical_supplies: {
    label: 'Medical & Hospital Supplies',
    category: 'Healthcare',
    icon: 'Cross',
    description: 'High reliability, temperature control, and critical emergency priorities.',
    defaultRules: {
      timeSensitivityWeight: 10,
      freshnessWeight: 6,
      priorityWeight: 10,
      distanceEfficiencyWeight: 5,
      urgencyWeight: 10,
      customerAvailabilityWeight: 9,
      batchDeliveryWeight: 4,
      capacityWeight: 7,
      waitingTimeToleranceMin: 10,
      defaultServiceTimeMin: 7,
    }
  },
  diagnostic_samples: {
    label: 'Diagnostic Sample Collection',
    category: 'Healthcare',
    icon: 'TestTube',
    description: 'Strict pickup-to-lab timeline constraints and specimen temperature limits.',
    defaultRules: {
      timeSensitivityWeight: 10,
      freshnessWeight: 10,
      priorityWeight: 9,
      distanceEfficiencyWeight: 7,
      urgencyWeight: 10,
      customerAvailabilityWeight: 8,
      batchDeliveryWeight: 6,
      capacityWeight: 5,
      waitingTimeToleranceMin: 8,
      defaultServiceTimeMin: 5,
    }
  },
  stationery: {
    label: 'Stationery & Bookstore',
    category: 'Retail',
    icon: 'BookOpen',
    description: 'Efficient distance batching with standard delivery windows.',
    defaultRules: {
      timeSensitivityWeight: 4,
      freshnessWeight: 1,
      priorityWeight: 5,
      distanceEfficiencyWeight: 9,
      urgencyWeight: 4,
      customerAvailabilityWeight: 6,
      batchDeliveryWeight: 8,
      capacityWeight: 7,
      waitingTimeToleranceMin: 15,
      defaultServiceTimeMin: 3,
    }
  },
  electronics: {
    label: 'Electronics & Accessories',
    category: 'Retail',
    icon: 'Tv',
    description: 'High-value security, signature verification required, fragile handling.',
    defaultRules: {
      timeSensitivityWeight: 6,
      freshnessWeight: 1,
      priorityWeight: 7,
      distanceEfficiencyWeight: 8,
      urgencyWeight: 6,
      customerAvailabilityWeight: 8,
      batchDeliveryWeight: 7,
      capacityWeight: 6,
      waitingTimeToleranceMin: 12,
      defaultServiceTimeMin: 5,
    }
  },
  boutique: {
    label: 'Fashion Boutique & Apparel',
    category: 'Retail',
    icon: 'Shirt',
    description: 'Scheduled try-at-home or evening delivery windows.',
    defaultRules: {
      timeSensitivityWeight: 5,
      freshnessWeight: 1,
      priorityWeight: 6,
      distanceEfficiencyWeight: 8,
      urgencyWeight: 5,
      customerAvailabilityWeight: 9,
      batchDeliveryWeight: 7,
      capacityWeight: 6,
      waitingTimeToleranceMin: 15,
      defaultServiceTimeMin: 6,
    }
  },
  general_store: {
    label: 'General Store',
    category: 'Retail',
    icon: 'Store',
    description: 'Mixed-goods delivery with standard efficiency balancing.',
    defaultRules: {
      timeSensitivityWeight: 5,
      freshnessWeight: 3,
      priorityWeight: 5,
      distanceEfficiencyWeight: 8,
      urgencyWeight: 5,
      customerAvailabilityWeight: 7,
      batchDeliveryWeight: 8,
      capacityWeight: 7,
      waitingTimeToleranceMin: 15,
      defaultServiceTimeMin: 4,
    }
  },
  laundry: {
    label: 'Laundry & Dry Cleaning',
    category: 'Services',
    icon: 'Sparkles',
    description: 'Scheduled morning pickup & evening delivery slots.',
    defaultRules: {
      timeSensitivityWeight: 6,
      freshnessWeight: 2,
      priorityWeight: 6,
      distanceEfficiencyWeight: 9,
      urgencyWeight: 5,
      customerAvailabilityWeight: 9,
      batchDeliveryWeight: 9,
      capacityWeight: 8,
      waitingTimeToleranceMin: 12,
      defaultServiceTimeMin: 4,
    }
  },
  cleaning: {
    label: 'Cleaning Supplies & Services',
    category: 'Services',
    icon: 'Brush',
    description: 'Route optimization for scheduled service appointments and commercial supplies.',
    defaultRules: {
      timeSensitivityWeight: 7,
      freshnessWeight: 1,
      priorityWeight: 6,
      distanceEfficiencyWeight: 8,
      urgencyWeight: 6,
      customerAvailabilityWeight: 8,
      batchDeliveryWeight: 7,
      capacityWeight: 8,
      waitingTimeToleranceMin: 15,
      defaultServiceTimeMin: 8,
    }
  },
  nursery_plants: {
    label: 'Plant Nursery & Garden',
    category: 'Services',
    icon: 'Trees',
    description: 'Bulky fragile items requiring careful handling and direct drops.',
    defaultRules: {
      timeSensitivityWeight: 6,
      freshnessWeight: 8,
      priorityWeight: 6,
      distanceEfficiencyWeight: 8,
      urgencyWeight: 5,
      customerAvailabilityWeight: 8,
      batchDeliveryWeight: 6,
      capacityWeight: 9,
      waitingTimeToleranceMin: 12,
      defaultServiceTimeMin: 5,
    }
  },
  pet_supplies: {
    label: 'Pet Food & Supplies',
    category: 'Services',
    icon: 'Dog',
    description: 'Heavy pet food bags with regular subscription route patterns.',
    defaultRules: {
      timeSensitivityWeight: 5,
      freshnessWeight: 3,
      priorityWeight: 6,
      distanceEfficiencyWeight: 9,
      urgencyWeight: 5,
      customerAvailabilityWeight: 7,
      batchDeliveryWeight: 8,
      capacityWeight: 9,
      waitingTimeToleranceMin: 15,
      defaultServiceTimeMin: 4,
    }
  },
  custom_business: {
    label: 'Custom Local Business',
    category: 'Other',
    icon: 'Briefcase',
    description: 'Fully customizable constraints and delivery rule weights.',
    defaultRules: {
      timeSensitivityWeight: 6,
      freshnessWeight: 5,
      priorityWeight: 6,
      distanceEfficiencyWeight: 8,
      urgencyWeight: 6,
      customerAvailabilityWeight: 7,
      batchDeliveryWeight: 7,
      capacityWeight: 7,
      waitingTimeToleranceMin: 10,
      defaultServiceTimeMin: 4,
    }
  }
};

export function getDefaultRulesForType(type: BusinessType): BusinessRules {
  return BUSINESS_TYPE_METADATA[type]?.defaultRules || BUSINESS_TYPE_METADATA.custom_business.defaultRules;
}
