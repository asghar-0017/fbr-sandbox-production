// HS Code Caching Utility
// This utility provides caching for HS codes to improve response times

const HS_CODE_CACHE_KEY = "fbr_hs_codes_cache";
const HS_CODE_CACHE_TIMESTAMP_KEY = "fbr_hs_codes_cache_timestamp";
const UOM_CACHE_KEY = "fbr_uom_cache";
const UOM_CACHE_TIMESTAMP_KEY = "fbr_uom_cache_timestamp";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fallback UOM data for common scenarios when API fails
const FALLBACK_UOM_DATA = {
  "0101.10.00": [
    { uoM_ID: "kg", description: "Kilogram" },
    { uoM_ID: "pcs", description: "Pieces" },
  ],
  "0101.90.00": [
    { uoM_ID: "kg", description: "Kilogram" },
    { uoM_ID: "pcs", description: "Pieces" },
  ],
  "0102.10.00": [
    { uoM_ID: "kg", description: "Kilogram" },
    { uoM_ID: "pcs", description: "Pieces" },
  ],
  "0102.90.00": [
    { uoM_ID: "kg", description: "Kilogram" },
    { uoM_ID: "pcs", description: "Pieces" },
  ],
  // Add more common HS codes as needed
  default: [
    { uoM_ID: "kg", description: "Kilogram" },
    { uoM_ID: "pcs", description: "Pieces" },
    { uoM_ID: "ltr", description: "Litre" },
    { uoM_ID: "mtr", description: "Meter" },
    { uoM_ID: "sqm", description: "Square Meter" },
    { uoM_ID: "cbm", description: "Cubic Meter" },
    { uoM_ID: "ton", description: "Ton" },
    { uoM_ID: "g", description: "Gram" },
    { uoM_ID: "ml", description: "Millilitre" },
    { uoM_ID: "cm", description: "Centimeter" },
    { uoM_ID: "mm", description: "Millimeter" },
    { uoM_ID: "km", description: "Kilometer" },
    { uoM_ID: "doz", description: "Dozen" },
    { uoM_ID: "pair", description: "Pair" },
    { uoM_ID: "set", description: "Set" },
    { uoM_ID: "box", description: "Box" },
    { uoM_ID: "carton", description: "Carton" },
    { uoM_ID: "bottle", description: "Bottle" },
    { uoM_ID: "can", description: "Can" },
    { uoM_ID: "bag", description: "Bag" },
    { uoM_ID: "roll", description: "Roll" },
    { uoM_ID: "sheet", description: "Sheet" },
    { uoM_ID: "unit", description: "Unit" },
    { uoM_ID: "bill_of_lading", description: "Bill of lading" },
    { uoM_ID: "sqy", description: "SqY" },
  ],
};

class HSCodeCache {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = null;
    this.uomCache = {};
    this.uomCacheTimestamp = null;
    this.isLoading = false;
    this.loadingPromise = null;
    this.uomLoadingPromises = {};
  }

  // Check if cache is valid (not expired)
  isCacheValid() {
    if (!this.cacheTimestamp) return false;
    const now = Date.now();
    return now - this.cacheTimestamp < CACHE_DURATION;
  }

  // Load cache from localStorage
  loadFromStorage() {
    try {
      const cachedData = localStorage.getItem(HS_CODE_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(HS_CODE_CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        this.cache = JSON.parse(cachedData);
        this.cacheTimestamp = parseInt(cachedTimestamp);
        console.log("HS Code cache loaded from storage:", {
          count: this.cache.length,
          timestamp: new Date(this.cacheTimestamp).toLocaleString(),
        });
        return true;
      }
    } catch (error) {
      console.error("Error loading HS code cache from storage:", error);
      this.clearCache();
    }
    return false;
  }

  // Save cache to localStorage
  saveToStorage() {
    try {
      localStorage.setItem(HS_CODE_CACHE_KEY, JSON.stringify(this.cache));
      localStorage.setItem(
        HS_CODE_CACHE_TIMESTAMP_KEY,
        this.cacheTimestamp.toString()
      );
      console.log("HS Code cache saved to storage:", {
        count: this.cache.length,
        timestamp: new Date(this.cacheTimestamp).toLocaleString(),
      });
    } catch (error) {
      console.error("Error saving HS code cache to storage:", error);
    }
  }

  // Clear cache
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
    localStorage.removeItem(HS_CODE_CACHE_KEY);
    localStorage.removeItem(HS_CODE_CACHE_TIMESTAMP_KEY);
    console.log("HS Code cache cleared");
  }

  // Force refresh cache from FBR API
  async forceRefreshCache(environment = "sandbox") {
    console.log("Forcing refresh of HS codes cache from FBR API...");
    this.clearCache();
    return await this.getHSCodes(environment, true);
  }

  // Get HS codes with caching - now uses backend API
  async getHSCodes(environment = "sandbox", forceRefresh = false) {
    // If already loading, return the existing promise
    if (this.isLoading && this.loadingPromise) {
      console.log("HS Code fetch already in progress, waiting...");
      return this.loadingPromise;
    }

    // Force refresh to always get fresh data from FBR API
    if (!forceRefresh) {
      forceRefresh = true; // Always fetch from API
    }

    // Check if we have valid cache and don't need to force refresh
    if (!forceRefresh && this.isCacheValid()) {
      console.log("Using cached HS codes:", this.cache.length);
      return this.cache;
    }

    // Load from storage if not in memory
    if (!this.cache && !forceRefresh) {
      if (this.loadFromStorage() && this.isCacheValid()) {
        return this.cache;
      }
    }

    // Fetch fresh data from FBR API
    this.isLoading = true;
    this.loadingPromise = this.fetchHSCodesFromBackend(
      environment,
      forceRefresh
    );

    try {
      const result = await this.loadingPromise;
      return result;
    } catch (error) {
      console.error("Failed to fetch HS codes from FBR API:", error);

      // If we have stale cache, return it as fallback
      if (this.cache && this.cache.length > 0) {
        console.log("Using stale cache as fallback");
        return this.cache;
      }

      // Use fallback data if no cache available
      console.log("Using fallback HS codes data");
      this.cache = this.getFallbackHSCodes();
      this.cacheTimestamp = Date.now();
      this.saveToStorage();
      return this.cache;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  // Fetch HS codes from FBR API
  async fetchHSCodesFromBackend(environment, forceRefresh) {
    console.log("Fetching HS codes from FBR API...");
    const startTime = Date.now();

    try {
      const { API_CONFIG } = await import("../API/Api.js");
      const token = API_CONFIG.getCurrentToken(environment);

      if (!token) {
        throw new Error(`No ${environment} token available`);
      }

      const { fetchData } = await import("../API/GetApi.jsx");
      const response = await fetchData("pdi/v1/itemdesccode", environment);

      if (response && Array.isArray(response)) {
        // Transform the response to match our expected format
        this.cache = response.map((item) => ({
          hS_CODE: item.hs_code || item.hS_CODE || item.code,
          description: item.description || item.desc || item.item_description,
        }));
        this.cacheTimestamp = Date.now();

        // Save to storage
        this.saveToStorage();

        const duration = Date.now() - startTime;
        console.log(
          `HS codes fetched from FBR API in ${duration}ms:`,
          this.cache.length
        );

        return this.cache;
      } else {
        throw new Error("Invalid response format from FBR API");
      }
    } catch (error) {
      console.error("Error fetching HS codes from FBR API:", error);

      // Fallback to hardcoded data if API fails
      console.log("Falling back to hardcoded HS codes data");
      this.cache = this.getFallbackHSCodes();
      this.cacheTimestamp = Date.now();
      this.saveToStorage();

      return this.cache;
    }
  }

  // Search HS codes with optimization
  searchHSCodes(searchTerm, limit = 50) {
    if (!this.cache || !searchTerm) {
      return [];
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();

    // If search term is too short, return empty to avoid overwhelming results
    if (normalizedSearch.length < 2) {
      return [];
    }

    const results = this.cache.filter((item) => {
      const codeMatch = item.hS_CODE.toLowerCase().includes(normalizedSearch);
      const descMatch =
        item.description &&
        item.description.toLowerCase().includes(normalizedSearch);
      return codeMatch || descMatch;
    });

    // Sort by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aCodeExact = a.hS_CODE.toLowerCase().startsWith(normalizedSearch);
      const bCodeExact = b.hS_CODE.toLowerCase().startsWith(normalizedSearch);

      if (aCodeExact && !bCodeExact) return -1;
      if (!aCodeExact && bCodeExact) return 1;

      return 0;
    });

    return results.slice(0, limit);
  }

  // Search HS codes using local cache for better performance
  async searchHSCodesFromBackend(
    searchTerm,
    limit = 50,
    environment = "sandbox"
  ) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    console.log("Searching HS codes locally with term:", searchTerm);

    // Use local search since we have the full HS codes cache from FBR API
    return this.searchHSCodes(searchTerm, limit);
  }

  // Test FBR API connectivity and endpoint availability
  async testBackendConnectivity(environment = "sandbox") {
    console.log("Testing FBR API connectivity...");

    try {
      const { API_CONFIG } = await import("../API/Api.js");
      const token = API_CONFIG.getCurrentToken(environment);

      if (!token) {
        console.error("No token available for environment:", environment);
        return { success: false, error: "No token available" };
      }

      // Test HS codes endpoint
      const { fetchData } = await import("../API/GetApi.jsx");

      try {
        const hsCodesResponse = await fetchData(
          "pdi/v1/itemdesccode",
          environment
        );
        return {
          success: true,
          hsCodesEndpoint: "Working",
          hasData: Array.isArray(hsCodesResponse),
          dataLength: Array.isArray(hsCodesResponse)
            ? hsCodesResponse.length
            : 0,
          sampleData:
            Array.isArray(hsCodesResponse) && hsCodesResponse.length > 0
              ? hsCodesResponse[0]
              : null,
        };
      } catch (hsError) {
        return {
          success: false,
          error: `HS codes endpoint failed: ${hsError.message}`,
          status: hsError.response?.status,
        };
      }
    } catch (error) {
      console.error("FBR API connectivity test failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Fallback HS codes data for when backend is not available
  getFallbackHSCodes() {
    // Return a small set of common HS codes as fallback
    return [
      {
        hS_CODE: "0101.10.00",
        description: "Live horses, pure-bred breeding animals",
      },
      {
        hS_CODE: "0101.90.00",
        description: "Live horses, other than pure-bred breeding animals",
      },
      {
        hS_CODE: "0102.10.00",
        description: "Live asses, pure-bred breeding animals",
      },
      {
        hS_CODE: "0102.90.00",
        description: "Live asses, other than pure-bred breeding animals",
      },
      {
        hS_CODE: "0103.10.00",
        description: "Live swine, pure-bred breeding animals",
      },
      {
        hS_CODE: "0103.91.00",
        description: "Live swine, weighing less than 50 kg",
      },
      {
        hS_CODE: "0103.92.00",
        description: "Live swine, weighing 50 kg or more",
      },
      {
        hS_CODE: "0104.10.00",
        description: "Live sheep, pure-bred breeding animals",
      },
      {
        hS_CODE: "0104.20.00",
        description: "Live sheep, other than pure-bred breeding animals",
      },
      {
        hS_CODE: "0105.11.00",
        description: "Live goats, pure-bred breeding animals",
      },
      {
        hS_CODE: "0105.12.00",
        description: "Live goats, other than pure-bred breeding animals",
      },
      {
        hS_CODE: "0106.11.00",
        description: "Live poultry, turkeys, weighing not more than 185 g",
      },
      {
        hS_CODE: "0106.12.00",
        description: "Live poultry, turkeys, weighing more than 185 g",
      },
      { hS_CODE: "0106.19.00", description: "Live poultry, turkeys, other" },
      { hS_CODE: "0106.20.00", description: "Live poultry, guinea fowls" },
      {
        hS_CODE: "0106.31.00",
        description: "Live poultry, ducks, weighing not more than 185 g",
      },
      {
        hS_CODE: "0106.32.00",
        description: "Live poultry, ducks, weighing more than 185 g",
      },
      { hS_CODE: "0106.39.00", description: "Live poultry, ducks, other" },
      {
        hS_CODE: "0106.41.00",
        description: "Live poultry, geese, weighing not more than 185 g",
      },
      {
        hS_CODE: "0106.42.00",
        description: "Live poultry, geese, weighing more than 185 g",
      },
      { hS_CODE: "0106.49.00", description: "Live poultry, geese, other" },
      { hS_CODE: "0106.90.00", description: "Live poultry, other" },
      {
        hS_CODE: "0201.10.00",
        description:
          "Meat of bovine animals, fresh or chilled, carcasses and half-carcasses",
      },
      {
        hS_CODE: "0201.20.00",
        description:
          "Meat of bovine animals, fresh or chilled, other cuts with bone in",
      },
      {
        hS_CODE: "0201.30.00",
        description: "Meat of bovine animals, fresh or chilled, boneless",
      },
      {
        hS_CODE: "0202.10.00",
        description:
          "Meat of bovine animals, frozen, carcasses and half-carcasses",
      },
      {
        hS_CODE: "0202.20.00",
        description: "Meat of bovine animals, frozen, other cuts with bone in",
      },
      {
        hS_CODE: "0202.30.00",
        description: "Meat of bovine animals, frozen, boneless",
      },
      {
        hS_CODE: "0203.11.00",
        description:
          "Meat of swine, fresh, chilled or frozen, fresh or chilled, carcasses and half-carcasses",
      },
      {
        hS_CODE: "0203.12.00",
        description:
          "Meat of swine, fresh, chilled or frozen, fresh or chilled, hams, shoulders and cuts thereof, with bone in",
      },
      {
        hS_CODE: "0203.19.00",
        description:
          "Meat of swine, fresh, chilled or frozen, fresh or chilled, other",
      },
      {
        hS_CODE: "0203.21.00",
        description:
          "Meat of swine, fresh, chilled or frozen, frozen, carcasses and half-carcasses",
      },
      {
        hS_CODE: "0203.22.00",
        description:
          "Meat of swine, fresh, chilled or frozen, frozen, hams, shoulders and cuts thereof, with bone in",
      },
      {
        hS_CODE: "0203.29.00",
        description: "Meat of swine, fresh, chilled or frozen, frozen, other",
      },
      {
        hS_CODE: "0204.10.00",
        description:
          "Meat of sheep or goats, fresh, chilled or frozen, carcasses and half-carcasses of lamb, fresh or chilled",
      },
      {
        hS_CODE: "0204.21.00",
        description:
          "Meat of sheep or goats, fresh, chilled or frozen, carcasses and half-carcasses of sheep, frozen",
      },
      {
        hS_CODE: "0204.22.00",
        description:
          "Meat of sheep or goats, fresh, chilled or frozen, carcasses and half-carcasses of goat, frozen",
      },
      {
        hS_CODE: "0204.30.00",
        description:
          "Meat of sheep or goats, fresh, chilled or frozen, other cuts with bone in",
      },
      {
        hS_CODE: "0204.41.00",
        description:
          "Meat of sheep or goats, fresh, chilled or frozen, boneless, of sheep",
      },
      {
        hS_CODE: "0204.42.00",
        description:
          "Meat of sheep or goats, fresh, chilled or frozen, boneless, of goat",
      },
      {
        hS_CODE: "0205.00.00",
        description:
          "Meat of horses, asses, mules or hinnies, fresh, chilled or frozen",
      },
      {
        hS_CODE: "0206.10.00",
        description:
          "Edible offal of bovine animals, swine, sheep, goats, horses, asses, mules or hinnies, fresh or chilled, of bovine animals",
      },
      {
        hS_CODE: "0206.20.00",
        description:
          "Edible offal of bovine animals, swine, sheep, goats, horses, asses, mules or hinnies, fresh or chilled, of swine",
      },
      {
        hS_CODE: "0206.30.00",
        description:
          "Edible offal of bovine animals, swine, sheep, goats, horses, asses, mules or hinnies, fresh or chilled, of sheep",
      },
      {
        hS_CODE: "0206.41.00",
        description:
          "Edible offal of bovine animals, swine, sheep, goats, horses, asses, mules or hinnies, fresh or chilled, of goats",
      },
      {
        hS_CODE: "0206.49.00",
        description:
          "Edible offal of bovine animals, swine, sheep, goats, horses, asses, mules or hinnies, fresh or chilled, of other animals",
      },
      {
        hS_CODE: "0206.80.00",
        description:
          "Edible offal of bovine animals, swine, sheep, goats, horses, asses, mules or hinnies, frozen",
      },
      {
        hS_CODE: "0207.11.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, fresh or chilled, of fowls of the species Gallus domesticus",
      },
      {
        hS_CODE: "0207.12.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, fresh or chilled, of turkeys",
      },
      {
        hS_CODE: "0207.13.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, fresh or chilled, of ducks, geese or guinea fowls",
      },
      {
        hS_CODE: "0207.14.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, fresh or chilled, of other poultry",
      },
      {
        hS_CODE: "0207.24.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, frozen, of turkeys",
      },
      {
        hS_CODE: "0207.25.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, frozen, of ducks, geese or guinea fowls",
      },
      {
        hS_CODE: "0207.26.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, frozen, of other poultry",
      },
      {
        hS_CODE: "0207.27.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, not cut in pieces, frozen, of fowls of the species Gallus domesticus",
      },
      {
        hS_CODE: "0207.32.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, fresh or chilled, of fowls of the species Gallus domesticus",
      },
      {
        hS_CODE: "0207.33.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, fresh or chilled, of turkeys",
      },
      {
        hS_CODE: "0207.34.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, fresh or chilled, of ducks, geese or guinea fowls",
      },
      {
        hS_CODE: "0207.35.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, fresh or chilled, of other poultry",
      },
      {
        hS_CODE: "0207.36.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, frozen, of fowls of the species Gallus domesticus",
      },
      {
        hS_CODE: "0207.37.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, frozen, of turkeys",
      },
      {
        hS_CODE: "0207.38.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, frozen, of ducks, geese or guinea fowls",
      },
      {
        hS_CODE: "0207.39.00",
        description:
          "Meat and edible offal, of the poultry of heading 01.05, fresh, chilled or frozen, cuts and offal, frozen, of other poultry",
      },
      {
        hS_CODE: "0208.10.00",
        description:
          "Other meat and edible meat offal, fresh, chilled or frozen, of rabbits or hares",
      },
      {
        hS_CODE: "0208.20.00",
        description:
          "Other meat and edible meat offal, fresh, chilled or frozen, of frogs' legs",
      },
      {
        hS_CODE: "0208.30.00",
        description:
          "Other meat and edible meat offal, fresh, chilled or frozen, of primates",
      },
      {
        hS_CODE: "0208.40.00",
        description:
          "Other meat and edible meat offal, fresh, chilled or frozen, of whales, dolphins and porpoises (mammals of the order Cetacea); of manatees and dugongs (mammals of the order Sirenia)",
      },
      {
        hS_CODE: "0208.50.00",
        description:
          "Other meat and edible meat offal, fresh, chilled or frozen, of reptiles (including snakes and turtles)",
      },
      {
        hS_CODE: "0208.60.00",
        description:
          "Other meat and edible meat offal, fresh, chilled or frozen, of camels and other camelids (Camelidae)",
      },
      {
        hS_CODE: "0208.90.00",
        description:
          "Other meat and edible meat offal, fresh, chilled or frozen, other",
      },
      {
        hS_CODE: "0209.00.00",
        description:
          "Pig fat, free of lean meat, and poultry fat, not rendered or otherwise extracted, fresh, chilled, frozen, salted, in brine, dried or smoked",
      },
      {
        hS_CODE: "0210.11.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, hams, shoulders and cuts thereof, with bone in",
      },
      {
        hS_CODE: "0210.12.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, bellies (streaky) and cuts thereof",
      },
      {
        hS_CODE: "0210.19.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, other",
      },
      {
        hS_CODE: "0210.20.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, of bovine animals",
      },
      {
        hS_CODE: "0210.91.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, of other animals, including edible flours and meals of meat or meat offal, primates",
      },
      {
        hS_CODE: "0210.92.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, of other animals, including edible flours and meals of meat or meat offal, whales, dolphins and porpoises (mammals of the order Cetacea); of manatees and dugongs (mammals of the order Sirenia)",
      },
      {
        hS_CODE: "0210.93.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, of other animals, including edible flours and meals of meat or meat offal, reptiles (including snakes and turtles)",
      },
      {
        hS_CODE: "0210.99.00",
        description:
          "Meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, meat and edible meat offal, salted, in brine, dried or smoked; edible flours and meals of meat or meat offal, of other animals, including edible flours and meals of meat or meat offal, other",
      },
    ];
  }

  // Get cache status
  getCacheStatus() {
    return {
      hasCache: !!this.cache,
      cacheSize: this.cache ? this.cache.length : 0,
      isValid: this.isCacheValid(),
      timestamp: this.cacheTimestamp
        ? new Date(this.cacheTimestamp).toLocaleString()
        : null,
      isLoading: this.isLoading,
    };
  }

  // Refresh cache
  async refreshCache(environment = "sandbox") {
    try {
      const { API_CONFIG } = await import("../API/Api.js");
      const token = API_CONFIG.getCurrentToken(environment);

      if (!token) {
        throw new Error(`No ${environment} token available`);
      }

      const response = await fetch(
        `/api/hs-codes/cache/refresh?environment=${environment}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to refresh cache");
      }

      // Update local cache
      this.cache = await this.getHSCodes(environment, true);
      return result;
    } catch (error) {
      console.error("Error refreshing cache:", error);
      throw error;
    }
  }

  // UOM Caching Methods
  // Check if UOM cache is valid
  isUOMCacheValid() {
    if (!this.uomCacheTimestamp) return false;
    const now = Date.now();
    return now - this.uomCacheTimestamp < CACHE_DURATION;
  }

  // Load UOM cache from localStorage
  loadUOMFromStorage() {
    try {
      const cachedData = localStorage.getItem(UOM_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(UOM_CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        this.uomCache = JSON.parse(cachedData);
        this.uomCacheTimestamp = parseInt(cachedTimestamp);
        console.log("UOM cache loaded from storage:", {
          count: Object.keys(this.uomCache).length,
          timestamp: new Date(this.uomCacheTimestamp).toLocaleString(),
        });
        return true;
      }
    } catch (error) {
      console.error("Error loading UOM cache from storage:", error);
      this.clearUOMCache();
    }
    return false;
  }

  // Save UOM cache to localStorage
  saveUOMToStorage() {
    try {
      localStorage.setItem(UOM_CACHE_KEY, JSON.stringify(this.uomCache));
      localStorage.setItem(
        UOM_CACHE_TIMESTAMP_KEY,
        this.uomCacheTimestamp.toString()
      );
      console.log("UOM cache saved to storage:", {
        count: Object.keys(this.uomCache).length,
        timestamp: new Date(this.uomCacheTimestamp).toLocaleString(),
      });
    } catch (error) {
      console.error("Error saving UOM cache to storage:", error);
    }
  }

  // Clear UOM cache
  clearUOMCache() {
    this.uomCache = {};
    this.uomCacheTimestamp = null;
    localStorage.removeItem(UOM_CACHE_KEY);
    localStorage.removeItem(UOM_CACHE_TIMESTAMP_KEY);
    console.log("UOM cache cleared");
  }

  // Get UOM for a specific HS code with caching and fallback
  async getUOM(hsCode, environment = "sandbox", forceRefresh = false) {
    if (!hsCode) {
      console.warn("No HS code provided for UOM lookup");
      return FALLBACK_UOM_DATA.default;
    }

    // If already loading for this HS code, return the existing promise
    if (this.uomLoadingPromises[hsCode] && !forceRefresh) {
      console.log(`UOM fetch already in progress for ${hsCode}, waiting...`);
      return this.uomLoadingPromises[hsCode];
    }

    // Check if we have valid cache and don't need to force refresh
    if (!forceRefresh && this.uomCache[hsCode] && this.isUOMCacheValid()) {
      console.log(`Using cached UOM for ${hsCode}:`, this.uomCache[hsCode]);
      return this.uomCache[hsCode];
    }

    // Load from storage if not in memory
    if (!this.uomCache[hsCode] && !forceRefresh) {
      if (
        this.loadUOMFromStorage() &&
        this.uomCache[hsCode] &&
        this.isUOMCacheValid()
      ) {
        return this.uomCache[hsCode];
      }
    }

    // Fetch fresh data from FBR API
    this.uomLoadingPromises[hsCode] = this.fetchUOMFromAPI(hsCode, environment);

    try {
      const result = await this.uomLoadingPromises[hsCode];
      return result;
    } finally {
      // Clean up the loading promise
      delete this.uomLoadingPromises[hsCode];
    }
  }

  // Fetch UOM from FBR API with retry logic and fallback
  async fetchUOMFromAPI(hsCode, environment = "sandbox") {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { API_CONFIG } = await import("../API/Api.js");
        const token = API_CONFIG.getCurrentToken(environment);

        if (!token) {
          // Silent fallback for missing token
          return this.getFallbackUOM(hsCode);
        }

        const { fetchData } = await import("../API/GetApi.jsx");
        const response = await fetchData(
          `pdi/v2/HS_UOM?hs_code=${hsCode}&annexure_id=3`,
          environment
        );

        if (response && Array.isArray(response)) {
          // Cache the successful response
          this.uomCache[hsCode] = response;
          this.uomCacheTimestamp = Date.now();
          this.saveUOMToStorage();

          console.log(`UOM fetched successfully for ${hsCode}:`, response);
          return response;
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        // Only log on final attempt to reduce console noise
        if (attempt === maxRetries) {
          console.log(`UOM API unavailable for ${hsCode}, using fallback data`);
          return this.getFallbackUOM(hsCode);
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt)
        );
      }
    }
  }

  // Get fallback UOM data
  getFallbackUOM(hsCode) {
    // Check if we have specific fallback data for this HS code
    if (FALLBACK_UOM_DATA[hsCode]) {
      return FALLBACK_UOM_DATA[hsCode];
    }

    // Use default fallback data
    return FALLBACK_UOM_DATA.default;
  }

  // Get UOM cache status
  getUOMCacheStatus() {
    return {
      hasCache: Object.keys(this.uomCache).length > 0,
      cacheSize: Object.keys(this.uomCache).length,
      isValid: this.isUOMCacheValid(),
      timestamp: this.uomCacheTimestamp
        ? new Date(this.uomCacheTimestamp).toLocaleString()
        : null,
      cachedHSCodes: Object.keys(this.uomCache),
    };
  }

  // Refresh UOM cache for a specific HS code
  async refreshUOMCache(hsCode, environment = "sandbox") {
    if (!hsCode) {
      throw new Error("HS code is required to refresh UOM cache");
    }

    try {
      const result = await this.getUOM(hsCode, environment, true);
      console.log(`UOM cache refreshed for ${hsCode}:`, result);
      return result;
    } catch (error) {
      console.error(`Error refreshing UOM cache for ${hsCode}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const hsCodeCache = new HSCodeCache();

export default hsCodeCache;
