"use client";
import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Search_bar from "@/components/Search_bar";

/**
 * 
 
 This page has been archived.
 * 
 */

const Map_mode = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const uiRef = useRef(null);
  const platformRef = useRef(null);

  const [isClient, setIsClient] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [scriptsLoaded2, setScriptsLoaded2] = useState(false);
  const [scriptsLoaded3, setScriptsLoaded3] = useState(false);
  const [scriptsLoaded4, setScriptsLoaded4] = useState(false);

  const [bubble, setBubble] = useState(null);


  const api_key = process.env.NEXT_PUBLIC_HERE_MAPS_API_KEY;
  
  useEffect(() => {
    setIsClient(true);
  
    let retryCount = 0;
    const maxRetries = 50; // Retry for 50 intervals (total: 5 seconds)
    const intervalDelay = 100; // Interval delay in milliseconds
  
    const interval = setInterval(() => {
      if (
        scriptsLoaded &&
        scriptsLoaded2 &&
        scriptsLoaded3 &&
        scriptsLoaded4 &&
        typeof H !== "undefined" &&
        mapRef.current
      ) {
        clearInterval(interval);
  
        const platform = new H.service.Platform({
          apikey: api_key,
        });
        platformRef.current = platform;
  
        const defaultLayers = platform.createDefaultLayers();
  
        const map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
          center: { lat: 40.444611, lng: -79.952108 },
          zoom: 14,
        });
  
        mapInstance.current = map;
  
        const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
        const ui = H.ui.UI.createDefault(map, defaultLayers);
        uiRef.current = ui;
  
        setTimeout(() => {
          map.getViewPort().resize();
        }, 100);
  
        console.log("Map initialized successfully");
  
        // Add event listener for map click
        map.addEventListener("tap", (evt) => {
          const coord = map.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );
  
          showAddressBubble(coord);
        });
  
        return;
      }
  
      retryCount++;
      if (retryCount > maxRetries) {
        clearInterval(interval);
        console.error("Failed to initialize HERE Maps after multiple retries");
      }
    }, intervalDelay);
  
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [isClient, scriptsLoaded, scriptsLoaded2, scriptsLoaded3, scriptsLoaded4]);
  
  

  // Function to locate the current location of the user.
  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
  
          mapInstance.current.setCenter(userCoords);
          mapInstance.current.setZoom(14);
          
          // Remove any existing bubbles
          if (bubble) {
            uiRef.current.removeBubble(bubble);
          }
  
          // Initialize HERE Maps SearchService
          const searchService = platformRef.current.getSearchService();
  
          // Perform Reverse Geocoding
          searchService.reverseGeocode(
            {
              at: `${userCoords.lat},${userCoords.lng}`,
            },
            (result) => {
              if (result.items.length > 0) {
                const location = result.items[0].address;
                const locationInfo = `
                  <div>
                    <strong>Location Details</strong><br/>
                    ${location.label || "Address not found"}<br/>
                    <strong>ZIP Code:</strong> ${location.postalCode || "N/A"}
                  </div>
                `;
  
                // Create and show info bubble with location data
                const newBubble = new H.ui.InfoBubble(userCoords, {
                  content: locationInfo,
                });
                setBubble(newBubble);
                uiRef.current.addBubble(newBubble);
              } else {
                alert("Address not found for this location.");
              }
            },
            (error) => {
              console.error("Reverse geocoding failed:", error);
              alert("Failed to retrieve location details.");
            }
          );
        },
        (error) => {
          alert("Unable to retrieve your location. Please check location permissions.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };
  
  // Show the information of a location when the user clicks.
  const showAddressBubble = (coords) => {

    const searchService = platformRef.current.getSearchService();
  
    searchService.reverseGeocode(
      {
        at: `${coords.lat},${coords.lng}`,
      },
      (result) => {
        if (result.items.length > 0) {
          const location = result.items[0].address;
          const locationInfo = `
            <div>
              <strong>Location Details</strong><br/>
              ${location.label || "Address not found"}<br/>
              <strong>ZIP Code:</strong> ${location.postalCode || "N/A"}
            </div>
          `;
          
          // Remove all existing bubbles
          const bubbles = uiRef.current.getBubbles();
          bubbles.forEach((b) => uiRef.current.removeBubble(b));
  
          // Create and add a new bubble
          const newBubble = new H.ui.InfoBubble(coords, {
            content: locationInfo,
          });
          setBubble(newBubble);
          uiRef.current.addBubble(newBubble);
          
        } else {
          alert("No address found at this location.");
        }
      },
      (error) => {
        console.error("Reverse geocoding failed:", error);
        alert("Failed to retrieve address.");
      }
    );
  };

  // Geocode Address: Get coordinates from user input
  function geocodeAddress(platform, query, callback) {
      const geocoder = platform.getSearchService();
      geocoder.geocode(
        {
          q: query,
        },
        (result) => {
          if (result.items && result.items.length > 0) {
            const location = result.items[0].position;
            const locationInfo = result.items[0].address;
            callback(null, location, locationInfo);
          } else {
            callback("Location not found", null);
          }
        },
        (error) => {
          console.error("Geocoding failed:", error);
          callback("Error retrieving location", null);
        }
      );
    }
  
  // Handle Address Search
  function handleSearch(inputVal) {
      const query = inputVal.trim();
      if (query) {
        geocodeAddress(platformRef.current, query, (error, location, locationInfo) => {
          if (error) {
            alert(error);
          } else {
          const pos = location;
          const divInfo = `
            <div>
              <strong>Location Details</strong><br/>
              ${locationInfo.label || "Address not found"}<br/>
              <strong>ZIP Code:</strong> ${locationInfo.postalCode || "N/A"}
            </div>
          `;
          console.log(pos);
          const userCoords = {
            lat: pos.lat,
            lng: pos.lng,
          };
          mapInstance.current.setCenter(pos);
          // Remove all existing bubbles
          const bubbles = uiRef.current.getBubbles();
          bubbles.forEach((b) => uiRef.current.removeBubble(b));
  
          // Create and add a new bubble
          const newBubble = new H.ui.InfoBubble(userCoords, {
            content: divInfo,
          });
          setBubble(newBubble);
          uiRef.current.addBubble(newBubble);
          }
        });
      } else {
        alert("Please enter a valid address.");
      }
    }

  return (
    <div className="flex flex-col h-screen">
      {/* Load HERE Maps Scripts */}
      <Script
        src="https://js.api.here.com/v3/3.1/mapsjs-core.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(true)}
      />
      <Script
        src="https://js.api.here.com/v3/3.1/mapsjs-service.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded2(true)}
      />
      <Script
        src="https://js.api.here.com/v3/3.1/mapsjs-ui.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded3(true)}
      />
      <Script
        src="https://js.api.here.com/v3/3.1/mapsjs-mapevents.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded4(true)}
      />

      <link
        rel="stylesheet"
        href="https://js.api.here.com/v3/3.1/mapsjs-ui.css"
      />
      
      {/* Full-width Search Bar */}
      <div className="w-full flex justify-center">
        <div className="w-3/4 flex justify-center items-center space-x-4">  {/* Flex row & spacing */}
          <Search_bar 
              show_map_btn={false} 
              onSearch={(value) => {
                console.log("Search Value:", value);
                // Add logic to handle the search value here
                handleSearch(value);
              }} 
            />
          <button className="btn_md mt-5 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={locateUser}>
            Locate Me
          </button>
        </div>
      </div>
      

      <div id="map_container" className="flex justify-center mt-10">
        {isClient && (
          <div
            ref={mapRef}
            id="map"
            style={{
              width: "80vw",  // Adjust width to fit screen
              height: "400px", // Set height
            }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default Map_mode;







