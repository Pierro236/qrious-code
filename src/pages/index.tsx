import React, { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ChromePicker } from "react-color";

// ─── Types ───────────────────────────────────────────────────────────────────

type LogoPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type QrMode = "url" | "vcard";

interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  website: string;
  title: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildVCardString(v: VCardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${v.lastName};${v.firstName};;;`,
    `FN:${v.firstName} ${v.lastName}`.trim(),
    v.company ? `ORG:${v.company}` : "",
    v.title ? `TITLE:${v.title}` : "",
    v.phone ? `TEL;TYPE=CELL:${v.phone}` : "",
    v.email ? `EMAIL:${v.email}` : "",
    v.website ? `URL:${v.website}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
}

/** Compute absolute pixel position of the logo inside the QR code canvas */
function getLogoStyle(
  position: LogoPosition,
  qrSize: number,
  logoSize: number
): React.CSSProperties {
  const pad = 8; // px from edge
  const half = (qrSize - logoSize) / 2;

  const positions: Record<LogoPosition, React.CSSProperties> = {
    center: { top: half, left: half },
    "top-left": { top: pad, left: pad },
    "top-right": { top: pad, right: pad },
    "bottom-left": { bottom: pad, left: pad },
    "bottom-right": { bottom: pad, right: pad },
  };
  return { position: "absolute", ...positions[position] };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<QrMode>("url");
  const [text, setText] = useState("");
  const [vcard, setVcard] = useState<VCardData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    website: "",
    title: "",
  });

  const [qrColor, setQrColor] = useState("#1e40af");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("center");

  const [showQrColorPicker, setShowQrColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("QR Code téléchargé avec succès !");
  const [canShareToGallery, setCanShareToGallery] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);
  const qrColorPickerRef = useRef<HTMLDivElement>(null);
  const bgColorPickerRef = useRef<HTMLDivElement>(null);

  const QR_SIZE = 240;
  const LOGO_SIZE = 56;

  // Check if Web Share API (with files) is supported → mobile gallery save
  useEffect(() => {
    setCanShareToGallery(
      typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator
    );
  }, []);

  // Click outside → close pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        qrColorPickerRef.current &&
        !qrColorPickerRef.current.contains(event.target as Node)
      )
        setShowQrColorPicker(false);
      if (
        bgColorPickerRef.current &&
        !bgColorPickerRef.current.contains(event.target as Node)
      )
        setShowBgColorPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape → close pickers
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowQrColorPicker(false);
        setShowBgColorPicker(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  // ── Computed QR value ──
  const qrValue =
    mode === "vcard" ? buildVCardString(vcard) : text;

  const hasContent =
    mode === "url"
      ? !!text.trim()
      : !!(vcard.firstName || vcard.lastName || vcard.phone || vcard.email);

  // ── Logo upload ──
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setLogo(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Build PNG blob from the hidden canvas ──
  const buildPngBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Find the canvas rendered by QRCodeCanvas
      const canvas = qrRef.current?.querySelector("canvas");
      if (!canvas) return reject(new Error("Canvas introuvable"));

      const size = QR_SIZE + 48; // 24px padding each side
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const ctx = off.getContext("2d");
      if (!ctx) return reject(new Error("Contexte 2D introuvable"));

      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);

      // QR code
      ctx.drawImage(canvas, 24, 24, QR_SIZE, QR_SIZE);

      // Logo overlay
      if (logo) {
        const img = new Image();
        img.onload = () => {
          const logoBox = LOGO_SIZE + 8; // logo + padding
          const half = (size - logoBox) / 2;
          const pad = 8 + 24; // edge padding + canvas padding

          const posMap: Record<LogoPosition, { x: number; y: number }> = {
            center: { x: half, y: half },
            "top-left": { x: pad, y: pad },
            "top-right": { x: size - pad - logoBox, y: pad },
            "bottom-left": { x: pad, y: size - pad - logoBox },
            "bottom-right": {
              x: size - pad - logoBox,
              y: size - pad - logoBox,
            },
          };

          const { x, y } = posMap[logoPosition];

          // White background card behind logo
          ctx.fillStyle = "#ffffff";
          roundRect(ctx, x, y, logoBox, logoBox, 8);
          ctx.fill();

          // Draw logo
          ctx.drawImage(img, x + 4, y + 4, LOGO_SIZE, LOGO_SIZE);

          off.toBlob((blob) => {
            blob ? resolve(blob) : reject(new Error("Blob null"));
          }, "image/png");
        };
        img.onerror = reject;
        img.src = logo;
      } else {
        off.toBlob((blob) => {
          blob ? resolve(blob) : reject(new Error("Blob null"));
        }, "image/png");
      }
    });
  }, [logo, logoPosition, bgColor]);

  // ── Download ──
  const handleDownload = async () => {
    setIsLoading(true);
    setShowSuccess(false);
    try {
      const blob = await buildPngBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "qrious-code.png";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setSuccessMsg("QR Code téléchargé dans vos téléchargements !");
      setShowSuccess(true);
    } catch (err) {
      console.error("Erreur téléchargement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Save to gallery (Web Share API with files) ──
  const handleSaveToGallery = async () => {
    setIsLoading(true);
    setShowSuccess(false);
    try {
      const blob = await buildPngBlob();
      const file = new File([blob], "qrious-code.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "QR Code",
          text: "Mon QR Code Qrious",
        });
        setSuccessMsg("QR Code partagé / enregistré dans la galerie !");
        setShowSuccess(true);
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "qrious-code.png";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setSuccessMsg("QR Code téléchargé (galerie non disponible sur ce navigateur).");
        setShowSuccess(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Erreur galerie:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Position picker UI config ──
  const positionOptions: { value: LogoPosition; label: string; icon: string }[] =
    [
      { value: "top-left", label: "↖ Haut gauche", icon: "↖" },
      { value: "top-right", label: "↗ Haut droite", icon: "↗" },
      { value: "center", label: "⊕ Centre", icon: "⊕" },
      { value: "bottom-left", label: "↙ Bas gauche", icon: "↙" },
      { value: "bottom-right", label: "↘ Bas droite", icon: "↘" },
    ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Qrious Code</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-slate-600">
              <span>Générateur de QR codes personnalisés</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm gap-1">
            <button
              onClick={() => setMode("url")}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === "url"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              🔗 URL / Texte
            </button>
            <button
              onClick={() => setMode("vcard")}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === "vcard"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              👤 vCard (contact)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          {/* ── Left panel ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Personnalisation</h2>
              </div>

              <div className="space-y-6">
                {/* ── URL mode ── */}
                {mode === "url" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      URL ou message
                    </label>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Entrez une URL ou un message..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Entrez une URL complète (ex: https://example.com) ou un message texte
                    </p>
                  </div>
                )}

                {/* ── vCard mode ── */}
                {mode === "vcard" && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      📱 Ce QR code ouvrira une fiche contact sur les smartphones.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Prénom</label>
                        <input
                          type="text"
                          value={vcard.firstName}
                          onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                          placeholder="Jean"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom</label>
                        <input
                          type="text"
                          value={vcard.lastName}
                          onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                          placeholder="Dupont"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone</label>
                      <input
                        type="tel"
                        value={vcard.phone}
                        onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={vcard.email}
                        onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                        placeholder="jean.dupont@example.com"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Société</label>
                        <input
                          type="text"
                          value={vcard.company}
                          onChange={(e) => setVcard({ ...vcard, company: e.target.value })}
                          placeholder="Acme Corp"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Poste</label>
                        <input
                          type="text"
                          value={vcard.title}
                          onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                          placeholder="Développeur"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Site web</label>
                      <input
                        type="url"
                        value={vcard.website}
                        onChange={(e) => setVcard({ ...vcard, website: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 hover:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* ── Couleurs ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* QR color */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Couleur du QR code</label>
                    <div className="relative" ref={qrColorPickerRef}>
                      <button
                        onClick={() => setShowQrColorPicker(!showQrColorPicker)}
                        className="w-full h-12 border border-slate-300 rounded-xl flex items-center justify-between px-4 bg-slate-50 hover:bg-white transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: qrColor }} />
                          <span className="text-sm font-mono text-slate-700">{qrColor}</span>
                        </div>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showQrColorPicker && (
                        <div className="absolute z-20 mt-2">
                          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                            <ChromePicker color={qrColor} onChange={(c) => setQrColor(c.hex)} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BG color */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Couleur de fond</label>
                    <div className="relative" ref={bgColorPickerRef}>
                      <button
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                        className="w-full h-12 border border-slate-300 rounded-xl flex items-center justify-between px-4 bg-slate-50 hover:bg-white transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: bgColor }} />
                          <span className="text-sm font-mono text-slate-700">{bgColor}</span>
                        </div>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showBgColorPicker && (
                        <div className="absolute z-20 mt-2">
                          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                            <ChromePicker color={bgColor} onChange={(c) => setBgColor(c.hex)} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Logo ── */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Logo (optionnel)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">Formats acceptés: PNG, JPG, SVG. Taille recommandée: 64×64 px</p>
                </div>

                {/* ── Logo position ── */}
                {logo && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Position du logo</label>
                    <div className="grid grid-cols-5 gap-2">
                      {positionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setLogoPosition(opt.value)}
                          title={opt.label}
                          className={`h-11 rounded-xl text-lg font-medium transition-all duration-200 border ${
                            logoPosition === opt.value
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-md scale-105"
                              : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-white hover:border-blue-400"
                          }`}
                        >
                          {opt.icon}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 text-center">
                      {positionOptions.find((p) => p.value === logoPosition)?.label}
                    </p>
                  </div>
                )}

                {/* ── Action buttons ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    disabled={!hasContent || isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative overflow-hidden btn-hover-effect"
                  >
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      {isLoading ? (
                        <>
                          <div className="loading-spinner" />
                          <span>Génération...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Télécharger</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Save to gallery */}
                  <button
                    onClick={handleSaveToGallery}
                    disabled={!hasContent || isLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative overflow-hidden btn-hover-effect"
                    title={canShareToGallery ? "Enregistrer dans la galerie" : "Enregistrer (téléchargement)"}
                  >
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      {isLoading ? (
                        <>
                          <div className="loading-spinner" />
                          <span>Génération...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{canShareToGallery ? "Galerie 📲" : "Enregistrer"}</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {!hasContent && (
                  <p className="text-xs text-slate-500 text-center">
                    {mode === "url"
                      ? "Entrez d'abord un texte pour pouvoir télécharger le QR code"
                      : "Remplissez au moins un champ (prénom, nom, téléphone ou email)"}
                  </p>
                )}

                {/* Success message */}
                {showSuccess && (
                  <div className="success-message rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-800">{successMsg}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right panel: Preview ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Aperçu</h2>
              </div>

              <div className="flex justify-center">
                {/* This div wraps the canvas but is NOT used for export anymore */}
                <div
                  ref={qrRef}
                  className="p-6 rounded-2xl shadow-sm border border-slate-200 inline-block"
                  style={{ backgroundColor: bgColor }}
                >
                  {hasContent ? (
                    <div className="relative inline-block" style={{ width: QR_SIZE, height: QR_SIZE }}>
                      {/* QRCodeCanvas renders a real <canvas> element */}
                      <QRCodeCanvas
                        value={qrValue || " "}
                        size={QR_SIZE}
                        fgColor={qrColor}
                        bgColor={bgColor}
                        level="H"
                      />
                      {/* Logo overlay using CSS positioning */}
                      {logo && (
                        <div
                          style={{
                            ...getLogoStyle(logoPosition, QR_SIZE, LOGO_SIZE + 8),
                            width: LOGO_SIZE + 8,
                            height: LOGO_SIZE + 8,
                          }}
                          className="bg-white rounded-xl shadow-lg flex items-center justify-center p-1"
                        >
                          <img
                            src={logo}
                            alt="Logo"
                            style={{ width: LOGO_SIZE, height: LOGO_SIZE, objectFit: "contain" }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center bg-slate-50"
                      style={{ width: QR_SIZE, height: QR_SIZE }}
                    >
                      <div className="text-center px-4">
                        <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-500 text-sm font-medium">
                          {mode === "url"
                            ? "Entrez un texte pour voir l'aperçu"
                            : "Remplissez le formulaire pour voir l'aperçu"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* vCard summary */}
              {mode === "vcard" && hasContent && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 font-mono break-all">
                  <p className="text-slate-400 text-xs mb-1 font-sans font-medium">Données vCard encodées :</p>
                  {qrValue}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Conseils d'utilisation</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {[
                  "Utilisez des couleurs contrastées pour une meilleure lisibilité",
                  "Le logo doit être de petite taille pour ne pas altérer la lecture",
                  "Testez votre QR code avec différents scanners",
                  mode === "vcard"
                    ? "Le QR vCard est compatible iOS, Android et les applications de contacts"
                    : "Préférez HTTPS pour les URLs afin d'éviter les alertes de sécurité",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2025 Qrious Code. Générateur de QR codes personnalisés.</p>
            <p>Made with ❤️ by JGRPierro</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Helper: draw a rounded rect ──────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
