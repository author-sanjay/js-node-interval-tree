const express = require("express");
const app = express();

let clients = {};
let locations = {};

// Set interval for sending heartbeats
const heartbeatInterval = setInterval(() => {
  const heartbeatData = { heartbeat: true };
  sendSSEData([], heartbeatData);
}, 10000); // Send heartbeat every 10 seconds

app.get("/stream", (req, res) => {
  const screenId = req.query.screenId; // Get screen identifier from query parameter
  const locationIdsStr = req.query.locationIds; // Get location ids string from query parameter

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const locationIdsArr = locationIdsStr ? locationIdsStr.split(",") : []; // Convert location ids string to array
  locationIdsArr.forEach((locationId) => {
    // Add screen to each location
    if (!locations[locationId]) {
      locations[locationId] = []; // Create new array for the location if it doesn't exist
    }
    locations[locationId].push(screenId);
  });

  // Add new screen to the clients object with its identifier and location ids
  clients[screenId] = { res, locationIds: locationIdsArr };

  // Remove screen when the connection is closed
  req.on("close", () => {
    delete clients[screenId];
    locationIdsArr.forEach((locationId) => {
      locations[locationId] = locations[locationId].filter(
        (id) => id !== screenId
      );
    });
  });
});

// Function to send SSE data to specific screens or locations
function sendSSEData(screenIds, data, locationIdsArr) {
  try {
    console.log("hggh");
    Object.keys(clients).forEach((screenId) => {
      const screen = clients[screenId];
      if (
        screenIds.length === 0 || // Check if screenIds is empty
        (locationIdsArr.length > 0 &&
          locationIdsArr.some((locationId) =>
            screen.locationIds.includes(locationId)
          )) // Check if at least one locationId matches one of the screen's locationIds
      ) {
        console.log("Hello0");
        try {
          screen.res.write(`data: ${JSON.stringify(data)}\n`);
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log("Hello");
      }
    });
  } catch (e) {
    console.log(e);
  }
}

// Example usage: send SSE data to a specific screen or location

app.get("/test", (req, res) => {
  const screenId = req.query.screenId; // Get screen identifier from query parameter
  const locationIdsStr = req.query.locationIds; // Get location ids string from query parameter
  const data=req.query.data;
  

  // Add new screen to the clients object with its identifier and location ids
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
const screenId = "";
const locationId = "";
const data = { message: true };
console.log("hgj");
sendSSEData([], data);
console.log("hgjkhgh");
module.exports = {
  sendSSEData,
};
