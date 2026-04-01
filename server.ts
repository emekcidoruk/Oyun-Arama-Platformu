import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route to fetch discounted games from Steam
  app.get("/api/specials", async (req, res) => {
    try {
      // Steam's featured categories endpoint includes a 'specials' section
      const response = await axios.get("https://store.steampowered.com/api/featuredcategories/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      
      // Extract the specials items
      const specials = response.data.specials?.items || [];
      res.json(specials);
    } catch (error) {
      console.error("Error fetching from Steam API:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch data from Steam API" });
    }
  });

  // API route to fetch games from SteamSpy
  app.get("/api/games", async (req, res) => {
    try {
      const { genre, page = "0", deals = "false" } = req.query;
      const isDealsOnly = deals === "true";
      
      const cacheKey = `games-${genre}-${page}-deals:${isDealsOnly}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      if (genre === "Yeni Çıkanlar") {
        // Fetch new releases directly from Steam API
        const response = await axios.get("https://store.steampowered.com/api/featuredcategories/", {
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
          }
        });

        const newReleases = response.data.new_releases?.items || [];
        
        // Map Steam API format to SteamSpy format
        let games = newReleases.map((item: any) => ({
          appid: item.id,
          name: item.name,
          developer: "Bilinmiyor", // Steam featured API doesn't provide developer
          publisher: "Bilinmiyor",
          score_rank: "",
          positive: 0,
          negative: 0,
          userscore: 0,
          owners: "Yeni",
          average_forever: 0,
          average_2weeks: 0,
          median_forever: 0,
          median_2weeks: 0,
          price: (item.final_price || 0).toString(),
          initialprice: (item.original_price || 0).toString(),
          discount: (item.discount_percent || 0).toString(),
          ccu: 0
        }));

        if (isDealsOnly) {
          games = games.filter((g: any) => parseInt(g.discount || "0") > 0);
        }

        cache.set(cacheKey, { data: games, timestamp: Date.now() });
        return res.json(games);
      }

      let url = `https://steamspy.com/api.php?request=all&page=${page}`;
      
      if (genre && genre !== "All") {
        url = `https://steamspy.com/api.php?request=genre&genre=${encodeURIComponent(genre as string)}`;
      }

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      
      if (typeof response.data !== 'object' || response.data === null) {
        throw new Error("SteamSpy API'den geçersiz veri alındı (HTML veya boş yanıt).");
      }
      
      // SteamSpy returns an object with appids as keys. Convert to array.
      let games = Object.values(response.data);
      
      // Filter out invalid entries (sometimes SteamSpy returns a "success" key or similar)
      games = games.filter((g: any) => g && g.appid && g.name);
      
      // Filter by deals if requested
      if (isDealsOnly) {
        games = games.filter((g: any) => parseInt(g.discount || "0") > 0);
      }
      
      if (games.length === 0) {
        throw new Error("SteamSpy API'den oyun verisi alınamadı veya tüm veriler geçersiz.");
      }
      
      // Sort by positive reviews to show best games first
      games.sort((a: any, b: any) => (b.positive || 0) - (a.positive || 0));
      
      // Limit to top 200 to keep payload reasonable and rendering fast
      const limitedGames = games.slice(0, 200);
      
      cache.set(cacheKey, { data: limitedGames, timestamp: Date.now() });
      
      res.json(limitedGames);
    } catch (error) {
      console.error("Error fetching from SteamSpy API:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch data from SteamSpy API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
