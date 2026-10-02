// VENM CATALOG — MOCK DATA ARCHITECTURE
// Easy to replace with API / Database responses in Phase 2

export const COLLECTIONS = [
  {
    id: "navratri",
    slug: "navratri",
    name: "NAVRATRI EDIT",
    tagline: "GUJARATI ETHOS × CYBER STREETWEAR",
    description: "Traditional Garba silhouettes reengineered through raw distressed denim, oversized technical outerwear, and mirror-work streetwear details. Designed for midnight Garba energy.",
    coverImage: "/assets/campaign/HOMEPAGE_2.webp",
    isActive: true,
    isFeatured: true,
    productCount: 8,
    season: "FESTIVE 2026"
  },
  {
    id: "diwali",
    slug: "diwali",
    name: "DIWALI EDIT",
    tagline: "FESTIVE LUMINANCE & MODULAR DRAPES",
    description: "Deep obsidian silks, metallic brass accents, and structured Indo-Western silhouettes crafted for modern evening celebrations.",
    coverImage: "/assets/campaign/nas8.jpg",
    isActive: false,
    isFeatured: true,
    productCount: 6,
    season: "COMING SOON"
  },
  {
    id: "ethnic",
    slug: "ethnic",
    name: "CONTEMPORARY ETHNIC",
    tagline: "REENGINEERED HERITAGE SILHOUETTES",
    description: "Traditional Indian craftsmanship infused with modern boxy cuts, asymmetric hems, and tactical functional detailing.",
    coverImage: "/assets/campaign/nas1.webp",
    isActive: true,
    isFeatured: false,
    productCount: 6,
    season: "PERMANENT"
  },
  {
    id: "indo-western",
    slug: "indo-western",
    name: "INDO-WESTERN",
    tagline: "EXPERIMENTAL HYBRID SUITING",
    description: "Where sharp Western tailoring meets fluid Eastern drapes and hand-embroidered motif patches.",
    coverImage: "/assets/campaign/nas9.jpg",
    isActive: true,
    isFeatured: true,
    productCount: 5,
    season: "ESSENTIALS"
  },
  {
    id: "denim",
    slug: "denim",
    name: "RAW DENIM",
    tagline: "HEAVYWEIGHT DISTRESSED DENIM",
    description: "14oz Japanese & Indian selvedge denim featuring laser-etched Gujarati motifs, cargo pockets, and relaxed wide-leg cuts.",
    coverImage: "/assets/collections/denim.jpg",
    isActive: true,
    isFeatured: false,
    productCount: 7,
    season: "CORE"
  },
  {
    id: "street",
    slug: "street",
    name: "STREETWEAR",
    tagline: "METROPOLITAN YOUTH CULTURE",
    description: "400GSM cotton loopback hoodies, drop-shoulder graphic tees, and utility shorts stamped with VENM Kinetic iconography.",
    coverImage: "/assets/products/Denim Jacket.jpg",
    isActive: true,
    isFeatured: false,
    productCount: 9,
    season: "PERMANENT"
  },
  {
    id: "y2k",
    slug: "y2k",
    name: "Y2K KINETIC",
    tagline: "RETRO-FUTURISTIC EXPERIMENTAL",
    description: "Cybernetic chrome prints, contrast topstitching, translucent nylon shells, and Y2K aesthetic proportions.",
    coverImage: "/assets/campaign/nas3.webp",
    isActive: true,
    isFeatured: false,
    productCount: 4,
    season: "CAPSULE"
  },
  {
    id: "accessories",
    slug: "accessories",
    name: "ACCESSORIES",
    tagline: "UTILITY GEAR & EMBROIDERED TOTES",
    description: "Heavy-duty canvas totes, embroidered headwear, and tactical crossbody gear designed to elevate your fit.",
    coverImage: "/assets/products/DIY ethnic tie made with oxidised jewellery pieces.jpg",
    isActive: true,
    isFeatured: false,
    productCount: 5,
    season: "PERMANENT"
  }
];

export const PRODUCTS = [
  {
    id: "vnm-001",
    slug: "garba-cyber-vest-jac1",
    name: "GARBA CYBER VEST",
    collectionSlug: "navratri",
    collectionName: "NAVRATRI EDIT",
    category: "Outerwear",
    description: "Oversized tactical utility vest constructed from water-repellent shell nylon, accented with hand-stitched Gujarati mirrorwork tabs and heavy matte black hardware.",
    details: [
      "Material: 100% Water-repellent Technical Nylon",
      "Embroidery: Traditional Mirrorwork Patchwork on Chest",
      "Fit: Oversized Drop-shoulder Silhouette",
      "Hardware: Custom VENM Anodized Metal Zippers",
      "Edition: Limited Navratri Run"
    ],
    images: [
      "/assets/products/Denim Jacket.jpg",
      "/assets/products/Jean Jacket.jpg"
    ],
    isFeatured: true,
    isNavratriEdit: true,
    sizes: ["S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹2,200",
    minPrice: "1800",
    maxPrice: "2500",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Custom Gujarati mirrorwork positioning, distressed accents, and tailored sizing available.",
    sizingInfo: "Custom sizing available according to your requirements.",
    sourceAttribution: "VENM Studio Design",
    tags: ["NavratriEdit", "IndoWestern", "Outerwear", "Tactical"],
    garmentCare: "Dry clean only. Do not iron directly on mirrorwork patches."
  },
  {
    id: "vnm-002",
    slug: "dandiya-distressed-denim-den1",
    name: "DANDIYA WIDE-LEG RAW DENIM",
    collectionSlug: "navratri",
    collectionName: "NAVRATRI EDIT",
    category: "Bottoms",
    description: "14.5oz raw Indigo denim cut in an aggressive wide-leg silhouette. Features laser-etched geometric Garba circle motifs down the outer seams and distressed knee slits.",
    details: [
      "Fabric: 14.5oz Heavyweight 100% Cotton Denim",
      "Detailing: Laser-etched Gujarati Geometric Motifs",
      "Fit: Relaxed Wide-leg Fit with Stacking Ankle Cut",
      "Pockets: 6-Pocket Utility Construction",
      "Origin: Crafted in Ahmedabad Studio"
    ],
    images: [
      "/assets/collections/denim.jpg",
      "/assets/products/Jean Jacket.jpg"
    ],
    isFeatured: true,
    isNavratriEdit: true,
    sizes: ["XS", "S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "₹2,400 – ₹3,200",
    minPrice: "2400",
    maxPrice: "3200",
    priceDisplayMode: "PRICE_RANGE",
    customizationInfo: "Laser-etching pattern selection, inseam length customization, and custom wash options.",
    sizingInfo: "Waist and inseam can be tailored precisely to your measurements.",
    sourceAttribution: "VENM Custom Denim Reference",
    tags: ["NavratriEdit", "RawDenim", "Bottoms", "WideLeg"],
    garmentCare: "Hand wash cold inside out. Hang dry."
  },
  {
    id: "vnm-003",
    slug: "kathiawadi-heavyweight-tee-tees1",
    name: "KATHIAWADI MOTIF TEE",
    collectionSlug: "navratri",
    collectionName: "NAVRATRI EDIT",
    category: "Tops",
    description: "280GSM heavy combed cotton graphic tee featuring distressed high-density plastisol prints of traditional Kathiawadi folk art rendered in neon venom green.",
    details: [
      "Fabric: 100% Organic Heavy Combed Cotton (280 GSM)",
      "Print: High-density Neon Screenprint + Back Slogan",
      "Fit: Signature Boxy Drop-shoulder",
      "Neckline: Ribbed 1.25 inch Crew Collar"
    ],
    images: [
      "/assets/products/download (1).jpg",
      "/assets/products/download (2).jpg"
    ],
    isFeatured: true,
    isNavratriEdit: true,
    sizes: ["S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹1,450",
    minPrice: "1450",
    maxPrice: "1800",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Custom graphic placement, neon stitch accents, and oversized fit preferences.",
    sizingInfo: "Custom chest width and shoulder drop can be tailored upon request.",
    sourceAttribution: "VENM Graphic Reference",
    tags: ["NavratriEdit", "GraphicTee", "Tops", "Streetwear"],
    garmentCare: "Machine wash cold. Warm iron on reverse."
  },
  {
    id: "vnm-004",
    slug: "chunri-deconstructed-kimono-nas1",
    name: "CHUNRI DECONSTRUCTED KIMONO",
    collectionSlug: "navratri",
    collectionName: "NAVRATRI EDIT",
    category: "Ethnic",
    description: "Modern hybrid outerwear cape combining bandhani-inspired chunri textile paneling with raw canvas streetwear drapes.",
    details: [
      "Fabric: Bandhani Cotton Blend & Raw Canvas",
      "Closure: Open-front with Tactical Nylon Strap Tie",
      "Detailing: Frayed Raw Edges & Neon Stitching",
      "Edition: Made to Order"
    ],
    images: [
      "/assets/campaign/nas1.webp",
      "/assets/campaign/nas2.avif"
    ],
    isFeatured: true,
    isNavratriEdit: true,
    sizes: ["S/M", "L/XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "₹3,000 – ₹4,200",
    minPrice: "3000",
    maxPrice: "4200",
    priceDisplayMode: "PRICE_RANGE",
    customizationInfo: "Provide your own Bandhani fabric or choose from our hand-loomed options.",
    sizingInfo: "Custom drape length and sleeve width can be configured to requirement.",
    sourceAttribution: "VENM Hybrid Kimono Reference",
    tags: ["NavratriEdit", "Ethnic", "IndoWestern", "Hybrid"],
    garmentCare: "Dry clean only."
  },
  {
    id: "vnm-005",
    slug: "kinetic-asymmetric-kurta-nas5",
    name: "KINETIC ASYMMETRIC KURTA",
    collectionSlug: "indo-western",
    collectionName: "INDO-WESTERN",
    category: "Ethnic",
    description: "Minimalist blackout kurta featuring an asymmetric diagonal front placket, high Mandarin collar, and concealed utility pocket.",
    details: [
      "Fabric: Structured Linen-Viscose Blend",
      "Placket: Diagonal Concealed Zip & Snap Buttons",
      "Length: Asymmetric Knee-length Hemline",
      "Fit: Tailored Modern Fit"
    ],
    images: [
      "/assets/campaign/nas5.webp",
      "/assets/campaign/nas4.webp"
    ],
    isFeatured: true,
    isNavratriEdit: false,
    sizes: ["S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹2,100",
    minPrice: "2100",
    maxPrice: "2800",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Choice of linen-viscose, silk-cotton, or raw khadi base fabric.",
    sizingInfo: "Tailored to your body measurements or standard sizes.",
    sourceAttribution: "VENM Indo-Western Silhouette",
    tags: ["IndoWestern", "Ethnic", "Minimalist"],
    garmentCare: "Hand wash or gentle machine wash."
  },
  {
    id: "vnm-006",
    slug: "venom-400gsm-heavy-hoodie",
    name: "VENM KINETIC 400GSM HOODIE",
    collectionSlug: "street",
    collectionName: "STREETWEAR",
    category: "Outerwear",
    description: "Ultra-heavyweight 400GSM loopback fleece hoodie with double-lined hood, seamless kangaroo pocket, and tonal embroidered logo on cuff.",
    details: [
      "Fabric: 400 GSM Heavy Loopback French Terry",
      "Hood: Double-layer Structured Hood without Drawstrings",
      "Embroidery: Tonal VENM Icon on Left Sleeve",
      "Ribbing: 2x2 Heavy Rib Cuffs and Hem"
    ],
    images: [
      "/assets/products/Jean Jacket.jpg",
      "/assets/products/Denim Jacket.jpg"
    ],
    isFeatured: true,
    isNavratriEdit: false,
    sizes: ["XS", "S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹2,600",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Custom embroidery placement and dye washes available upon request.",
    sizingInfo: "Standard boxy streetwear fit or custom chest dimensions.",
    sourceAttribution: "VENM Kinetic Streetwear",
    tags: ["Streetwear", "Hoodie", "Outerwear", "Essential"],
    garmentCare: "Machine wash cold inside out. Flat dry."
  },
  {
    id: "vnm-007",
    slug: "tactical-garba-cargo-pant-den5",
    name: "TACTICAL GARBA CARGO PANT",
    collectionSlug: "denim",
    collectionName: "RAW DENIM",
    category: "Bottoms",
    description: "Ripstop cotton cargo pants featuring dual expanding 3D bellows pockets, adjustable ankle bungee cords, and subtle garba ring topstitching.",
    details: [
      "Fabric: Heavy Duty Cotton Ripstop",
      "Pockets: 8 Functional Storage Pockets",
      "Ankles: Bungee Cords for Adjustable Taper",
      "Waist: Integrated Nylon Belt with Cobra Buckle"
    ],
    images: [
      "/assets/products/download (5).jpg",
      "/assets/products/download (7).jpg"
    ],
    isFeatured: false,
    isNavratriEdit: true,
    sizes: ["S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹2,400",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Custom hardware finishes, pocket counts, and ankle bungee details.",
    sizingInfo: "Adjustable waist and custom length tailoring available.",
    sourceAttribution: "VENM Cargo Reference",
    tags: ["Cargo", "Denim", "Tactical", "Bottoms"],
    garmentCare: "Machine wash cold with like colors."
  },
  {
    id: "vnm-008",
    slug: "venm-canvas-tote-bag",
    name: "VENM UTILITY CANVAS TOTE",
    collectionSlug: "accessories",
    collectionName: "ACCESSORIES",
    category: "Accessories",
    description: "Heavy duty 16oz waxed canvas shopper bag with webbed handles, internal laptop sleeve, and high-contrast VENM typographic print.",
    details: [
      "Material: 16oz Heavyweight Waxed Canvas",
      "Capacity: 25 Liters with Padded Laptop Divider",
      "Straps: Dual Reinforced Nylon Webbing Straps",
      "Print: Water-based Screenprint"
    ],
    images: [
      "/assets/products/DIY ethnic tie made with oxidised jewellery pieces.jpg"
    ],
    isFeatured: false,
    isNavratriEdit: false,
    sizes: ["ONE SIZE"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹1,100",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Custom monogramming or oxidised jewellery attachment customization.",
    sizingInfo: "Standard 25 Liter dimension or custom bag sizes.",
    sourceAttribution: "VENM Gear Reference",
    tags: ["Accessories", "Tote", "Canvas"],
    garmentCare: "Wipe clean with a damp cloth."
  },
  {
    id: "vnm-009",
    slug: "mirrorwork-bomber-jacket-jac4",
    name: "MIRRORWORK CYBER BOMBER",
    collectionSlug: "navratri",
    collectionName: "NAVRATRI EDIT",
    category: "Outerwear",
    description: "High-impact MA-1 flight jacket updated with reflective Gujarati mirror studs across the spine and safety neon green inner lining.",
    details: [
      "Shell: Heavyweight Satin Finish Flight Nylon",
      "Lining: Safety Neon Green Thermal Quilt",
      "Embroidery: Reflective Mirror Stud Matrix on Back",
      "Detailing: Utility Sleeve Pocket with VENM Ribbon"
    ],
    images: [
      "/assets/products/Manfinity Hypemode Men's Autumn Patchwork Geometric Pattern Long Sleeve Single-Breasted Casual Denim Jacket.jpg"
    ],
    isFeatured: true,
    isNavratriEdit: true,
    sizes: ["S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "₹3,800 – ₹5,000",
    minPrice: "3800",
    maxPrice: "5000",
    priceDisplayMode: "PRICE_RANGE",
    customizationInfo: "Custom lining colors, mirror stud density, and bespoke sleeve embroidery.",
    sizingInfo: "Fitted bomber or oversized flight silhouette according to preference.",
    sourceAttribution: "VENM Bomber Reference",
    tags: ["NavratriEdit", "Bomber", "Outerwear", "Mirrorwork"],
    garmentCare: "Specialist dry clean only."
  },
  {
    id: "vnm-010",
    slug: "y2k-cyber-polo-polo1",
    name: "Y2K KINETIC ZIP POLO",
    collectionSlug: "y2k",
    collectionName: "Y2K KINETIC",
    category: "Tops",
    description: "Textured ribbed piqué polo shirt featuring a chrome metal quarter-zip, contrast shoulder piping, and fitted retro athletic collar.",
    details: [
      "Fabric: Cotton-Elastane Ribbed Piqué",
      "Zipper: Custom Chrome VENM Pull Tab",
      "Piping: Silver Metallic Piping across Shoulders",
      "Fit: Slim Athletic Cut"
    ],
    images: [
      "/assets/products/post 1.jpg",
      "/assets/products/post2.jpg"
    ],
    isFeatured: false,
    isNavratriEdit: false,
    sizes: ["S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹1,650",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Custom piping contrast colors and zip hardware finishes.",
    sizingInfo: "Custom length and shoulder measurements available.",
    sourceAttribution: "VENM Y2K Reference",
    tags: ["Y2K", "Polo", "Tops", "Athletic"],
    garmentCare: "Machine wash cold inside out."
  },
  {
    id: "vnm-011",
    slug: "gujarat-street-over-shirt-jac7",
    name: "GUJARAT STREET OVERSHIRT",
    collectionSlug: "ethnic",
    collectionName: "CONTEMPORARY ETHNIC",
    category: "Tops",
    description: "Relaxed boxy overshirt crafted from hand-loomed khadi cotton with contrast neon topstitching and deep chest flap pockets.",
    details: [
      "Fabric: Hand-loomed 100% Khadi Cotton",
      "Buttons: Natural Matte Horn Buttons",
      "Fit: Oversized Layering Fit",
      "Detailing: Neon Green Accent Stitching on Collar"
    ],
    images: [
      "/assets/products/Traditional vibes_ 💕.jpg"
    ],
    isFeatured: false,
    isNavratriEdit: true,
    sizes: ["S", "M", "L", "XL", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹2,200",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Provide your own saree/khadi fabric or choose our hand-loomed selections.",
    sizingInfo: "Custom layering fit or sharp structured cut.",
    sourceAttribution: "VENM Handloomed Overshirt Reference",
    tags: ["Ethnic", "Overshirt", "Handloomed", "Tops"],
    garmentCare: "Hand wash cold separately."
  },
  {
    id: "vnm-012",
    slug: "festive-embroidered-cap",
    name: "VENM KINETIC EMBROIDERED CAP",
    collectionSlug: "accessories",
    collectionName: "ACCESSORIES",
    category: "Accessories",
    description: "Unstructured 6-panel dad cap featuring high-density 3D embroidered VENM logo on front and subtle Gujarati bandhani printed under-visor.",
    details: [
      "Material: Heavy Twill Cotton",
      "Strapback: Metal Buckle Strapback Closure",
      "Under-visor: Custom Bandhani Printed Fabric",
      "Embroidery: 3D Raised Embroidery on Front"
    ],
    images: [
      "/assets/products/Jhumka ❤️.jpg"
    ],
    isFeatured: false,
    isNavratriEdit: true,
    sizes: ["ONE SIZE", "Custom"],
    availability: "REQUESTABLE",
    estimatedPrice: "Estimated from ₹950",
    priceDisplayMode: "STARTING_FROM",
    customizationInfo: "Under-visor fabric customization and custom initial embroidery.",
    sizingInfo: "Adjustable metal strapback fitting.",
    sourceAttribution: "VENM Accessory Reference",
    tags: ["Accessories", "Headwear", "Cap"],
    garmentCare: "Spot clean with damp cloth."
  }
];

// DATA QUERY HELPERS
export function getAllProducts() {
  return PRODUCTS;
}

export function getProductBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug || p.id === slug) || null;
}

export function getFeaturedProducts() {
  return PRODUCTS.filter((p) => p.isFeatured && p.availability !== 'DRAFT');
}

export function getNavratriProducts() {
  return PRODUCTS.filter((p) => (p.isNavratriEdit || p.collectionSlug === "navratri") && p.availability !== 'DRAFT');
}

export function getAllCollections() {
  return COLLECTIONS;
}

export function getCollectionBySlug(slug) {
  return COLLECTIONS.find((c) => c.slug === slug || c.id === slug) || null;
}

export function getProductsByCollection(slug) {
  if (!slug || slug === "all") return PRODUCTS.filter((p) => p.availability !== 'DRAFT');
  return PRODUCTS.filter((p) => p.collectionSlug === slug && p.availability !== 'DRAFT');
}

// REFERENCE MODEL FORMATTERS
export function formatReferencePrice(product) {
  if (!product) return 'Price on Request';
  const mode = product.priceDisplayMode || 'STARTING_FROM';
  if (mode === 'CUSTOM_QUOTE') {
    return 'Price on Request';
  }
  if (mode === 'PRICE_RANGE' && (product.minPrice || product.estimatedPrice?.includes('–'))) {
    if (product.minPrice && product.maxPrice) {
      const minStr = String(product.minPrice).startsWith('₹') ? product.minPrice : `₹${product.minPrice}`;
      const maxStr = String(product.maxPrice).startsWith('₹') ? product.maxPrice : `₹${product.maxPrice}`;
      return `Estimated: ${minStr} – ${maxStr}`;
    }
    return product.estimatedPrice.startsWith('Estimated') ? product.estimatedPrice : `Estimated price: ${product.estimatedPrice}`;
  }
  if (product.estimatedPrice) {
    if (product.estimatedPrice.toLowerCase().includes('estimated') || product.estimatedPrice.toLowerCase().includes('from') || product.estimatedPrice.toLowerCase().includes('request')) {
      return product.estimatedPrice;
    }
    const priceStr = String(product.estimatedPrice).startsWith('₹') ? product.estimatedPrice : `₹${product.estimatedPrice}`;
    return `Estimated from ${priceStr}`;
  }
  return 'Price on Request';
}

export function getReferenceStatusCTA(product) {
  if (!product) return { text: 'REQUEST THIS LOOK', isRequestable: true };
  const status = (product.availability || 'REQUESTABLE').toUpperCase();

  if (status === 'PAUSED' || status === 'REQUEST_PAUSED') {
    return { text: 'REQUESTS TEMPORARILY PAUSED', isRequestable: false };
  }
  if (status === 'COMING_SOON') {
    return { text: 'COMING SOON', isRequestable: false };
  }
  if (status === 'DRAFT') {
    return { text: 'DRAFT REFERENCE', isRequestable: false };
  }
  return { text: 'REQUEST THIS LOOK', isRequestable: true };
}

