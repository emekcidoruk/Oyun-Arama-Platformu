/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from "react";
import { Search, Star, ChevronDown, AlertCircle, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SteamSpyGame {
  appid: number;
  name: string;
  developer: string;
  publisher: string;
  score_rank: string;
  positive: number;
  negative: number;
  userscore: number;
  owners: string;
  average_forever: number;
  average_2weeks: number;
  median_forever: number;
  median_2weeks: number;
  price: string;
  initialprice: string;
  discount: string;
  ccu: number;
}

type SortOption = "rating" | "discount" | "price_asc" | "price_desc" | "name";

const GENRES = [
  "All", "Action", "Strategy", "RPG", "Indie", "Adventure", 
  "Sports", "Simulation", "MMO", "Free to Play", "Casual"
];

const SteamLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer spinning dashed ring */}
    <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" className="origin-center animate-[spin_12s_linear_infinite] opacity-40" />
    {/* Inner spinning dashed ring */}
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4" className="origin-center animate-[spin_8s_linear_infinite_reverse] opacity-60" />
    {/* Central glowing crystal */}
    <path d="M12 3L16 12L12 21L8 12L12 3Z" fill="currentColor" className="opacity-90 drop-shadow-[0_0_5px_currentColor]" />
    {/* Horizontal energy beam */}
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="drop-shadow-[0_0_3px_currentColor]" />
    {/* Core dot */}
    <circle cx="12" cy="12" r="2.5" fill="#0a0f16" />
  </svg>
);

export default function App() {
  const [games, setGames] = useState<SteamSpyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [showOnlyDeals, setShowOnlyDeals] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/games?genre=${encodeURIComponent(selectedGenre)}&deals=${showOnlyDeals}`);
        
        if (!response.ok) {
          let errorMsg = `API Error: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.error) errorMsg = errorData.error;
          } catch (e) {}
          throw new Error(errorMsg);
        }
        
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Sunucudan geçersiz veri formatı alındı");
        
        setGames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [selectedGenre, showOnlyDeals]);

  const filteredAndSortedGames = useMemo(() => {
    let result = [...games];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((game) => (game.name || "").toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      const discountA = parseInt(a.discount || "0");
      const discountB = parseInt(b.discount || "0");
      const priceA = parseInt(a.price || "0");
      const priceB = parseInt(b.price || "0");

      switch (sortBy) {
        case "discount": return discountB - discountA;
        case "price_asc": return priceA - priceB;
        case "price_desc": return priceB - priceA;
        case "name": return (a.name || "").localeCompare(b.name || "");
        case "rating": return (b.positive || 0) - (a.positive || 0);
        default: return 0;
      }
    });

    return result;
  }, [games, searchQuery, sortBy]);

  const formatPrice = (priceInCents: string | undefined) => {
    if (!priceInCents || priceInCents === "0") return "Ücretsiz";
    const price = parseInt(priceInCents) / 100;
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "USD" }).format(price);
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-slate-200 font-sans selection:bg-[#5eb2e6]/30 pb-20">
      
      {/* Hero Section */}
      <div className="relative pt-20 pb-12 overflow-hidden">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1b2838] via-[#0a0f16] to-[#0a0f16] opacity-80" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-[#5eb2e6]/5 blur-[120px] rounded-full transform -translate-y-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          
          {/* Exact Logo Match */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-5 mb-10"
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#1b2838] to-[#0a0f16] rounded-2xl rotate-3 flex items-center justify-center shadow-[0_0_30px_rgba(94,178,230,0.2)] border border-[#5eb2e6]/30 group hover:rotate-0 transition-transform duration-500">
              <div className="absolute inset-0 bg-[#5eb2e6]/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="-rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <SteamLogo className="w-9 h-9 sm:w-11 sm:h-11 text-[#5eb2e6] drop-shadow-[0_0_8px_rgba(94,178,230,0.8)]" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl tracking-wide flex items-center gap-2.5">
              <span className="font-black text-white tracking-wider">NEXUS</span>
              <span className="font-light text-[#5eb2e6]">OYUNLARI</span>
            </h1>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {["Popüler", "Yeni Çıkanlar", "İndirimdekiler"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "Popüler") {
                    setSelectedGenre("All");
                    setShowOnlyDeals(false);
                  } else if (tab === "Yeni Çıkanlar") {
                    setSelectedGenre("Yeni Çıkanlar");
                    setShowOnlyDeals(false);
                  } else if (tab === "İndirimdekiler") {
                    setSelectedGenre("All");
                    setShowOnlyDeals(true);
                  }
                }}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  (tab === "Popüler" && selectedGenre !== "Yeni Çıkanlar" && !showOnlyDeals) ||
                  (tab === "Yeni Çıkanlar" && selectedGenre === "Yeni Çıkanlar") ||
                  (tab === "İndirimdekiler" && showOnlyDeals && selectedGenre !== "Yeni Çıkanlar")
                    ? "bg-[#5eb2e6] text-[#0a0f16] shadow-[0_0_20px_rgba(94,178,230,0.4)]"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </motion.div>

          {/* Sleek Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-5xl bg-[#111822]/80 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-4"
          >
            {/* Search */}
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-full py-3.5 pl-14 pr-6 text-white placeholder-slate-500 focus:outline-none focus:border-[#5eb2e6]/50 focus:ring-1 focus:ring-[#5eb2e6]/50 transition-all"
                placeholder="Oyun ara..."
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center">
              {/* Genre Select */}
              {selectedGenre !== "Yeni Çıkanlar" && (
                <div className="relative">
                  <select 
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="bg-white/5 border border-white/5 rounded-full py-3.5 pl-6 pr-10 text-sm font-medium text-white appearance-none cursor-pointer hover:bg-white/10 transition-all focus:outline-none focus:border-[#5eb2e6]/50"
                  >
                    {GENRES.map(genre => (
                      <option key={genre} value={genre} className="bg-[#111822] text-white">
                        {genre === "All" ? "Tüm Türler" : genre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}

              {/* Sort Select */}
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-white/5 border border-white/5 rounded-full py-3.5 pl-6 pr-10 text-sm font-medium text-white appearance-none cursor-pointer hover:bg-white/10 transition-all focus:outline-none focus:border-[#5eb2e6]/50"
                >
                  <option value="rating" className="bg-[#111822]">En Popüler</option>
                  <option value="discount" className="bg-[#111822]">En Yüksek İndirim</option>
                  <option value="price_asc" className="bg-[#111822]">En Düşük Fiyat</option>
                  <option value="price_desc" className="bg-[#111822]">En Yüksek Fiyat</option>
                  <option value="name" className="bg-[#111822]">İsim (A-Z)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="absolute inset-0 bg-[#5eb2e6]/10 blur-2xl rounded-full" />
              <SteamLogo className="w-20 h-20 text-[#5eb2e6]/40 relative z-10" />
            </div>
            <motion.p 
              animate={{ opacity: [0.4, 1, 0.4] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-6 text-[#5eb2e6] font-medium tracking-widest uppercase text-sm"
            >
              Kütüphane Yükleniyor...
            </motion.p>
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto bg-[#111822] border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500/80 mx-auto mb-4" />
            <p className="text-red-400 mb-8 text-lg">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full font-medium transition-colors">
              Tekrar Dene
            </button>
          </motion.div>
        ) : filteredAndSortedGames.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-32">
            <Gamepad2 className="w-24 h-24 text-[#111822] mx-auto mb-6" />
            <h2 className="text-3xl font-light text-white">Sonuç Bulunamadı</h2>
            <p className="text-slate-500 mt-3 text-lg">Arama kriterlerinize uygun oyun bulunmuyor.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedGames.map((game) => {
                const discountPercent = parseInt(game.discount || "0");
                const highResImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`;
                const fallbackImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/capsule_231x87.jpg`;
                const totalReviews = (game.positive || 0) + (game.negative || 0);
                const ratingPercent = totalReviews > 0 ? Math.round((game.positive / totalReviews) * 100) : 0;
                
                return (
                  <motion.a
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3 }}
                    key={game.appid}
                    href={`https://store.steampowered.com/app/${game.appid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-2xl overflow-hidden bg-[#111822] border border-white/5 hover:border-[#5eb2e6]/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(94,178,230,0.15)] hover:-translate-y-2"
                  >
                    {/* Image Container - Fixed Aspect Ratio */}
                    <div className="relative w-full aspect-[460/215] overflow-hidden bg-[#0a0f16]">
                      <img
                        src={highResImage}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('capsule_231x87.jpg') && !target.src.includes('placehold.co')) {
                            target.src = fallbackImage;
                          } else if (!target.src.includes('placehold.co')) {
                            target.src = 'https://placehold.co/460x215/111822/5eb2e6?text=Resim+Yok';
                          }
                        }}
                        alt={game.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      
                      {/* Discount Badge */}
                      {discountPercent > 0 && (
                        <div className="absolute top-3 right-3 bg-[#a4d007] text-[#0a0f16] font-black px-2.5 py-1 rounded-lg text-sm shadow-[0_4px_20px_rgba(164,208,7,0.4)] z-10">
                          -{discountPercent}%
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-white mb-1.5 line-clamp-2 group-hover:text-[#5eb2e6] transition-colors leading-tight">
                        {game.name}
                      </h3>
                      <p className="text-xs text-slate-400 mb-5 truncate">
                        {game.publisher}
                      </p>
                      
                      <div className="mt-auto flex items-end justify-between">
                        {/* Rating */}
                        <div className="flex flex-col gap-1">
                          {totalReviews > 0 && (
                            <div className="flex items-center gap-1.5 text-[#5eb2e6] bg-[#5eb2e6]/10 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#5eb2e6]/20" title={`${game.positive} Olumlu İnceleme`}>
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>%{ratingPercent}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="text-right flex flex-col items-end">
                          {discountPercent > 0 && parseInt(game.initialprice) > parseInt(game.price) && (
                            <span className="text-xs text-slate-500 line-through mb-0.5 font-medium">
                              {formatPrice(game.initialprice)}
                            </span>
                          )}
                          <span className="text-lg font-black text-white drop-shadow-md">
                            {formatPrice(game.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}

