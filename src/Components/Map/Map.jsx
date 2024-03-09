// import axios from "axios";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Image from "../../assets/Ellipse 2.svg";
import { ControlMenu } from "../ControlMenu/ControlMenu";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { CallTaxi } from "../CallTaxi/CallTaxi";
import { BackToHome } from "../BackToHome/BackToHome";
import { SelectTaxi } from "../SelectTaxi/SelectTaxi";
import { Routing } from "../Routing/Routing";
import { io } from "socket.io-client";

const socket = io("https://taxi-web-app-server-novda.koyeb.app/", {
  port: 3000,
});

function LocationMarker() {
  const [position, setPosition] = useState(null);

  const map = useMapEvents({
    locationfound(e) {
      map.flyTo(e.latlng, map.getZoom());
    },
    dblclick() {},
    moveend() {
      // axios(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${map.getCenter().lat}&lon=${map.getCenter().lng}`).then(function ({ data }) {
      //   console.log(data.address.road);
      //   console.log(data.display_name.split(", ", 2));
      // });
    },
  });
  map.setMaxZoom(18);
  map.setMinZoom(9);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((currentLocation) => {
      setPosition({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
    });
  }, []);

  const icon = L.icon({
    iconUrl: Image,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return position === null ? null : (
    <Marker icon={icon} position={position}></Marker>
  );
}

// eslint-disable-next-line react/prop-types
export const Map = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [position, setPosition] = useState(null);
  const [last, setLast] = useState(null);
  const [taxi, setTaxi] = useState(null);

  const uniqueId = Math.random().toString(36).substring(2, 7);
  socket.emit("clientJoined", {
    roomId: uniqueId,
  });

  socket.on("driverIsGoing", async (driverData) => {
    if (driverData) {
      navigate("/select-taxi");
      setTaxi(driverData);
    }
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((currentLocation) => {
      setPosition({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
    });
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leave", { left: true });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <>
      {position && (
        <MapContainer
          className="w-screen h-full flex"
          center={position}
          zoom={10}
          scrollWheelZoom={true}
        >
          <div className="w-screen z-[1000]">
            {location.pathname !== "/" ? (
              <BackToHome navigate={navigate} />
            ) : null}
            <Routes>
              <Route path="/" element={<ControlMenu />} />
              <Route
                path="/call-taxi"
                element={
                  <CallTaxi socket={socket} setLast={setLast} last={last} />
                }
              />
              <Route
                path="/select-taxi"
                element={
                  <SelectTaxi taxi={taxi} last={last} position={position} />
                }
              />
            </Routes>
          </div>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Routing position={position} last={last} />
          <LocationMarker />
        </MapContainer>
      )}
    </>
  );
};
