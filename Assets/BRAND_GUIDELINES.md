# ODS Global Network — Brand Identity & Guidelines

> **OFFICIAL MANUAL**: [`./Assets/ODS_BRAND_GUIDELINE.pdf`](./Assets/ODS_BRAND_GUIDELINE.pdf)  
> **ASSETS ROOT**: `./Assets`  
> **STATUS**: VERIFIED & ORGANIZED  

---

## 1. Directory Structure Overview

The `./Assets` directory is organized into a standardized, developer-ready hierarchy using paths relative to the project root:

```text
./Assets/
├── ODS_BRAND_GUIDELINE.pdf        # Official Corporate Brand Manual (PDF)
├── BRAND_GUIDELINES.md            # Living developer guide & color token reference
│
├── fonts/                         # Web-ready Variable Fonts
│   ├── GoogleSansFlex-Variable.ttf # Primary Headlines, Hero & Display Typography
│   ├── Inter-Variable.ttf         # Primary Interface, Navigation & Body Copy
│   ├── Inter-Italic-Variable.ttf  # Interface Italics
│   └── OFL.txt                    # Open Font License
│
├── brand/
│   ├── vector/                    # Scalable SVGs for UI components & headers
│   │   ├── ods-logo-blue-primary.svg   # Primary Navy Logo with wordmark
│   │   ├── ods-logo-blue-secondary.svg # Horizontal Navy Logo
│   │   ├── ods-mark-blue.svg           # Navy Abstract Globe Emblem
│   │   ├── favicon-blue.svg            # Navy Favicon
│   │   ├── ods-logo-gold-primary.svg   # Luxury Gold Gradient Logo with wordmark
│   │   ├── ods-logo-gold-secondary.svg # Horizontal Gold Logo
│   │   ├── ods-mark-gold.svg           # Gold Gradient Emblem
│   │   └── favicon-gold.svg            # Gold Favicon
│   │
│   ├── raster/                    # High-res PNG & JPG for banners, social, UI
│   │   ├── ods-logo-blue-primary.png / .jpg
│   │   ├── ods-logo-gold-primary.png / .jpg
│   │   ├── ods-mark-blue.png / .jpg
│   │   ├── ods-mark-gold.png / .jpg
│   │   ├── brand-pattern.png           # ODS geometric luxury backdrop pattern
│   │   ├── gold-gradient.jpg           # Luxury gradient texture backdrop
│   │   ├── whw-logo.png                # Wanaw Health & Wellness primary logo
│   │   ├── wanaw-gifting-logo.jpeg     # Dedicated Gift Card & Voucher branding
│   │   └── social/
│   │       ├── social-profile-blue.jpg
│   │       └── social-profile-gold.jpg
│   │
│   └── partners/                  # Official Partner & Gateway Badges
│       ├── chapa.png                   # Transparent Chapa Payment Gateway
│       ├── chapa-logo.jpg              # Chapa Badge
│       ├── ethiotel.png                # Ethio Telecom Partner Badge
│       └── capital-bank.png            # Capital Bank Financial Partner Badge
│
├── icons/                         # Domain & Service Category Vector SVGs
│   ├── medical.svg                # Hospitals, Clinics, Physicians
│   ├── wellness.svg               # Wellness, Spas, Rehabilitation
│   ├── home-health.svg            # Home Care & Nursing
│   ├── home-services.svg          # Care Maintenance & Domestic Support
│   ├── hotel-room.svg             # Wellness Stays & Recovery Lodging
│   ├── Mindfulness.svg            # Mental Health, Therapy & Meditation
│   ├── Festivities.svg            # Special Celebrations & Packages
│   ├── hero.svg                   # Vector Hero Illustration
│   └── home.svg                   # Navigation Home Icon
│
└── source-archive/                # Master Design Source Files (Print & AI)
    ├── ai/                        # CMYK AI file.ai & RGB AI File.ai
    ├── cmyk/                      # Print-ready CMYK assets
    └── fonts/                     # Original full font distribution zip
```

---

## 2. Color Palette & Exact Hex Specifications

Derived from vector source gradients and corporate identity:

### Primary Brand Colors (Extracted from ODS_BRAND_GUIDELINE.pdf)

| Role | Color Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Document & Brand Background** | ODS Deep Navy Blue | `#0F285B` | Official document background across all pages in PDF (RGB: 15, 40, 91) |
| **Deep Navy Shade** | Navy Dark Shade | `#081738` | Deep card surfaces, section dividers |
| **Deepest Neutral** | Navy Midnight | `#050F24` | Contrast backdrops and footers |
| **Navy Tint 1** | Royal Navy Tint | `#123168` | Secondary cards, subtle gradient stops (RGB: 18, 49, 104) |
| **Navy Tint 2** | Soft Navy | `#264572` | Card borders, secondary icons (RGB: 38, 69, 114) |
| **Pure White** | Crisp White | `#FFFFFF` | Light mode cards, high-contrast typography |

### Metallic Gold Gradient Palette (Extracted from Vector Mark)

| Gradient Stop | Color Name | Hex Code | Visual Tone |
| :--- | :--- | :--- | :--- |
| `0.05` | Deep Bronze Gold | `#8D7338` | Shadow and depth in metallic elements |
| `0.27` | Classic Gold | `#BE9B49` | Rich mid-tone gold |
| `0.54` | Luminous Gold | `#EDC45B` | Vibrant core gold shine |
| `0.79` | Warm Metallic | `#BB9F54` | Subtle metallic sheen |
| `1.00` | Champagne Highlight | `#F5E189` | Edge reflection and highlight glare |

---

## 3. Typography Standards

The official brand fonts are stored in `./Assets/fonts`:

1. **Display & Headings: `Google Sans Flex`**
   - File: `./Assets/fonts/GoogleSansFlex-Variable.ttf`
   - Role: Hero headings, page titles, section headers, promotional callouts.
   - Recommended weights: `600` (SemiBold) to `800` (ExtraBold).

2. **Interface & Body: `Inter`**
   - Files: `./Assets/fonts/Inter-Variable.ttf`, `./Assets/fonts/Inter-Italic-Variable.ttf`
   - Role: Body paragraphs, navigation links, forms, tables, buttons, badges.
   - Recommended weights: `400` (Regular), `500` (Medium), `600` (SemiBold).

---

## 4. UI Implementation Rules

- **Logo Choice**:
  - On dark backgrounds (`#1C2B21` or `#0A110D`): Use `./Assets/brand/vector/ods-logo-gold-primary.svg` or `ods-mark-gold.svg`.
  - On clean light backgrounds (`#FFFFFF` or `#F8FAF9`): Use `./Assets/brand/vector/ods-logo-blue-primary.svg` or `ods-mark-blue.svg`.
- **Badges**:
  - Partner badges (`./Assets/brand/partners`) should always retain their natural aspect ratios with a consistent height (e.g., `32px` or `40px`) and subtle opacity (`0.85` hovering to `1.0`).
- **Icons**:
  - Always load category SVGs from `./Assets/icons`.
