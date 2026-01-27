import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import haversine from "haversine";

const LIBRARIES = ["places"];

const CAFE_LOCATION = {
  lat: 22.7339544,
  lng: 87.5219511,
};

const MAX_DISTANCE_KM = 15;

// Dark Theme Style
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [mapTypeId, setMapTypeId] = useState("roadmap"); // Manage map mode state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const autocompleteRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- MAP OPTIONS ---
  const mapOptions = useMemo(() => ({
    styles: MAP_STYLE,
    
    // LOGIC: Show default Google toggle ONLY on Desktop (!isMobile)
    // On mobile, we hide it and use our custom button instead
    mapTypeControl: !isMobile, 
    mapTypeControlOptions: { position: 3 }, // Top Right

    streetViewControl: true,
    streetViewControlOptions: { position: 8 }, // Right Center
    zoomControl: true,
    zoomControlOptions: { position: 8 }, // Right Center
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: "greedy",
  }), [isMobile]);

  useEffect(() => {
    if (isLoaded && map && initialLocation?.lat && initialLocation?.lng) {
      processLocation(initialLocation.lat, initialLocation.lng);
      map.panTo(initialLocation);
      map.setZoom(15);
    }
  }, [isLoaded, map, initialLocation]);

  const extractAddressDetails = (result) => {
    const components = result.address_components || [];
    const getComponent = (types) => {
      const comp = components.find((c) => types.some((t) => c.types.includes(t)));
      return comp ? comp.long_name : "";
    };
    return {
      formatted_address: result.formatted_address || "",
      city: getComponent(["locality", "administrative_area_level_2"]),
      state: getComponent(["administrative_area_level_1"]),
      pincode: getComponent(["postal_code"]),
    };
  };

  const processLocation = async (lat, lng) => {
    const coords = { lat, lng };
    const dist = haversine(
      { latitude: CAFE_LOCATION.lat, longitude: CAFE_LOCATION.lng },
      { latitude: lat, longitude: lng },
      { unit: "km" }
    );
    const inRange = dist <= MAX_DISTANCE_KM;

    const geocoder = new window.google.maps.Geocoder();
    const response = await geocoder.geocode({ location: coords });

    if (!response.results?.length) return;
    const addressData = extractAddressDetails(response.results[0]);

    setSelectedPos(coords);
    setDistance(dist);
    setIsWithinRange(inRange);
    onLocationSelect(coords, inRange, addressData);
  };

  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    map.panTo({ lat, lng });
    map.setZoom(16);
    processLocation(lat, lng);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.panTo({ lat: latitude, lng: longitude });
        map.setZoom(16);
        processLocation(latitude, longitude);
        setLoadingLoc(false);
      },
      () => setLoadingLoc(false)
    );
  };

  // Toggle for custom mobile button
  const toggleMapType = () => {
    setMapTypeId((prev) => (prev === "roadmap" ? "hybrid" : "roadmap"));
  };

  if (!isLoaded) return <div className="animate-pulse h-[450px] bg-gray-800 rounded-xl" />;

  return (
    <div className="w-full">
      <h3 className="text-white text-xl font-semibold mb-3">Select Delivery Location</h3>
      
      <div className="relative w-full h-[450px] sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50">
        
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={selectedPos || CAFE_LOCATION}
          zoom={14}
          onLoad={setMap}
          mapTypeId={mapTypeId} // Controlled map type
          onClick={(e) => processLocation(e.latLng.lat(), e.latLng.lng())}
          options={mapOptions}
        >
          <Marker
            position={CAFE_LOCATION}
            label={{ text: "C", color: "white", fontWeight: "bold" }}
          />

          {selectedPos && (
            <Marker
              position={selectedPos}
              draggable={true}
              animation={window.google.maps.Animation.DROP}
              onDragEnd={(e) => processLocation(e.latLng.lat(), e.latLng.lng())}
            />
          )}
        </GoogleMap>

        {/* --- CUSTOM UI OVERLAYS --- */}

        {/* 1. Search Box (Full width on mobile) */}
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80 z-10">
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={onPlaceChanged}
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-3 border-0 rounded-xl leading-5 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-lg font-medium transition-all text-sm sm:text-base"
                placeholder="Search address..."
                type="search"
              />
            </div>
          </Autocomplete>
        </div>

        {/* 2. CUSTOM MAP TOGGLE BUTTON (Mobile Only) */}
        {/* We manually position this 'top-20' to sit exactly below the search bar */}
        {isMobile && (
          <button
            onClick={toggleMapType}
            className="absolute top-20 right-4 z-10 bg-white hover:bg-gray-100 text-gray-700 p-2.5 rounded-lg shadow-lg border border-gray-200 transition-all active:scale-95"
            title="Toggle Map View"
          >
            {mapTypeId === "roadmap" ? (
              // Satellite Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              // Map Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            )}
          </button>
        )}

        {/* 3. Locate Me Button */}
        <button
          onClick={handleCurrentLocation}
          className={`absolute right-4 z-10 bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-600 p-3 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 group
            ${distance !== null ? "bottom-28 sm:bottom-24" : "bottom-6"}`} 
          title="Use Current Location"
        >
          {loadingLoc ? (
            <svg className="animate-spin h-6 w-6 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:block font-semibold">Locate Me</span>
            </>
          )}
        </button>

        {/* 4. Distance Status Card */}
        {distance !== null && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-10">
            <div
              className={`px-4 py-3 sm:px-6 rounded-xl shadow-xl backdrop-blur-md border border-white/20 text-center transition-all transform animate-in slide-in-from-bottom-2 ${
                isWithinRange 
                  ? "bg-emerald-600/90 text-white" 
                  : "bg-rose-600/90 text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl font-bold">{distance.toFixed(1)}</span>
                <span className="text-sm font-medium opacity-90 mt-1">km away</span>
              </div>
              <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1 border-t border-white/20 pt-1">
                {isWithinRange ? "Delivery Available" : "Out of Range"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
