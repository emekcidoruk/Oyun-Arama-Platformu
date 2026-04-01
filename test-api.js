import axios from "axios";

async function test() {
  try {
    const response = await axios.get("https://steamspy.com/api.php?request=all&page=0", {
      headers: {
        "User-Agent": "SteamDealsApp/1.0",
        "Accept": "application/json"
      }
    });
    console.log("Status:", response.status);
    console.log("Data type:", typeof response.data);
    if (typeof response.data === "object") {
      const keys = Object.keys(response.data);
      console.log("Keys count:", keys.length);
      console.log("First key:", keys[0]);
      console.log("First item:", response.data[keys[0]]);
    } else {
      console.log("Data snippet:", String(response.data).substring(0, 200));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
